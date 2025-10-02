from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .db import init_db
from . import routers
from .schemas import HealthResponse


def create_app() -> FastAPI:
    app = FastAPI(title="Semillero Digital Backend", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    def on_startup():
        init_db()

    @app.get("/health", response_model=HealthResponse)
    def health():
        return HealthResponse()

    app.include_router(routers.users_router)
    app.include_router(routers.courses_router)
    app.include_router(routers.enrollments_router)
    app.include_router(routers.assignments_router)
    app.include_router(routers.announcements_router)
    app.include_router(routers.notifications_router)

    return app


app = create_app()
