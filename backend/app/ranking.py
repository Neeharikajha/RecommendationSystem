from __future__ import annotations

import numpy as np


def top_k(scores: np.ndarray, mask: np.ndarray, k: int) -> np.ndarray:
    """Indices of the k best-scoring items where mask is True, best first. O(n) selection."""
    candidates = np.flatnonzero(mask)
    k = min(k, len(candidates))
    if k <= 0:
        return candidates[:0]
    best = candidates[np.argpartition(-scores[candidates], k - 1)[:k]]
    return best[np.argsort(-scores[best], kind="stable")]


def mmr_rerank(
    candidates: np.ndarray, relevance: np.ndarray, similarity: np.ndarray, k: int, lam: float
) -> np.ndarray:
    """Maximal Marginal Relevance: greedily pick items that are relevant but unlike those already picked."""
    selected: list[int] = []
    remaining = list(range(len(candidates)))
    max_sim = np.zeros(len(candidates))
    while remaining and len(selected) < k:
        gain = lam * relevance[remaining] - (1 - lam) * max_sim[remaining]
        best = remaining[int(np.argmax(gain))]
        selected.append(best)
        remaining.remove(best)
        max_sim = np.maximum(max_sim, similarity[best])
    return candidates[selected]