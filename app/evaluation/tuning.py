from __future__ import annotations

import logging
from collections.abc import Iterator
from dataclasses import asdict, dataclass, replace
from itertools import product
from typing import Any

import numpy as np
import pandas as pd

from app import metrics
from app.config import BlendWeights, Settings
from app.data import Dataset
from app.domain import Profile
from app.engine import Engine
from app.evaluation.runner import (
    DEFAULT_LAMBDAS, Benchmark, Strategy, run_strategy, sweep_mmr_lambda,
)
from app.models.hybrid import combine

log = logging.getLogger(__name__)

Cache = dict[int, tuple[Profile, dict[str, np.ndarray]]]


@dataclass(frozen=True)
class SearchSpace:
    svd_components: tuple[int, ...] = (20, 50, 100)
    weight_step: float = 0.1
    min_weight: float = 0.1                          # every model keeps a voice: stays a hybrid
    collaborative_ramps: tuple[int, ...] = (10, 20, 40)
    content_ramps: tuple[int, ...] = (3, 10)
    mmr_lambdas: tuple[float, ...] = DEFAULT_LAMBDAS

    def blends(self) -> Iterator[BlendWeights]:
        """Every (collaborative, content, popularity) triple on the simplex x every ramp pair."""
        units = round(1 / self.weight_step)
        floor = round(self.min_weight / self.weight_step)
        for c in range(floor, units - 2 * floor + 1):
            for t in range(floor, units - c - floor + 1):
                weights = {"collaborative": c / units, "content": t / units, "popularity": (units - c - t) / units}
                for c_ramp, t_ramp in product(self.collaborative_ramps, self.content_ramps):
                    yield BlendWeights(**weights, collaborative_ramp=c_ramp, content_ramp=t_ramp)


@dataclass(frozen=True)
class Trial:
    svd_components: int
    blend: BlendWeights
    ndcg: float

    def as_dict(self) -> dict[str, Any]:
        return {"svd_components": self.svd_components, "blend": asdict(self.blend), "ndcg": round(self.ndcg, 4)}


@dataclass(frozen=True)
class TuningReport:
    overrides: dict[str, Any]   # what gets committed as reports/tuned_config.json
    details: dict[str, Any]     # the evidence: reports/tuning_results.json


def _cache_components(engine: Engine, users: pd.Index) -> Cache:
    """Per-user model scores. They do not depend on blend weights, so compute them once."""
    cache: Cache = {}
    for user in users:
        profile = engine.profile_at(user)
        parts = {name: p.astype(np.float32) for name, p in engine.hybrid.component_scores(profile).items()}
        cache[user] = (profile, parts)
    return cache


def _mean_ndcg(engine: Engine, cache: Cache, relevant: pd.Series, blend: BlendWeights, k: int) -> float:
    """Blend accuracy only (no MMR): diversity is tuned separately, in the λ sweep."""
    scores = []
    for user, truth in relevant.items():
        profile, parts = cache[user]
        ranked = engine.select(combine(blend, parts, len(profile)), profile, k, diversify=False)
        scores.append(metrics.ndcg_at_k(ranked, truth, k))
    return float(np.mean(scores))


def grid_search(train: Dataset, relevant: pd.Series, base: Settings, space: SearchSpace) -> list[Trial]:
    trials: list[Trial] = []
    for n_components in space.svd_components:
        engine = Engine(train, replace(base, svd_components=n_components))
        cache = _cache_components(engine, relevant.index)
        scored = [
            Trial(n_components, blend, _mean_ndcg(engine, cache, relevant, blend, base.evaluation.k))
            for blend in space.blends()
        ]
        trials += scored
        log.info("svd_components=%d: %d blends, best NDCG %.4f",
                 n_components, len(scored), max(t.ndcg for t in scored))
    return trials


def choose_lambda(sweep: dict[float, dict[str, float]], max_ndcg_loss: float) -> float:
    """The most diverse λ whose NDCG stays within `max_ndcg_loss` (relative) of the best."""
    best = max(m["ndcg"] for m in sweep.values())
    return min(lam for lam, m in sweep.items() if m["ndcg"] >= best * (1 - max_ndcg_loss))


def tune(
    train: Dataset, relevant: pd.Series, base: Settings, space: SearchSpace, max_ndcg_loss: float
) -> TuningReport:
    """Stage 1: SVD size and blend by NDCG. Stage 2: MMR λ by the accuracy/diversity rule."""
    trials = grid_search(train, relevant, base, space)
    best = max(trials, key=lambda t: t.ndcg)

    engine = Engine(train, replace(base, svd_components=best.svd_components, blend=best.blend))
    bench = Benchmark.from_config(engine, relevant, base.evaluation)
    sweep = sweep_mmr_lambda(engine, bench, space.mmr_lambdas)
    mmr_lambda = choose_lambda(sweep, max_ndcg_loss)

    default_engine = Engine(train, base)
    comparison = {
        "default": run_strategy(Strategy("default", default_engine, default_engine.hybrid.score, True), bench).summary(),
        "tuned": run_strategy(Strategy("tuned", engine, engine.hybrid.score, True, mmr_lambda), bench).summary(),
    }
    overrides = {"svd_components": best.svd_components, "mmr_lambda": mmr_lambda, "blend": asdict(best.blend)}
    details = {
        "objective": f"NDCG@{base.evaluation.k} on the validation fold (blend search, no MMR)",
        "search_space": asdict(space),
        "trials_evaluated": len(trials),
        "best_trial": best.as_dict(),
        "top_trials": [t.as_dict() for t in sorted(trials, key=lambda t: -t.ndcg)[:10]],
        "ndcg_by_svd_components": {
            n: round(max(t.ndcg for t in trials if t.svd_components == n), 4) for n in space.svd_components
        },
        "mmr_sweep": sweep,
        "max_ndcg_loss": max_ndcg_loss,
        "chosen_mmr_lambda": mmr_lambda,
        "validation_comparison": comparison,
    }
    return TuningReport(overrides, details)