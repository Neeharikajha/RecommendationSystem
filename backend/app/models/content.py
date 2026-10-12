from __future__ import annotations

import numpy as np
from scipy.sparse import csr_matrix, hstack
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import normalize

from app.domain import Profile, TrainingData
from app.models.base import ScoringModel


class ContentModel(ScoringModel):
    """Cosine similarity between a viewer's taste vector and TF-IDF item vectors (genres + tags)."""

    name = "content"

    def __init__(self, genre_weight: float = 1.0, tag_weight: float = 0.6) -> None:
        self._genre_weight = genre_weight
        self._tag_weight = tag_weight
        self._vectors = csr_matrix((0, 0))

    def fit(self, data: TrainingData) -> ContentModel:
        genres = data.movies["genres"].map(lambda gs: " ".join(g.replace("-", "") for g in gs))
        blocks = [
            TfidfVectorizer().fit_transform(genres) * self._genre_weight,
            TfidfVectorizer(min_df=2, sublinear_tf=True, stop_words="english")
            .fit_transform(data.movies["tags"]) * self._tag_weight,
        ]
        self._vectors = normalize(hstack(blocks, format="csr"))
        return self

    def score(self, profile: Profile) -> np.ndarray:
        if not len(profile):
            return np.zeros(self._vectors.shape[0])
        weights = profile.centered()
        if not weights.any():                      # all ratings equal -> treat as plain "likes"
            weights = np.ones_like(weights)
        taste = self._vectors[profile.items].T @ weights
        return self._vectors @ taste

    def similarity(self, rows: np.ndarray, cols: np.ndarray | None = None) -> np.ndarray:
        """Dense cosine similarity between item sets (cols=None means the whole catalog)."""
        left = self._vectors[rows]
        right = self._vectors if cols is None else self._vectors[cols]
        return (left @ right.T).toarray()