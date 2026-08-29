from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pathlib import Path

from app.api.routes import exports, health, vibe_jobs, vibes
from app.core.config import get_settings
from app.core.database import close_mongo, ensure_indexes
from app.core.errors import AppError, ErrorCode
from app.core.logging import configure_logging

settings = get_settings()
configure_logging(settings.environment)

app = FastAPI(
    title="VidoraVibe API",
    version="0.1.0",
    docs_url="/docs" if settings.is_development else None,
    redoc_url="/redoc" if settings.is_development else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["Authorization", "Content-Type", "Idempotency-Key", "X-User-Id", "X-Account-Id", "X-Profile-Id"],
)

Path(settings.media_output_dir).mkdir(parents=True, exist_ok=True)
app.mount("/media", StaticFiles(directory=settings.media_output_dir), name="media")


@app.on_event("startup")
def startup() -> None:
    ensure_indexes()


@app.on_event("shutdown")
def shutdown() -> None:
    close_mongo()


@app.exception_handler(AppError)
async def app_error_handler(_: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"success": False, "data": None, "error": exc.to_dict()})


@app.exception_handler(Exception)
async def unhandled_error_handler(_: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "data": None,
            "error": {
                "code": ErrorCode.INTERNAL_ERROR,
                "message": "Something went wrong while processing the request.",
                "details": None,
            },
        },
    )


app.include_router(health.router)
app.include_router(vibe_jobs.router, prefix="/api/v1")
app.include_router(vibes.router, prefix="/api/v1")
app.include_router(exports.router, prefix="/api/v1")
