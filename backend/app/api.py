from __future__ import annotations

import json
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Request

from app import schemas as s
from app.config import settings
from app.engine import Engine

router = APIRouter()


def get_engine(request: Request) -> Engine:
    return request.app.state.engine


EngineDep = Annotated[Engine, Depends(get_engine)]


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/meta", response_model=s.Meta)
def meta(engine: EngineDep):
    return engine.meta()


@router.get("/movies/search", response_model=list[s.Movie])
def search(engine: EngineDep, q: str = Query(min_length=2), limit: int = Query(10, ge=1, le=25)):
    return engine.search(q, limit)


@router.get("/movies/{movie_id}/similar", response_model=list[s.Recommendation])
def similar(engine: EngineDep, movie_id: int, k: int = Query(12, ge=1, le=30)):
    return engine.similar(movie_id, k)


@router.get("/users/{user_id}/home", response_model=s.HomeResponse)
def user_home(engine: EngineDep, user_id: int, k: int = Query(12, ge=1, le=30)):
    return engine.home(engine.user_profile(user_id), k)


@router.post("/home", response_model=s.HomeResponse)
def custom_home(engine: EngineDep, body: s.HomeRequest):
    profile = engine.profile_from_ratings((r.movie_id, r.rating) for r in body.ratings)
    return engine.home(profile, body.k)


@router.get("/metrics")
def offline_metrics() -> dict:
    if not settings.metrics_path.exists():
        raise HTTPException(404, "Run `python -m scripts.evaluate` to generate metrics")
    return json.loads(settings.metrics_path.read_text())