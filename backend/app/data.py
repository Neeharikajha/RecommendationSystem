from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import pandas as pd
from scipy.sparse import csr_matrix

_YEAR_RE = re.compile(r"\s*\((\d{4})\)\s*$")
_ARTICLE_RE = re.compile(r"^(.*), (The|A|An)$")
_NO_GENRES = "(no genres listed)"


@dataclass(frozen=True)
class Dataset:
    movies: pd.DataFrame    # columns: movie_id, title, year, genres(list), tags(str); index == item index
    ratings: pd.DataFrame   # columns: user_id, user, item, rating, timestamp
    user_ids: np.ndarray    # sorted raw ids; position == user index

    @property
    def n_items(self) -> int:
        return len(self.movies)

    def interaction_matrix(self) -> csr_matrix:
        r = self.ratings
        return csr_matrix(
            (r["rating"].to_numpy(np.float32), (r["user"].to_numpy(), r["item"].to_numpy())),
            shape=(len(self.user_ids), self.n_items),
        )


def load_dataset(data_dir: Path) -> Dataset:
    movies = _prepare_movies(
        pd.read_csv(data_dir / "movies.csv"), pd.read_csv(data_dir / "tags.csv")
    )
    ratings = pd.read_csv(data_dir / "ratings.csv").rename(columns={"userId": "user_id"})
    user_ids = np.sort(ratings["user_id"].unique())
    item_of = pd.Series(movies.index, index=movies["movie_id"])
    ratings = ratings.assign(
        user=np.searchsorted(user_ids, ratings["user_id"]),
        item=ratings["movieId"].map(item_of),
    ).dropna(subset=["item"]).astype({"item": "int64"})
    return Dataset(movies, ratings[["user_id", "user", "item", "rating", "timestamp"]], user_ids)


def _prepare_movies(movies: pd.DataFrame, tags: pd.DataFrame) -> pd.DataFrame:
    movies = movies.rename(columns={"movieId": "movie_id"})
    year = movies["title"].str.extract(_YEAR_RE)[0]
    movies["year"] = pd.to_numeric(year, errors="coerce").astype("Int64")
    movies["title"] = movies["title"].str.replace(_YEAR_RE, "", regex=True).map(_fix_article)
    movies["genres"] = movies["genres"].map(lambda g: [] if g == _NO_GENRES else g.split("|"))
    tag_text = (
        tags.assign(tag=tags["tag"].astype(str).str.lower())
        .groupby("movieId")["tag"]
        .agg(" ".join)
    )
    movies["tags"] = movies["movie_id"].map(tag_text).fillna("")
    return movies[["movie_id", "title", "year", "genres", "tags"]].reset_index(drop=True)


def _fix_article(title: str) -> str:
    """'Matrix, The' -> 'The Matrix'."""
    match = _ARTICLE_RE.match(title)
    return f"{match[2]} {match[1]}" if match else title