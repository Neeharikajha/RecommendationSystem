import pytest

from app.domain import NotFoundError


def test_excludes_seen_and_respects_k(engine):
    profile = engine.user_profile(1)
    seen = {engine.movie(i).movie_id for i in profile.items}
    recs = engine.recommend(profile, 5)
    assert len(recs) == 5
    assert not seen & {r.movie.movie_id for r in recs}


def test_recommendations_follow_taste(engine):
    profile = engine.user_profile(1)  # user 1 loves Action (i % 3 == 0)
    items = engine.select(engine.hybrid.score(profile), profile, 5, diversify=False)
    assert sum("Action" in engine.movie(i).genres for i in items) >= 4


def test_cold_start_uses_popularity_only(engine):
    profile = engine.profile_from_ratings([])
    assert engine.hybrid.weights_for(0) == {"collaborative": 0.0, "content": 0.0, "popularity": 1.0}
    assert len(engine.recommend(profile, 5)) == 5


def test_weights_shift_toward_personalisation(engine):
    assert engine.hybrid.weights_for(25)["collaborative"] > engine.hybrid.weights_for(5)["collaborative"]


def test_explanations_are_populated(engine):
    rec = engine.recommend(engine.user_profile(2), 3)[0]
    assert rec.explanation.reason and set(rec.explanation.signals) == {"popularity", "content", "collaborative"}


def test_unknown_ids_raise(engine):
    with pytest.raises(NotFoundError):
        engine.user_profile(9999)
    with pytest.raises(NotFoundError):
        engine.similar(1)