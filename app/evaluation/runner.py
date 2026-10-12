from __future__ import annotations

import time
from collections.abc import Callable, Iterable
from dataclasses import dataclass

import numpy as np
import pandas as pd

from app import metrics
from app.config import EvalConfig
from app.domain import Profile
from app.engine import Engine

Scorer = Callable[[Profile], np.ndarray]
DEFAULT_LAMBDAS = (0.5, 0.6, 0.7, 0.8, 0.9, 1.0)


def segment_scheme(edges: tuple[int, ...]) -> tuple[list[float], list[str]]:
    """Bin bounds and labels. Edges (30, 100) give '<30', '30-99', '100+'."""
    bounds = [0, *edges, np.inf]
    labels = [f"<{edges[0]}", *(f"{lo}-{hi - 1}" for lo, hi in zip(edges, edges[1:])), f"{edges[-1]}+"]
    return bounds, labels


def _head_mask(counts: np.ndarray, eligible: np.ndarray, share: float) -> np.ndarray:
    """Boolean mask of the `share` most-rated eligible items."""
    candidates = np.flatnonzero(eligible)
    size = max(1, int(len(candidates) * share))
    head = candidates[np.argsort(-counts[candidates], kind="stable")[:size]]
    mask = np.zeros(len(counts), dtype=bool)
    mask[head] = True
    return mask


class Benchmark:
    """Ground truth plus the catalog statistics needed to score a recommendation list."""

    def __init__(
        self,
        engine: Engine,
        relevant: pd.Series,
        k: int,
        *,
        segment_edges: tuple[int, ...],
        head_share: float,
    ) -> None:
        counts = engine.item_counts
        self.k = k
        self.relevant = relevant
        self.n_eligible = int(engine.eligible.sum())
        self.self_information = -np.log2((counts + 1) / (len(engine.user_ids) + 1))
        self.head = _head_mask(counts, engine.eligible, head_share)

        bounds, labels = segment_scheme(segment_edges)
        history = pd.Series(engine.matrix.getnnz(axis=1)).loc[relevant.index]   # training ratings per user
        self.segments = pd.cut(history, bins=bounds, labels=labels, right=False)

    @classmethod
    def from_config(cls, engine: Engine, relevant: pd.Series, cfg: EvalConfig) -> Benchmark:
        return cls(engine, relevant, cfg.k, segment_edges=cfg.segment_edges, head_share=cfg.head_share)

    def score_list(self, engine: Engine, ranked: np.ndarray, truth: set[int]) -> dict[str, float]:
        k = self.k
        return {
            "precision": metrics.precision_at_k(ranked, truth, k),
            "recall": metrics.recall_at_k(ranked, truth, k),
            "map": metrics.average_precision_at_k(ranked, truth, k),
            "ndcg": metrics.ndcg_at_k(ranked, truth, k),
            "diversity": metrics.diversity(engine.hybrid.content.similarity(ranked, ranked)),
            "novelty": metrics.novelty(ranked, self.self_information),
            "popularity_bias": metrics.popularity_bias(ranked, self.head),
        }


@dataclass(frozen=True)
class Strategy:
    """One way of producing a ranked list: which engine, which scorer, with or without MMR."""

    name: str
    engine: Engine
    scorer: Scorer
    diversify: bool = False
    mmr_lambda: float | None = None   # None = the engine's configured value


@dataclass(frozen=True)
class Run:
    per_user: pd.DataFrame   # one row per evaluated user, one column per metric
    coverage: float          # a property of the whole set of lists, so not per-user

    def summary(self) -> dict[str, float]:
        return {**self.per_user.mean().round(4).to_dict(), "coverage": round(self.coverage, 4)}

    def by_segment(self, segments: pd.Series) -> dict[str, dict[str, float]]:
        """Mean metrics per user segment (coverage is omitted: it is not meaningful on small groups)."""
        grouped = self.per_user.groupby(segments, observed=True)
        return {
            str(label): {**frame.mean().round(4).to_dict(), "users": len(frame)}
            for label, frame in grouped
        }


def run_strategy(strategy: Strategy, bench: Benchmark) -> Run:
    engine = strategy.engine
    rows: dict[int, dict[str, float]] = {}
    lists: list[np.ndarray] = []
    for user, truth in bench.relevant.items():
        profile = engine.profile_at(user)
        started = time.perf_counter()
        ranked = engine.select(
            strategy.scorer(profile), profile, bench.k,
            diversify=strategy.diversify, mmr_lambda=strategy.mmr_lambda,
        )
        latency_ms = (time.perf_counter() - started) * 1000
        rows[user] = {**bench.score_list(engine, ranked, truth), "latency_ms": latency_ms}
        lists.append(ranked)
    coverage = metrics.catalog_coverage(lists, bench.n_eligible)
    return Run(pd.DataFrame.from_dict(rows, orient="index"), coverage)


def sweep_mmr_lambda(
    engine: Engine, bench: Benchmark, lambdas: Iterable[float]
) -> dict[float, dict[str, float]]:
    """Full-pipeline metrics for each MMR λ (1.0 = no diversification). No retraining needed."""
    return {
        lam: run_strategy(Strategy(f"mmr-{lam}", engine, engine.hybrid.score, True, lam), bench).summary()
        for lam in lambdas
    }