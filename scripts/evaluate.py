"""Offline evaluation with a temporal per-user holdout.

Each user's most recent `test_fraction` of ratings is hidden; models train on the rest and must
surface the hidden items the user rated >= like_threshold.
Run: python -m scripts.evaluate
"""
from __future__ import annotations

import argparse
import json
import time
from collections import defaultdict
from dataclasses import replace

import numpy as np
import pandas as pd

from app import metrics
from app.config import settings
from app.data import load_dataset
from app.engine import Engine


def temporal_split(ratings: pd.DataFrame, test_fraction: float, min_ratings: int):
    ordered = ratings.sort_values(["user", "timestamp"], kind="stable")
    position = ordered.groupby("user").cumcount()
    size = ordered.groupby("user")["item"].transform("size")
    is_test = (size >= min_ratings) & (position >= size * (1 - test_fraction))
    return ordered[~is_test], ordered[is_test]


def evaluate_strategy(engine: Engine, scorer, diversify: bool, relevant: pd.Series, k: int, self_info: np.ndarray) -> dict:
    rows: dict[str, list[float]] = defaultdict(list)
    lists: list[np.ndarray] = []
    for user, truth in relevant.items():
        profile = engine.profile_at(user)
        started = time.perf_counter()
        ranked = engine.select(scorer(profile), profile, k, diversify=diversify)
        rows["latency_ms"].append((time.perf_counter() - started) * 1000)
        rows["precision"].append(metrics.precision_at_k(ranked, truth, k))
        rows["recall"].append(metrics.recall_at_k(ranked, truth, k))
        rows["map"].append(metrics.average_precision_at_k(ranked, truth, k))
        rows["ndcg"].append(metrics.ndcg_at_k(ranked, truth, k))
        rows["diversity"].append(metrics.diversity(engine.hybrid.content.similarity(ranked, ranked)))
        rows["novelty"].append(metrics.novelty(ranked, self_info))
        lists.append(ranked)
    summary = {name: round(float(np.mean(values)), 4) for name, values in rows.items()}
    summary["coverage"] = round(metrics.catalog_coverage(lists, int(engine.eligible.sum())), 4)
    return summary


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--k", type=int, default=10)
    parser.add_argument("--test-fraction", type=float, default=0.2)
    parser.add_argument("--min-ratings", type=int, default=10)
    args = parser.parse_args()

    dataset = load_dataset(settings.data_dir)
    train, test = temporal_split(dataset.ratings, args.test_fraction, args.min_ratings)
    engine = Engine(replace(dataset, ratings=train), settings)   # trained on train only: no leakage

    relevant = test[test["rating"] >= settings.like_threshold].groupby("user")["item"].agg(set)
    self_info = -np.log2((engine.item_counts + 1) / (len(engine.user_ids) + 1))
    hybrid = engine.hybrid

    strategies = {
        "popularity": (hybrid.popularity.score, False),
        "content": (hybrid.content.score, False),
        "collaborative": (hybrid.collaborative.score, False),
        "hybrid": (hybrid.score, False),
        "hybrid + MMR": (hybrid.score, True),
    }
    results = {
        name: evaluate_strategy(engine, scorer, diversify, relevant, args.k, self_info)
        for name, (scorer, diversify) in strategies.items()
    }

    print(f"Users evaluated: {len(relevant)} | K={args.k}\n")
    print(pd.DataFrame(results).T.to_string())

    settings.metrics_path.parent.mkdir(parents=True, exist_ok=True)
    settings.metrics_path.write_text(
        json.dumps({"k": args.k, "users_evaluated": len(relevant), "split": "temporal per-user holdout", "results": results}, indent=2)
    )


if __name__ == "__main__":
    main()