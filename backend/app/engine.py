from __future__ import annotations

from collections import Counter, defaultdict
from collections.abc import Iterable

import numpy as np
import pandas as pd

from app import schemas as s
from app.config import Settings, settings
from app.data import Dataset
from app.domain import NotFoundError, Profile, TrainingData
from app.models.hybrid import HybridModel
from app.ranking import mmr_rerank, top_k

_REASONS = {
    ("collaborative", True): "Viewers who liked {anchor} also enjoyed this",
    ("content", True): "Shares genres and themes with {anchor}",
    ("collaborative", False): "Popular among viewers with similar taste",
}
_FALLBACK_REASON = "Highly rated by viewers across the catalog"


class Engine:
    def __init__(self, dataset: Dataset, config: Settings = settings) -> None:
        self._config = config
        self.user_ids = dataset.user_ids
        self.matrix = dataset.interaction_matrix()
        self.item_counts = self.matrix.getnnz(axis=0)
        self.hybrid = HybridModel.from_settings(config).fit(TrainingData(self.matrix, dataset.movies))
        self.eligible = self.hybrid.eligible

        self._genres: list[list[str]] = dataset.movies["genres"].tolist()
        self._cards = self._build_cards(dataset.movies)
        self._item_of = {card.movie_id: i for i, card in enumerate(self._cards)}
        self._titles = dataset.movies["title"].str.lower().to_numpy()
        self._genre_masks = self._build_genre_masks()
        self._genre_order = sorted(self._genre_masks, key=lambda g: -self._genre_masks[g].sum())

    # ---- profiles -------------------------------------------------------------------------
    def profile_at(self, user_index: int) -> Profile:
        return Profile.from_row(self.matrix[user_index])

    def user_profile(self, user_id: int) -> Profile:
        pos = int(np.searchsorted(self.user_ids, user_id))
        if pos >= len(self.user_ids) or self.user_ids[pos] != user_id:
            raise NotFoundError(f"Unknown user {user_id}")
        return self.profile_at(pos)

    def profile_from_ratings(self, ratings: Iterable[tuple[int, float]]) -> Profile:
        return Profile.from_pairs({self._item(movie_id): rating for movie_id, rating in ratings})

    def select(
        self,
        scores: np.ndarray,
        profile: Profile,
        k: int,
        *,
        genre: str | None = None,
        diversify: bool = True,
        mmr_lambda: float | None = None,
        exclude: Iterable[int] | None = None,
    ) -> np.ndarray:
        """Pick k unseen, eligible items by score; optionally re-rank with MMR for diversity."""
        mask = self.eligible.copy()
        mask[profile.items] = False
        if exclude is not None:
            mask[list(exclude)] = False
        if genre:
            mask &= self._genre_mask(genre)
        if not diversify:
            return top_k(scores, mask, k)
        pool = top_k(scores, mask, max(self._config.mmr_pool, 3 * k))
        if len(pool) <= 1:
            return pool
        lam = self._config.mmr_lambda if mmr_lambda is None else mmr_lambda
        similarity = self.hybrid.content.similarity(pool, pool)
        return mmr_rerank(pool, scores[pool], similarity, k, lam)
    
    def recommend(
        self,
        profile: Profile,
        k: int = 10,
        *,
        genre: str | None = None,
        exclude: Iterable[int] | None = None,
    ) -> list[s.Recommendation]:
        scores, parts = self.hybrid.score_detailed(profile)
        items = self.select(scores, profile, k, genre=genre, exclude=exclude)
        weights = self.hybrid.weights_for(len(profile))
        anchors = self._anchors(items, profile)
        return [
            s.Recommendation(
                movie=self._cards[i],
                score=round(float(scores[i]), 3),
                explanation=self._explain(int(i), anchor, parts, weights),
            )
            for i, anchor in zip(items, anchors)
        ]

    def similar(self, movie_id: int, k: int = 10) -> list[s.Recommendation]:
        return self._similar(self._item(movie_id), k)

    def popular_picks(
        self, profile: Profile, k: int = 10, *, exclude: Iterable[int] | None = None
    ) -> list[s.Recommendation]:
        pop_scores = self.hybrid.popularity.score(profile)
        mask = self.eligible.copy()
        mask[profile.items] = False
        if exclude is not None:
            mask[list(exclude)] = False
        items = top_k(pop_scores, mask, k)
        return [
            s.Recommendation(
                movie=self._cards[i],
                score=round(float(np.clip(pop_scores[i] / 5.0, 0, 1)), 3),
                explanation=s.Explanation(
                    reason="Trending and acclaimed across all viewers",
                    because=None,
                    shared_genres=[],
                    signals={"popularity": round(float(np.clip(pop_scores[i] / 5.0, 0, 1)), 3)},
                ),
            )
            for i in items
        ]

    def home(self, profile: Profile, k: int = 10) -> s.HomeResponse:
        cold = not len(profile)
        rows: list[s.Row] = []
        seen: set[int] = set(profile.items)

        # 1. Primary Hybrid Personalised Picks (or Popular Right Now if cold)
        top_picks = self.recommend(profile, k, exclude=seen)
        if top_picks:
            rows.append(s.Row(title="Popular Right Now" if cold else "Top Picks for You", items=top_picks))
            seen.update(self._item(r.movie.movie_id) for r in top_picks)

        # 2. Trending & Highly Rated Row (Popularity model priority, strictly deduplicated)
        pop_picks = self.popular_picks(profile, k, exclude=seen)
        if pop_picks:
            rows.append(s.Row(title="Trending Now · Global Acclaim", items=pop_picks))
            seen.update(self._item(r.movie.movie_id) for r in pop_picks)

        if not cold:
            # Sort user liked items by rating desc
            liked_order = np.argsort(-profile.ratings, kind="stable")
            # Anchor 1: highest rated
            best1 = int(profile.items[liked_order[0]])
            sim1 = self._similar(best1, k, exclude=seen)
            if sim1:
                rows.append(s.Row(title=f"Because you watched {self._cards[best1].title}", items=sim1))
                seen.update(self._item(r.movie.movie_id) for r in sim1)

            # Anchor 2 (if user has another high rated movie with different genres)
            if len(liked_order) > 1:
                best2 = int(profile.items[liked_order[1]])
                if best2 != best1:
                    sim2 = self._similar(best2, k, exclude=seen)
                    if sim2:
                        rows.append(s.Row(title=f"More Like {self._cards[best2].title}", items=sim2))
                        seen.update(self._item(r.movie.movie_id) for r in sim2)

        # 3. Dynamic genre-specific hybrid picks (top 3 favourite genres, strictly deduplicated)
        for genre in self._favourite_genres(profile, 3):
            genre_recs = self.recommend(profile, k, genre=genre, exclude=seen)
            if genre_recs:
                rows.append(s.Row(title=f"Top {genre} Hits For You", items=genre_recs))
                seen.update(self._item(r.movie.movie_id) for r in genre_recs)

        return s.HomeResponse(profile=self._summarise(profile), rows=rows)

    # ---- catalog --------------------------------------------------------------------------
    def search(self, query: str, limit: int = 10) -> list[s.Movie]:
        q = query.lower()
        hits = np.fromiter((q in t for t in self._titles), dtype=bool, count=len(self._titles))
        idx = np.flatnonzero(hits)
        idx = idx[np.argsort(-self.item_counts[idx], kind="stable")][:limit]
        return [self._cards[i] for i in idx]

    def movie(self, item: int) -> s.Movie:
        return self._cards[item]

    def meta(self) -> s.Meta:
        return s.Meta(
            n_users=len(self.user_ids),
            n_movies=len(self._cards),
            n_ratings=int(self.matrix.nnz),
            user_ids=self.user_ids.tolist(),
        )

    # ---- internals ------------------------------------------------------------------------
    def _similar(self, item: int, k: int, exclude: Iterable[int] | np.ndarray | None = None) -> list[s.Recommendation]:
        by_content = self.hybrid.content.similarity(np.array([item]))[0]
        by_taste = self.hybrid.collaborative.similarity(np.array([item]))[0]
        blended = (by_content + by_taste) / 2
        mask = self.eligible.copy()
        mask[item] = False
        if exclude is not None:
            mask[list(exclude)] = False
        title = self._cards[item].title
        return [
            s.Recommendation(
                movie=self._cards[i],
                score=round(float(np.clip(blended[i], 0, 1)), 3),
                explanation=s.Explanation(
                    reason=f"Similar to {title}",
                    because=title,
                    shared_genres=self._shared_genres(int(i), item),
                    signals={"content": round(float(by_content[i]), 3), "collaborative": round(float(by_taste[i]), 3)},
                ),
            )
            for i in top_k(blended, mask, k)
        ]

    def _anchors(self, items: np.ndarray, profile: Profile) -> list[int | None]:
        """For each recommended item, the liked movie it is most similar to (for 'because you...')."""
        liked = profile.liked(self._config.like_threshold)
        if not len(liked) or not len(items):
            return [None] * len(items)
        sim = (self.hybrid.collaborative.similarity(items, liked) + self.hybrid.content.similarity(items, liked)) / 2
        return [int(liked[j]) for j in sim.argmax(axis=1)]

    def _explain(self, item: int, anchor: int | None, parts: dict[str, np.ndarray], weights: dict[str, float]) -> s.Explanation:
        signals = {name: round(float(p[item]), 3) for name, p in parts.items()}
        dominant = max(signals, key=lambda n: weights[n] * signals[n])
        anchor_title = self._cards[anchor].title if anchor is not None else None
        template = _REASONS.get((dominant, anchor_title is not None), _FALLBACK_REASON)
        return s.Explanation(
            reason=template.format(anchor=anchor_title),
            because=anchor_title,
            shared_genres=self._shared_genres(item, anchor) if anchor is not None else [],
            signals=signals,
        )

    def _shared_genres(self, a: int, b: int) -> list[str]:
        return sorted(set(self._genres[a]) & set(self._genres[b]))

    def _favourite_genres(self, profile: Profile, n: int) -> list[str]:
        liked = profile.liked(self._config.like_threshold)
        counts = Counter(g for i in liked for g in self._genres[i])
        ranked = [g for g, _ in counts.most_common()] + [g for g in self._genre_order if g not in counts]
        return ranked[:n]

    def _summarise(self, profile: Profile) -> s.ProfileSummary:
        order = np.argsort(-profile.ratings, kind="stable")[:8]
        return s.ProfileSummary(
            n_ratings=len(profile),
            favourite_genres=self._favourite_genres(profile, 3) if len(profile) else [],
            top_rated=[s.RatedMovie(movie=self._cards[profile.items[j]], rating=float(profile.ratings[j])) for j in order],
            weights={name: round(w, 3) for name, w in self.hybrid.weights_for(len(profile)).items()},
        )

    def _item(self, movie_id: int) -> int:
        try:
            return self._item_of[movie_id]
        except KeyError:
            raise NotFoundError(f"Unknown movie {movie_id}") from None

    def _genre_mask(self, genre: str) -> np.ndarray:
        try:
            return self._genre_masks[genre]
        except KeyError:
            raise NotFoundError(f"Unknown genre {genre}") from None

    def _build_cards(self, movies: pd.DataFrame) -> list[s.Movie]:
        sums = np.asarray(self.matrix.sum(axis=0)).ravel()
        return [
            s.Movie(
                movie_id=int(row.movie_id),
                title=row.title,
                year=None if pd.isna(row.year) else int(row.year),
                genres=row.genres,
                avg_rating=round(float(total / count), 2) if count else None,
                n_ratings=int(count),
            )
            for row, total, count in zip(movies.itertuples(index=False), sums, self.item_counts)
        ]

    def _build_genre_masks(self) -> dict[str, np.ndarray]:
        masks: dict[str, np.ndarray] = defaultdict(lambda: np.zeros(len(self._genres), dtype=bool))
        for i, genres in enumerate(self._genres):
            for genre in genres:
                masks[genre][i] = True
        return dict(masks)