from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd
from scipy.sparse import csr_matrix


class NotFoundError(LookupError):
    """Raised when a user, movie or genre does not exist."""


@dataclass(frozen=True)
class TrainingData:
    matrix: csr_matrix      # users x items, values are ratings
    movies: pd.DataFrame    # positional index == item index


@dataclass(frozen=True)
class Profile:
    """A viewer's taste: the items they rated and how. Works for known and brand-new users alike."""

    items: np.ndarray
    ratings: np.ndarray

    @classmethod
    def from_row(cls, row: csr_matrix) -> Profile:
        return cls(row.indices.copy(), row.data.astype(np.float32))

    @classmethod
    def from_pairs(cls, pairs: dict[int, float]) -> Profile:
        return cls(
            np.fromiter(pairs.keys(), dtype=np.int64, count=len(pairs)),
            np.fromiter(pairs.values(), dtype=np.float32, count=len(pairs)),
        )

    def __len__(self) -> int:
        return len(self.items)

    def centered(self) -> np.ndarray:
        """Ratings relative to this viewer's own average (removes generous/harsh rater bias)."""
        return self.ratings - self.ratings.mean() if len(self) else self.ratings

    def liked(self, threshold: float) -> np.ndarray:
        return self.items[self.ratings >= threshold]