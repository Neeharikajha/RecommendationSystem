from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from fastapi.middleware.cors import CORSMiddleware

from app.api import router
from app.config import settings
from app.data import load_dataset
from app.domain import NotFoundError
from app.engine import Engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.engine = Engine(load_dataset(settings.data_dir), settings)   # train once at startup
    yield


def create_app() -> FastAPI:
    app = FastAPI(title="CineMatch Recommendation API", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(router, prefix="/api")

    @app.exception_handler(NotFoundError)
    async def not_found(_: Request, exc: NotFoundError) -> JSONResponse:
        return JSONResponse(status_code=404, content={"detail": str(exc)})

    reports_dir = settings.metrics_path.parent
    if reports_dir.exists():
        app.mount("/reports", StaticFiles(directory=reports_dir), name="reports")
    if settings.static_dir.exists():
        app.mount("/", StaticFiles(directory=settings.static_dir, html=True), name="static")
    return app


app = create_app()