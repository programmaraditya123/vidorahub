from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "vidoravibe"
    environment: Literal["development", "test", "staging", "production"] = "development"
    host: str = "0.0.0.0"
    port: int = 8000
    mongodb_uri: str = ""
    mongodb_database: str = "vidoravibe"
    vidorahub_api_url: str = ""
    vidorahub_internal_api_url: str = ""
    google_cloud_project: str = ""
    google_cloud_storage_bucket: str = ""
    youtube_enabled: bool = True
    ai_provider: str = "disabled"
    ai_api_key: str = ""
    ai_model: str = "gpt-4o-mini"
    transcription_provider: str = "disabled"
    transcription_api_key: str = ""
    transcription_model: str = "whisper-1"
    local_whisper_model: str = "base"
    local_whisper_device: str = "auto"
    ffmpeg_path: str = "ffmpeg"
    media_temp_dir: str = ".media/tmp"
    media_output_dir: str = ".media/output"
    public_media_base_url: str = ""
    public_api_base_url: str = "http://localhost:8000"
    render_vibes_during_job: bool = True
    max_vibes_per_job: int = Field(default=5, gt=0, le=20)
    max_video_size_mb: int = Field(default=1024, gt=0)
    max_video_duration_seconds: int = Field(default=7200, gt=0)
    job_timeout_seconds: int = Field(default=3600, gt=0)
    job_poll_interval_seconds: int = Field(default=2, gt=0)
    cors_origins: str = "http://localhost:3000"
    jwt_secret: str = ""

    @property
    def is_development(self) -> bool:
        return self.environment in {"development", "test"}

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
