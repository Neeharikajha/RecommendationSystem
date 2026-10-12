"""Tune the hybrid on a validation fold and write reports/tuned_config.json.

Run: python -m scripts.tune
"""
from __future__ import annotations

import argparse
import json
import logging
from dataclasses import replace

from app.config import Settings
from app.data import load_dataset
from app.evaluation.plots import plot_mmr_tradeoff, plot_svd_sensitivity
from app.evaluation.splits import relevant_by_user, temporal_split
from app.evaluation.tuning import SearchSpace, tune


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--max-ndcg-loss", type=float, default=0.02,
                        help="relative NDCG we accept losing to gain diversity when choosing mmr_lambda")
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")

    base = Settings()   # always search from the hand-picked defaults, never from a previous tuning run
    cfg = base.evaluation
    dataset = load_dataset(base.data_dir)
    fold = temporal_split(dataset.ratings, cfg.test_fraction, cfg.validation_fraction, cfg.min_ratings).tuning
    train = replace(dataset, ratings=fold.train)
    relevant = relevant_by_user(fold.holdout, base.like_threshold)

    report = tune(train, relevant, base, SearchSpace(), args.max_ndcg_loss)

    out = base.metrics_path.parent
    out.mkdir(parents=True, exist_ok=True)
    base.tuned_path.write_text(json.dumps(report.overrides, indent=2))
    (out / "tuning_results.json").write_text(json.dumps(report.details, indent=2))
    plot_svd_sensitivity(report.details["ndcg_by_svd_components"], out / "tuning_svd.png")
    plot_mmr_tradeoff(report.details["mmr_sweep"], out / "tuning_mmr_validation.png")

    print(f"\nUsers (validation): {len(relevant)} | trials: {report.details['trials_evaluated']}")
    print(f"Chosen config: {json.dumps(report.overrides)}")
    for name, m in report.details["validation_comparison"].items():
        print(f"  {name:>8}: NDCG {m['ndcg']:.4f} | diversity {m['diversity']:.4f} | pop-bias {m['popularity_bias']:.3f}")


if __name__ == "__main__":
    main()