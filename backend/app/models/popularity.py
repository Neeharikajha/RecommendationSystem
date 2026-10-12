from __future__ import annotations

import numpy as np

from app.domain import Profile, TrainingData
from app.models.base import ScoringModel


class PopularityModel(ScoringModel):
    """Bayesian average rating: shrinks items with few votes toward the global mean."""

    name = "popularity"

    def __init__(self, quantile: float = 0.8) -> None:
        self._quantile = quantile
        self._scores = np.empty(0)

    def fit(self, data: TrainingData) -> PopularityModel:
        counts = data.matrix.getnnz(axis=0).astype(np.float64)
        sums = np.asarray(data.matrix.sum(axis=0), dtype=np.float64).ravel()
        global_mean = sums.sum() / counts.sum()
        prior = np.quantile(counts[counts > 0], self._quantile)  # votes needed to be "trusted"
        item_mean = np.divide(sums, counts, out=np.full_like(sums, global_mean), where=counts > 0)
        self._scores = (counts * item_mean + prior * global_mean) / (counts + prior)
        return self

    def score(self, profile: Profile) -> np.ndarray:
        return self._scores