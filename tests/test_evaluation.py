from dataclasses import replace

import pytest

from app.config import BlendWeights, Settings, with_overrides
from app.engine import Engine
from app.evaluation.runner import Benchmark, Strategy, run_strategy, segment_scheme
from app.evaluation.splits import relevant_by_user, temporal_split
from app.evaluation.tuning import SearchSpace, choose_lambda


@pytest.fixture(scope="module")
def split(dataset):
    return temporal_split(dataset.ratings, test_fraction=0.2, validation_fraction=0.1, min_ratings=10)


def test_split_is_disjoint_complete_and_chronological(dataset, split):
    parts = (split.train, split.validation, split.test)
    assert sum(map(len, parts)) == len(dataset.ratings)
    keys = [set(zip(p["user"], p["item"])) for p in parts]
    assert not (keys[0] & keys[1]) and not (keys[1] & keys[2]) and not (keys[0] & keys[2])
    past = split.final.train
    for user, held_out in split.test.groupby("user"):
        assert past.loc[past["user"] == user, "timestamp"].max() < held_out["timestamp"].min()


def test_personalised_hybrid_beats_popularity_without_leakage(dataset, split):
    fold = split.final
    engine = Engine(replace(dataset, ratings=fold.train), replace(Settings(), svd_components=8))
    assert engine.matrix.nnz == len(fold.train)   # nothing from the test fold was trained on

    bench = Benchmark.from_config(engine, relevant_by_user(fold.holdout, 4.0), Settings().evaluation)
    popularity = run_strategy(Strategy("popularity", engine, engine.hybrid.popularity.score), bench)
    hybrid = run_strategy(Strategy("hybrid", engine, engine.hybrid.score), bench)

    assert hybrid.summary()["ndcg"] > popularity.summary()["ndcg"]
    assert sum(m["users"] for m in hybrid.by_segment(bench.segments).values()) == len(bench.relevant)


def test_segment_labels():
    assert segment_scheme((30, 100))[1] == ["<30", "30-99", "100+"]


def test_search_space_respects_constraints():
    space = SearchSpace()
    blends = list(space.blends())
    assert len(blends) == 36 * len(space.collaborative_ramps) * len(space.content_ramps)
    for b in blends:
        assert b.collaborative + b.content + b.popularity == pytest.approx(1.0)
        assert min(b.collaborative, b.content, b.popularity) >= space.min_weight - 1e-9


def test_choose_lambda_takes_most_diverse_within_budget():
    sweep = {0.5: {"ndcg": 0.190}, 0.7: {"ndcg": 0.199}, 1.0: {"ndcg": 0.200}}
    assert choose_lambda(sweep, max_ndcg_loss=0.02) == 0.7


def test_overrides_merge_and_validate():
    tuned = with_overrides(Settings(), {"mmr_lambda": 0.6, "blend": {"collaborative_ramp": 40}})
    assert tuned.mmr_lambda == 0.6 and tuned.blend.collaborative_ramp == 40
    assert tuned.blend.content == Settings().blend.content   # untouched fields survive
    with pytest.raises(TypeError):
        with_overrides(Settings(), {"nope": 1})
    with pytest.raises(ValueError):
        BlendWeights(popularity=0)
