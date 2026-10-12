"""Offline evaluation on the held-out test fold.

Trains on train+validation, reports on test. Run `python -m scripts.tune` first to tune on validation.
Run: python -m scripts.evaluate
"""
from __future__ import annotations

import json
from dataclasses import asdict, replace

import pandas as pd

from app.config import Settings, settings
from app.data import Dataset, load_dataset
from app.engine import Engine
from app.evaluation.plots import plot_mmr_tradeoff, plot_segments
from app.evaluation.runner import DEFAULT_LAMBDAS, Benchmark, Strategy, run_strategy, sweep_mmr_lambda
from app.evaluation.splits import relevant_by_user, temporal_split

CORE_MODELS = ["popularity", "content", "collaborative", "hybrid"]


def build_strategies(engine: Engine, train: Dataset) -> list[Strategy]:
    hybrid = engine.hybrid
    strategies = [
        Strategy("popularity", engine, hybrid.popularity.score),
        Strategy("content", engine, hybrid.content.score),
        Strategy("collaborative", engine, hybrid.collaborative.score),
        Strategy("hybrid", engine, hybrid.score),
        Strategy("hybrid + MMR", engine, hybrid.score, diversify=True),
    ]
    if settings != Settings():   # a tuned config is live: also show what tuning bought
        baseline = Engine(train, Settings())
        strategies.append(Strategy("hybrid (default cfg)", baseline, baseline.hybrid.score))
    return strategies


def print_verdict(ndcg: pd.DataFrame) -> None:
    """Say plainly, per segment, whether the hybrid wins. Report it either way."""
    print("Verdict (NDCG, core models)")
    for segment in ndcg.columns:
        column = ndcg.loc[CORE_MODELS, segment]
        leader = column.idxmax()
        note = "hybrid leads" if leader == "hybrid" else f"{leader} leads; hybrid is {column['hybrid'] / column[leader] - 1:+.1%}"
        print(f"  {segment:>6}: {note}")


def main() -> None:
    cfg = settings.evaluation
    dataset = load_dataset(settings.data_dir)
    fold = temporal_split(dataset.ratings, cfg.test_fraction, cfg.validation_fraction, cfg.min_ratings).final
    train = replace(dataset, ratings=fold.train)
    engine = Engine(train, settings)   # trained on train+validation only: no test leakage
    bench = Benchmark.from_config(engine, relevant_by_user(fold.holdout, settings.like_threshold), cfg)

    runs = {s.name: run_strategy(s, bench) for s in build_strategies(engine, train)}
    results = {name: run.summary() for name, run in runs.items()}
    segments = {name: run.by_segment(bench.segments) for name, run in runs.items()}
    tradeoff = sweep_mmr_lambda(engine, bench, DEFAULT_LAMBDAS)
    sizes = {str(label): int(n) for label, n in bench.segments.value_counts().sort_index().items()}

    ndcg = pd.DataFrame(
        {name: {seg: m["ndcg"] for seg, m in by_seg.items()} for name, by_seg in segments.items()}
    ).T
    print(f"Users evaluated: {len(bench.relevant)} | K={cfg.k} | segment sizes: {sizes}\n")
    print(pd.DataFrame(results).T.to_string(), "\n")
    print("NDCG by user activity (training ratings per user)")
    print(ndcg.to_string(), "\n")
    print_verdict(ndcg)

    out = settings.metrics_path.parent
    out.mkdir(parents=True, exist_ok=True)
    plot_segments(ndcg.loc[CORE_MODELS], out / "segments_ndcg.png")
    plot_mmr_tradeoff(tradeoff, out / "mmr_tradeoff.png")
    settings.metrics_path.write_text(json.dumps({
        "k": cfg.k,
        "users_evaluated": len(bench.relevant),
        "split": "temporal per-user holdout (train+validation -> test)",
        "config": {"svd_components": settings.svd_components, "mmr_lambda": settings.mmr_lambda,
                   "blend": asdict(settings.blend)},
        "segment_edges": list(cfg.segment_edges),
        "segment_sizes": sizes,
        "results": results,
        "segments": segments,
        "mmr_tradeoff": tradeoff,
    }, indent=2))


if __name__ == "__main__":
    main()