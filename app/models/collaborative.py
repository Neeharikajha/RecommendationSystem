from __future__ import annotations

import numpy as np
from scipy.sparse import csr_matrix
from sklearn.decomposition import TruncatedSVD
from sklearn.preprocessing import normalize

from app.domain import Profile, TrainingData
from app.models.base import ScoringModel


class CollaborativeModel(ScoringModel):
    """Truncated SVD on the user-mean-centered rating matrix, with fold-in for any profile."""

    name = "collaborative"

    def __init__(self, n_components: int = 50, seed: int = 42) -> None:
        self._n_components = n_components
        self._seed = seed
        self._factors = np.empty((0, 0), dtype=np.float32)      # (k, n_items)
        self._embeddings = np.empty((0, 0), dtype=np.float32)   # (n_items, k), unit length

    def fit(self, data: TrainingData) -> CollaborativeModel:
        centered = _center_rows(data.matrix)
        k = max(1, min(self._n_components, min(centered.shape) - 1))
        svd = TruncatedSVD(n_components=k, random_state=self._seed).fit(centered)
        self._factors = svd.components_.astype(np.float32)
        self._embeddings = normalize(self._factors.T)
        return self

    def score(self, profile: Profile) -> np.ndarray:
        if not len(profile):
            return np.zeros(self._factors.shape[1])
        taste = profile.centered() @ self._factors[:, profile.items].T   # fold-in: (k,)
        return taste @ self._factors

    def similarity(self, rows: np.ndarray, cols: np.ndarray | None = None) -> np.ndarray:
        right = self._embeddings if cols is None else self._embeddings[cols]
        return self._embeddings[rows] @ right.T


def _center_rows(matrix: csr_matrix) -> csr_matrix:
    """Subtract each user's mean from their *observed* ratings only."""
    centered = matrix.astype(np.float32)
    counts = np.diff(centered.indptr)
    sums = np.asarray(centered.sum(axis=1)).ravel()
    means = np.divide(sums, counts, out=np.zeros_like(sums), where=counts > 0)
    centered.data -= np.repeat(means, counts)
    return centered