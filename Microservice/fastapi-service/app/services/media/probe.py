import json
import subprocess
from dataclasses import dataclass

from app.core.config import get_settings
from app.core.errors import AppError, ErrorCode


@dataclass(frozen=True)
class VideoProbe:
    width: int
    height: int
    duration: float
    size_bytes: int | None = None


def probe_video(path: str) -> VideoProbe:
    command = [
        "ffprobe",
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=width,height,duration",
        "-show_entries",
        "format=duration,size",
        "-of",
        "json",
        path,
    ]
    if get_settings().ffmpeg_path != "ffmpeg":
        command[0] = get_settings().ffmpeg_path.replace("ffmpeg", "ffprobe")
    try:
        result = subprocess.run(command, check=True, capture_output=True, text=True)
        data = json.loads(result.stdout)
        stream = (data.get("streams") or [{}])[0]
        fmt = data.get("format") or {}
        duration = float(stream.get("duration") or fmt.get("duration") or 0)
        size = fmt.get("size")
        return VideoProbe(
            width=int(stream.get("width") or 0),
            height=int(stream.get("height") or 0),
            duration=duration,
            size_bytes=int(size) if size else None,
        )
    except Exception as exc:
        raise AppError(ErrorCode.VIDEO_FORMAT_UNSUPPORTED, "Could not inspect the video with ffprobe.", 422) from exc
