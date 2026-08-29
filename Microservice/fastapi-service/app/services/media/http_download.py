from pathlib import Path
from urllib.parse import urlparse

import httpx

from app.core.config import get_settings
from app.core.errors import AppError, ErrorCode


def download_http_video(url: str, job_dir: str, filename: str = "source.mp4") -> str:
    output = Path(job_dir) / filename
    max_bytes = get_settings().max_video_size_mb * 1024 * 1024
    written = 0
    try:
        with httpx.stream("GET", url, follow_redirects=True, timeout=60) as response:
            response.raise_for_status()
            content_type = response.headers.get("content-type", "")
            if content_type and "video" not in content_type and "octet-stream" not in content_type:
                parsed = urlparse(url)
                if not Path(parsed.path).suffix.lower() in {".mp4", ".mov", ".m4v", ".webm"}:
                    raise AppError(ErrorCode.VIDEO_FORMAT_UNSUPPORTED, "The URL did not return a supported video file.", 422)
            with output.open("wb") as handle:
                for chunk in response.iter_bytes():
                    if not chunk:
                        continue
                    written += len(chunk)
                    if written > max_bytes:
                        raise AppError(ErrorCode.VIDEO_TOO_LARGE, "The video exceeds the configured size limit.", 413)
                    handle.write(chunk)
    except AppError:
        raise
    except httpx.HTTPStatusError as exc:
        raise AppError(ErrorCode.VIDEO_DOWNLOAD_FAILED, "Could not download the source video.", 502, {"status_code": exc.response.status_code}) from exc
    except Exception as exc:
        raise AppError(ErrorCode.VIDEO_DOWNLOAD_FAILED, "Could not download the source video.", 502) from exc
    return str(output)
