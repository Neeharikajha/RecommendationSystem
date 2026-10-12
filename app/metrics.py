from __future__ import annotations

import numpy as np


def _hits(ranked: np.ndarray, relevant: set[int], k: int) -> np.ndarray:
    return np.array([item in relevant for item in ranked[:k]], dtype=float)


def precision_at_k(ranked, relevant, k) -> float:
    return float(_hits(ranked, relevant, k).sum() / k)


def recall_at_k(ranked, relevant, k) -> float:
    return float(_hits(ranked, relevant, k).sum() / len(relevant))


def average_precision_at_k(ranked, relevant, k) -> float:
    hits = _hits(ranked, relevant, k)
    precisions = np.cumsum(hits) / np.arange(1, len(hits) + 1)
    return float((precisions * hits).sum() / min(len(relevant), k))


def ndcg_at_k(ranked, relevant, k) -> float:
    hits = _hits(ranked, relevant, k)
    gain = (hits / np.log2(np.arange(2, len(hits) + 2))).sum()
    ideal = (1 / np.log2(np.arange(2, min(len(relevant), k) + 2))).sum()
    return float(gain / ideal)


def diversity(similarity: np.ndarray) -> float:
    """1 - mean pairwise similarity within one recommendation list."""
    n = len(similarity)
    if n < 2:
        return 0.0
    return float(1 - (similarity.sum() - np.trace(similarity)) / (n * (n - 1)))


def novelty(ranked: np.ndarray, self_information: np.ndarray) -> float:
    """Mean -log2(popularity) of recommended items: higher means less obvious picks."""
    return float(self_information[ranked].mean())


def catalog_coverage(lists: list[np.ndarray], n_eligible: int) -> float:
    return len(set(np.concatenate(lists).tolist())) / n_eligible

def popularity_bias(ranked: np.ndarray, head: np.ndarray) -> float:
    """Share of a list drawn from the head of the catalog (`head` is a boolean mask over items)."""
    return float(head[ranked].mean())