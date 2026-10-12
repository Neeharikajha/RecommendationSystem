import numpy as np
import pytest

from app import metrics
from app.ranking import mmr_rerank, top_k


def test_perfect_ranking():
    ranked, relevant = np.array([1, 2, 3]), {1, 2, 3}
    assert metrics.ndcg_at_k(ranked, relevant, 3) == pytest.approx(1.0)
    assert metrics.precision_at_k(ranked, relevant, 3) == 1.0


def test_hit_position_matters():
    assert metrics.ndcg_at_k(np.array([9, 1]), {1}, 2) < metrics.ndcg_at_k(np.array([1, 9]), {1}, 2)


def test_top_k_respects_mask():
    scores, mask = np.array([0.9, 0.8, 0.7]), np.array([False, True, True])
    assert top_k(scores, mask, 2).tolist() == [1, 2]


def test_mmr_prefers_dissimilar_second_pick():
    candidates, relevance = np.array([0, 1, 2]), np.array([1.0, 0.95, 0.9])
    similarity = np.array([[1, 1, 0], [1, 1, 0], [0, 0, 1]], dtype=float)
    assert mmr_rerank(candidates, relevance, similarity, 2, 0.5).tolist() == [0, 2]


def test_popularity_bias_is_share_of_head_items():
    head = np.array([True, True, False, False])
    assert metrics.popularity_bias(np.array([0, 2]), head) == 0.5