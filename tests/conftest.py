from dataclasses import replace

import numpy as np
import pandas as pd
import pytest

from app.config import Settings
from app.data import Dataset
from app.engine import Engine


@pytest.fixture(scope="session")
def dataset() -> Dataset:
    """40 users in 3 taste clusters; each cluster loves one genre and dislikes the rest."""
    rng = np.random.default_rng(0)
    n_users, n_items, genres = 40, 60, ["Action", "Comedy", "Drama"]
    movies = pd.DataFrame({
        "movie_id": np.arange(100, 100 + n_items),
        "title": [f"Movie {i}" for i in range(n_items)],
        "year": 2000,
        "genres": [[genres[i % 3]] for i in range(n_items)],
        "tags": [f"tag{i % 3}" for i in range(n_items)],
    })
    rows = []
    for u in range(n_users):
        for i in rng.choice(n_items, 30, replace=False):
            rows.append((u + 1, u, int(i), 5.0 if i % 3 == u % 3 else 2.0, len(rows)))
    ratings = pd.DataFrame(rows, columns=["user_id", "user", "item", "rating", "timestamp"])
    return Dataset(movies, ratings, np.arange(1, n_users + 1))


@pytest.fixture(scope="session")
def engine(dataset: Dataset) -> Engine:
    return Engine(dataset, replace(Settings(), svd_components=8))