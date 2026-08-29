from enum import Enum
from typing import Any


class ErrorCode(str, Enum):
    INVALID_URL = "INVALID_URL"
    UNSUPPORTED_SOURCE = "UNSUPPORTED_SOURCE"
    VIDEO_NOT_FOUND = "VIDEO_NOT_FOUND"
    VIDEO_PRIVATE = "VIDEO_PRIVATE"
    VIDEO_TOO_LARGE = "VIDEO_TOO_LARGE"
    VIDEO_TOO_LONG = "VIDEO_TOO_LONG"
    VIDEO_DOWNLOAD_FAILED = "VIDEO_DOWNLOAD_FAILED"
    VIDEO_FORMAT_UNSUPPORTED = "VIDEO_FORMAT_UNSUPPORTED"
    TRANSCRIPTION_FAILED = "TRANSCRIPTION_FAILED"
    PROVIDER_NOT_CONFIGURED = "PROVIDER_NOT_CONFIGURED"
    AI_ANALYSIS_FAILED = "AI_ANALYSIS_FAILED"
    VIBE_GENERATION_FAILED = "VIBE_GENERATION_FAILED"
    RENDER_FAILED = "RENDER_FAILED"
    JOB_NOT_FOUND = "JOB_NOT_FOUND"
    JOB_ALREADY_RUNNING = "JOB_ALREADY_RUNNING"
    JOB_CANCELLED = "JOB_CANCELLED"
    VIBE_NOT_FOUND = "VIBE_NOT_FOUND"
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
    RATE_LIMITED = "RATE_LIMITED"
    INTERNAL_ERROR = "INTERNAL_ERROR"


class AppError(Exception):
    def __init__(
        self,
        code: ErrorCode,
        message: str,
        status_code: int = 400,
        details: Any | None = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details

    def to_dict(self) -> dict[str, Any]:
        return {"code": self.code, "message": self.message, "details": self.details}
