import os
import subprocess
from pathlib import Path
from urllib.parse import quote

from app.core.config import get_settings
from app.core.errors import AppError, ErrorCode


def _ratio(aspect_ratio: str) -> float:
    try:
        width, height = aspect_ratio.split(":")
        return float(width) / float(height)
    except (ValueError, ZeroDivisionError):
        return 9.0 / 16.0


class VibeRenderer:
    def render(self, source_media_path: str, start: float, end: float, output_dir: str, aspect_ratio: str = "9:16") -> dict[str, str]:
        Path(output_dir).mkdir(parents=True, exist_ok=True)
        output_path = Path(output_dir) / f"vibe_{int(start * 1000)}_{int(end * 1000)}.mp4"
        cut_path = output_path.with_suffix(".cut.mp4")
        thumbnail_path = output_path.with_suffix(".jpg")
        try:
            self._cut_subclip(source_media_path, start, end, str(cut_path))
            self._reframe_with_opencv(str(cut_path), str(output_path), aspect_ratio)
            self._thumbnail(str(output_path), str(thumbnail_path))
        except AppError:
            raise
        except Exception as exc:
            raise AppError(ErrorCode.RENDER_FAILED, "Could not render the Vibe video.", 500) from exc
        finally:
            if cut_path.exists():
                cut_path.unlink()

        return {
            "video_path": str(output_path),
            "thumbnail_path": str(thumbnail_path) if thumbnail_path.exists() else "",
            "video_url": self._public_url(output_path),
            "thumbnail_url": self._public_url(thumbnail_path) if thumbnail_path.exists() else "",
        }

    def _cut_subclip(self, source_path: str, start: float, end: float, out_path: str) -> None:
        self._run(
            [
                "-y",
                "-loglevel",
                "error",
                "-ss",
                f"{start:.3f}",
                "-to",
                f"{end:.3f}",
                "-i",
                source_path,
                "-c:v",
                "libx264",
                "-preset",
                "fast",
                "-crf",
                "20",
                "-c:a",
                "aac",
                "-b:a",
                "128k",
                out_path,
            ]
        )

    def _reframe_with_opencv(self, in_path: str, out_path: str, aspect_ratio: str) -> None:
        try:
            import cv2  # type: ignore
        except ImportError as exc:
            raise AppError(ErrorCode.PROVIDER_NOT_CONFIGURED, "Install opencv-python before face-aware rendering can run.", 503) from exc

        cap = cv2.VideoCapture(in_path)
        if not cap.isOpened():
            raise AppError(ErrorCode.RENDER_FAILED, "Could not open the cut clip for rendering.", 500)

        src_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        src_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        if src_w <= 0 or src_h <= 0:
            cap.release()
            raise AppError(ErrorCode.RENDER_FAILED, "The cut clip has invalid video dimensions.", 500)

        target_ratio = _ratio(aspect_ratio)
        if target_ratio < src_w / src_h:
            crop_h = src_h
            crop_w = int(crop_h * target_ratio)
        else:
            crop_w = src_w
            crop_h = int(crop_w / target_ratio)
        crop_w = max(2, crop_w - (crop_w % 2))
        crop_h = max(2, crop_h - (crop_h % 2))

        silent_path = f"{out_path}.silent.mp4"
        writer = cv2.VideoWriter(silent_path, cv2.VideoWriter_fourcc(*"mp4v"), fps, (crop_w, crop_h))
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
        last_center: tuple[int, int] | None = None
        smoothing = 0.15

        while True:
            ok, frame = cap.read()
            if not ok:
                break
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(40, 40))
            if len(faces) > 0:
                x, y, w, h = max(faces, key=lambda face: face[2] * face[3])
                center = (x + w // 2, y + h // 2)
                if last_center is None:
                    last_center = center
                else:
                    last_center = (
                        int(last_center[0] + (center[0] - last_center[0]) * smoothing),
                        int(last_center[1] + (center[1] - last_center[1]) * smoothing),
                    )
            if last_center is None:
                last_center = (src_w // 2, src_h // 2)
            x0 = max(0, min(src_w - crop_w, last_center[0] - crop_w // 2))
            y0 = max(0, min(src_h - crop_h, last_center[1] - crop_h // 2))
            writer.write(frame[y0 : y0 + crop_h, x0 : x0 + crop_w])

        cap.release()
        writer.release()
        self._run(
            [
                "-y",
                "-loglevel",
                "error",
                "-i",
                silent_path,
                "-i",
                in_path,
                "-c:v",
                "libx264",
                "-preset",
                "fast",
                "-crf",
                "20",
                "-c:a",
                "aac",
                "-b:a",
                "128k",
                "-map",
                "0:v:0",
                "-map",
                "1:a:0?",
                "-shortest",
                out_path,
            ]
        )
        if os.path.exists(silent_path):
            os.remove(silent_path)

    def _thumbnail(self, video_path: str, thumbnail_path: str) -> None:
        self._run(["-y", "-loglevel", "error", "-ss", "00:00:01", "-i", video_path, "-frames:v", "1", thumbnail_path])

    def _run(self, args: list[str]) -> None:
        command = [get_settings().ffmpeg_path, *args]
        try:
            subprocess.run(command, check=True, capture_output=True)
        except FileNotFoundError as exc:
            raise AppError(ErrorCode.RENDER_FAILED, "FFmpeg is not installed or FFMPEG_PATH is invalid.", 503) from exc
        except subprocess.CalledProcessError as exc:
            raise AppError(ErrorCode.RENDER_FAILED, "FFmpeg could not render the Vibe.", 500, exc.stderr.decode(errors="ignore")) from exc

    def _public_url(self, path: Path) -> str:
        settings = get_settings()
        output_root = Path(settings.media_output_dir).resolve()
        relative = path.resolve().relative_to(output_root).as_posix()
        if settings.public_media_base_url:
            return f"{settings.public_media_base_url.rstrip('/')}/{quote(relative, safe='/')}"
        return f"{settings.public_api_base_url.rstrip('/')}/media/{quote(relative, safe='/')}"
