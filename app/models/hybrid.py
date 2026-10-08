from __future__ import annotations

import numpy as np
from scipy.stats import rankdata

from app.config import BlendWeights, Settings
from app.domain import Profile, TrainingData
from app.models.base import ScoringModel
from app.models.collaborative import CollaborativeModel
from app.models.content import ContentModel
from app.models.popularity import PopularityModel


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
        """Blend weights for a viewer with n_ratings ratings (cold start leans on popularity)."""
        b = self._blend
        raw = {
            self.collaborative.name: b.collaborative * min(1.0, n_ratings / b.collaborative_ramp),
            self.content.name: b.content * min(1.0, n_ratings / b.content_ramp),
            self.popularity.name: b.popularity,
        }
        total = sum(raw.values())
        return {name: weight / total for name, weight in raw.items()}

    def score_detailed(self, profile: Profile) -> tuple[np.ndarray, dict[str, np.ndarray]]:
        """Blended score plus each model's percentile score (used for explanations)."""
        parts = {
            m.name: self._percentile(m.score(profile))
            for m in (self.popularity, self.content, self.collaborative)
        }
        weights = self.weights_for(len(profile))
        return sum((weights[n] * p for n, p in parts.items()), start=np.zeros_like(self.eligible, dtype=float)), parts

    def score(self, profile: Profile) -> np.ndarray:
        return self.score_detailed(profile)[0]

    def _percentile(self, scores: np.ndarray) -> np.ndarray:
        out = np.zeros(len(scores))
        out[self.eligible] = rankdata(scores[self.eligible]) / self.eligible.sum()
        return out