from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


@dataclass(frozen=True)
class BlendWeights:
    """Base weights of the hybrid, plus how fast each signal earns trust."""

    collaborative: float = 0.5
    content: float = 0.3
    popularity: float = 0.2
    collaborative_ramp: int = 20  # ratings needed before collaborative gets full weight
    content_ramp: int = 3


@dataclass(frozen=True)
class Settings:
    data_dir: Path = Path(os.getenv("DATA_DIR", ROOT / "data" / "ml-latest-small"))
    metrics_path: Path = ROOT / "reports" / "metrics.json"
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


settings = Settings()