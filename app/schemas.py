from __future__ import annotations

from pydantic import BaseModel, Field


class Movie(BaseModel):
    movie_id: int
    title: str
    year: int | None
    genres: list[str]
    avg_rating: float | None
    n_ratings: int


class Explanation(BaseModel):
    reason: str
    because: str | None          # the liked movie that anchors this recommendation
    shared_genres: list[str]
    signals: dict[str, float]    # per-model percentile score, 0..1


class Recommendation(BaseModel):
    movie: Movie
    score: float                 # 0..1, shown as "match %"
    explanation: Explanation


class Row(BaseModel):
    title: str
    items: list[Recommendation]


class RatedMovie(BaseModel):
    movie: Movie
    rating: float


class ProfileSummary(BaseModel):
    n_ratings: int
    favourite_genres: list[str]
    top_rated: list[RatedMovie]
    weights: dict[str, float]    # how the hybrid blended its models for this viewer


class HomeResponse(BaseModel):
    profile: ProfileSummary
    rows: list[Row]


class Meta(BaseModel):
    n_users: int
    n_movies: int
    n_ratings: int
    user_ids: list[int]


class RatingIn(BaseModel):
    movie_id: int
    rating: float = Field(ge=0.5, le=5)


class HomeRequest(BaseModel):
    ratings: list[RatingIn] = Field(default_factory=list, max_length=200)
    k: int = Field(12, ge=1, le=30)