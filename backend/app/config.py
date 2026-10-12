from __future__ import annotations

import json
import os
from collections.abc import Mapping
from dataclasses import dataclass, replace
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent


@dataclass(frozen=True)
class BlendWeights:
    """Base weights of the hybrid, plus how fast each signal earns trust."""

    collaborative: float = 0.5
    content: float = 0.3
    popularity: float = 0.2
    collaborative_ramp: int = 20  # ratings needed before collaborative gets full weight
    content_ramp: int = 3

    def __post_init__(self) -> None:
        if self.popularity <= 0:
            raise ValueError("popularity weight must be positive: it is the cold-start fallback")

    def weights_for(self, n_ratings: int) -> dict[str, float]:
        """Normalised weights for a viewer with n_ratings ratings. Keys match model names."""
        raw = {
            "collaborative": self.collaborative * min(1.0, n_ratings / self.collaborative_ramp),
            "content": self.content * min(1.0, n_ratings / self.content_ramp),
            "popularity": self.popularity,
        }
        total = sum(raw.values())
        return {name: weight / total for name, weight in raw.items()}


@dataclass(frozen=True)
class EvalConfig:
    """Single source of truth for evaluation, shared by scripts.tune and scripts.evaluate."""

    k: int = 10
    test_fraction: float = 0.2
    validation_fraction: float = 0.1
    min_ratings: int = 10                       # users with fewer ratings are never held out
    segment_edges: tuple[int, ...] = (30, 100)  # training-history sizes separating user segments
    head_share: float = 0.1                     # "head" = most-rated 10% of eligible titles


@dataclass(frozen=True)
class Settings:
    data_dir: Path = Path(os.getenv("DATA_DIR", ROOT / "data" / "ml-latest-small"))
    metrics_path: Path = ROOT / "reports" / "metrics.json"
    tuned_path: Path = ROOT / "reports" / "tuned_config.json"
    static_dir: Path = ROOT / "static"

    min_item_ratings: int = 5      # items with less support are never recommended
    like_threshold: float = 4.0    # rating >= this means "liked"
    popularity_quantile: float = 0.8
    genre_weight: float = 1.0
    tag_weight: float = 0.6
    svd_components: int = 50
    mmr_lambda: float = 0.8        # 1.0 = pure relevance, lower = more diversity
    mmr_pool: int = 100            # candidates considered by the re-ranker
    seed: int = 42
    blend: BlendWeights = BlendWeights()
    evaluation: EvalConfig = EvalConfig()


def with_overrides(base: Settings, overrides: Mapping[str, Any]) -> Settings:
    """Apply a (possibly partial) tuned config. Unknown keys raise TypeError."""
    changes = dict(overrides)
    if "blend" in changes:
        changes["blend"] = replace(base.blend, **changes["blend"])
    return replace(base, **changes)


def load_settings() -> Settings:
    """Hand-picked defaults, overridden by reports/tuned_config.json when `scripts.tune` has produced it."""
    base = Settings()
    if base.tuned_path.exists():
        return with_overrides(base, json.loads(base.tuned_path.read_text()))
    return base


settings = load_settings()