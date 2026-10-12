from __future__ import annotations

from pathlib import Path

import matplotlib

matplotlib.use("Agg")  # headless: write files, never open a window
import matplotlib.pyplot as plt
import pandas as pd


def _save(fig: plt.Figure, path: Path) -> None:
    fig.tight_layout()
    fig.savefig(path, dpi=150)
    plt.close(fig)


def plot_mmr_tradeoff(sweep: dict[float, dict[str, float]], path: Path) -> None:
    """NDCG against diversity, one labelled point per λ."""
    lambdas = sorted(sweep)
    diversity = [sweep[lam]["diversity"] for lam in lambdas]
    ndcg = [sweep[lam]["ndcg"] for lam in lambdas]
    fig, ax = plt.subplots(figsize=(6, 4))
    ax.plot(diversity, ndcg, marker="o")
    for lam, x, y in zip(lambdas, diversity, ndcg):
        ax.annotate(f"λ={lam}", (x, y), textcoords="offset points", xytext=(6, 6), fontsize=8)
    ax.set(xlabel="Diversity (1 − mean pairwise similarity)", ylabel="NDCG@K",
           title="Accuracy vs diversity (MMR λ sweep)")
    _save(fig, path)


def plot_segments(ndcg: pd.DataFrame, path: Path) -> None:
    """Grouped bars: NDCG per model (rows) across user segments (columns)."""
    fig, ax = plt.subplots(figsize=(7, 4))
    ndcg.T.plot.bar(ax=ax, rot=0)
    ax.set(xlabel="Training ratings per user", ylabel="NDCG@K", title="Ranking quality by user activity")
    _save(fig, path)


def plot_svd_sensitivity(by_components: dict[int, float], path: Path) -> None:
    """Best validation NDCG found for each SVD size."""
    sizes = sorted(by_components)
    fig, ax = plt.subplots(figsize=(6, 4))
    ax.plot(sizes, [by_components[n] for n in sizes], marker="o")
    ax.set(xlabel="SVD components", ylabel="Best validation NDCG@K", title="Sensitivity to latent dimension")
    _save(fig, path)