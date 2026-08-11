import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app import config  # noqa: F401
from app.model.router import router as model_router

logger = logging.getLogger("uvicorn.error")

APP_NAME = os.getenv("APP_NAME", "Vidorahub Microservice")
APP_VERSION = os.getenv("APP_VERSION", "0.1.0")
APP_ENV = os.getenv("APP_ENV", "development").lower()


def _csv_env(name: str, default: str) -> list[str]:
    return [value.strip() for value in os.getenv(name, default).split(",") if value.strip()]





def create_app() -> FastAPI:
    docs_enabled = APP_ENV != "production"

    app = FastAPI(
        title=APP_NAME,
        version=APP_VERSION,
        docs_url="/docs" if docs_enabled else None,
        redoc_url="/redoc" if docs_enabled else None,
        openapi_url="/openapi.json" if docs_enabled else None,
    )

    allowed_origins = _csv_env("CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173,https://www.vidorahub.com")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    allowed_hosts = _csv_env("ALLOWED_HOSTS", "*")
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=allowed_hosts)
    app.include_router(model_router)

    return app


app = create_app()


@app.get("/")
def read_root() -> dict[str, str]:
    return {
        "service": APP_NAME,
        "message": "FastAPI microservice is running built by aditya",
        "environment": APP_ENV,
        "version": APP_VERSION,
    }


@app.get("/health")
def health_check() -> dict[str, str]:
    return {
        "status": "healthy",
        "service": APP_NAME,
        "environment": APP_ENV,
        "version": APP_VERSION,
    }
