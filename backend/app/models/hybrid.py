from __future__ import annotations

from collections.abc import Mapping

import numpy as np
from scipy.stats import rankdata

from app.config import BlendWeights, Settings
from app.domain import Profile, TrainingData
from app.models.base import ScoringModel
from app.models.collaborative import CollaborativeModel
from app.models.content import ContentModel
from app.models.popularity import PopularityModel


def combine(blend: BlendWeights, parts: Mapping[str, np.ndarray], n_ratings: int) -> np.ndarray:
    """Blend per-model percentile scores using the weights a viewer of this history size earns."""
    weights = blend.weights_for(n_ratings)
    return sum(weights[name] * part for name, part in parts.items())


class HybridModel(ScoringModel):
    """Weighted blend of rank-normalized popularity, content and collaborative scores."""

    name = "hybrid"

    def __init__(
        self,
        popularity: PopularityModel,
        content: ContentModel,
        collaborative: CollaborativeModel,
        blend: BlendWeights,
        min_item_ratings: int,
    ) -> None:
        self.popularity = popularity
        self.content = content
        self.collaborative = collaborative
        self._blend = blend
        self._min_ratings = min_item_ratings
        self.eligible = np.empty(0, dtype=bool)   # items with enough support to be recommended

    @classmethod
    def from_settings(cls, s: Settings) -> HybridModel:
        return cls(
            PopularityModel(s.popularity_quantile),
            ContentModel(s.genre_weight, s.tag_weight),
            CollaborativeModel(s.svd_components, s.seed),
            s.blend,
            s.min_item_ratings,
        )

    def fit(self, data: TrainingData) -> HybridModel:
        for model in (self.popularity, self.content, self.collaborative):
            model.fit(data)
        self.eligible = data.matrix.getnnz(axis=0) >= self._min_ratings
        return self

    def weights_for(self, n_ratings: int) -> dict[str, float]:
        return self._blend.weights_for(n_ratings)

    def component_scores(self, profile: Profile) -> dict[str, np.ndarray]:
        """Each model's percentile score per item (0 for ineligible items). Independent of blend weights."""
        return {
            m.name: self._percentile(m.score(profile))
            for m in (self.popularity, self.content, self.collaborative)
        }

    def score_detailed(self, profile: Profile) -> tuple[np.ndarray, dict[str, np.ndarray]]:
        """Blended score plus each model's percentile score (used for explanations)."""
        parts = self.component_scores(profile)
        return combine(self._blend, parts, len(profile)), parts

    def score(self, profile: Profile) -> np.ndarray:
        return self.score_detailed(profile)[0]

    def _percentile(self, scores: np.ndarray) -> np.ndarray:
        out = np.zeros(len(scores))
        out[self.eligible] = rankdata(scores[self.eligible]) / self.eligible.sum()
        return out