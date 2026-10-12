from __future__ import annotations

from dataclasses import dataclass

import pandas as pd


@dataclass(frozen=True)
class Fold:
    train: pd.DataFrame
    holdout: pd.DataFrame


@dataclass(frozen=True)
class Split:
    train: pd.DataFrame
    validation: pd.DataFrame
    test: pd.DataFrame

    @property
    def tuning(self) -> Fold:
        """Tune on validation. The test fold is never touched."""
        return Fold(self.train, self.validation)

    @property
    def final(self) -> Fold:
        """Report on test, after retraining on everything that happened before it."""
        return Fold(pd.concat([self.train, self.validation]), self.test)


def temporal_split(
    ratings: pd.DataFrame, test_fraction: float, validation_fraction: float, min_ratings: int
) -> Split:
    """Per user: oldest ratings -> train, next -> validation, newest -> test.

    Users with fewer than `min_ratings` ratings stay entirely in train (they are never evaluated).
    """
    if test_fraction + validation_fraction >= 1:
        raise ValueError("test_fraction + validation_fraction must be < 1")
    ordered = ratings.sort_values(["user", "timestamp"], kind="stable")
    by_user = ordered.groupby("user")["item"]
    size = by_user.transform("size")
    from_end = size - by_user.cumcount()                    # 1 = most recent rating
    n_test = (size * test_fraction).round().clip(lower=1)
    n_val = (size * validation_fraction).round().clip(lower=1)

    evaluable = size >= min_ratings
    is_test = evaluable & (from_end <= n_test)
    is_val = evaluable & ~is_test & (from_end <= n_test + n_val)
    return Split(ordered[~is_test & ~is_val], ordered[is_val], ordered[is_test])


def relevant_by_user(holdout: pd.DataFrame, like_threshold: float) -> pd.Series:
    """user index -> set of held-out items the user liked. Users with none are dropped."""
    liked = holdout[holdout["rating"] >= like_threshold]
    return liked.groupby("user")["item"].agg(set)