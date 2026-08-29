import subprocess

from app.core.config import get_settings
from app.core.errors import AppError, ErrorCode


class FFmpegRunner:
    def run(self, args: list[str], timeout: int | None = None) -> None:
        command = [get_settings().ffmpeg_path, *args]
        try:
            subprocess.run(command, check=True, capture_output=True, timeout=timeout)
        except FileNotFoundError as exc:
            raise AppError(ErrorCode.RENDER_FAILED, "FFmpeg is not installed or FFMPEG_PATH is invalid.", 503) from exc
        except subprocess.CalledProcessError as exc:
            raise AppError(ErrorCode.RENDER_FAILED, "FFmpeg could not process the video.", 500) from exc
