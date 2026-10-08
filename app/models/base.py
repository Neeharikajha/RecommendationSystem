from __future__ import annotations

from abc import ABC, abstractmethod

import numpy as np

from app.domain import Profile, TrainingData


class ScoringModel(ABC):
    name: str

    @abstractmethod
    def fit(self, data: TrainingData) -> ScoringModel: ...

    @abstractmethod
    def score(self, profile: Profile) -> np.ndarray:
        """One relevance score per catalog item (higher is better)."""