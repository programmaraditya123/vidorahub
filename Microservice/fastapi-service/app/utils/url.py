from hashlib import sha256
from urllib.parse import parse_qs, quote, unquote, urlparse, urlunparse

from app.core.errors import AppError, ErrorCode
from app.models.video_source import SourceType
from app.schemas.video_source import SourceDetection


def normalize_and_detect(raw_url: str) -> SourceDetection:
    value = raw_url.strip()
    if not value:
        raise AppError(ErrorCode.INVALID_URL, "Paste a video link before creating Vibes.")
    if len(value) > 4096:
        raise AppError(ErrorCode.INVALID_URL, "The video link is too long.")
    parsed = urlparse(value)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise AppError(ErrorCode.INVALID_URL, "Use a valid http or https video URL.")
    host = parsed.netloc.lower()
    host = host[4:] if host.startswith("www.") else host
    if host in {"youtube.com", "m.youtube.com"} or host == "youtu.be":
        return _detect_youtube(parsed, host)
    if host == "storage.googleapis.com" or host.endswith(".storage.googleapis.com"):
        return _detect_gcs(parsed, host)
    if "vidorahub" in host:
        identifier = parsed.path.strip("/") or parse_qs(parsed.query).get("videoId", [""])[0]
        if not identifier:
            raise AppError(ErrorCode.INVALID_URL, "The VidoraHub URL does not include a video identifier.")
        return SourceDetection(
            source_type=SourceType.VIDORAHUB,
            normalized_url=urlunparse(parsed._replace(fragment="")),
            source_identifier=identifier,
            display_name="VidoraHub video detected",
        )
    raise AppError(ErrorCode.UNSUPPORTED_SOURCE, "Supported sources are YouTube, VidoraHub, and Google Cloud Storage.")


def source_fingerprint(owner_fingerprint: str, normalized_url: str) -> str:
    return sha256(f"{owner_fingerprint}:{normalized_url}".encode("utf-8")).hexdigest()


def _detect_youtube(parsed, host: str) -> SourceDetection:
    video_id = ""
    if host == "youtu.be":
        video_id = parsed.path.strip("/").split("/")[0]
    elif parsed.path == "/watch":
        video_id = parse_qs(parsed.query).get("v", [""])[0]
    elif parsed.path.startswith("/shorts/"):
        video_id = parsed.path.split("/")[2]
    if not video_id:
        raise AppError(ErrorCode.INVALID_URL, "The YouTube URL does not include a valid video ID.")
    return SourceDetection(
        source_type=SourceType.YOUTUBE,
        normalized_url=f"https://www.youtube.com/watch?v={quote(video_id)}",
        source_identifier=video_id,
        display_name="YouTube video detected",
    )


def _detect_gcs(parsed, host: str) -> SourceDetection:
    if host == "storage.googleapis.com":
        parts = parsed.path.strip("/").split("/", 1)
        if len(parts) != 2:
            raise AppError(ErrorCode.INVALID_URL, "The Google Cloud Storage URL must include a bucket and object.")
        bucket, obj = parts
    else:
        bucket = host.removesuffix(".storage.googleapis.com")
        obj = parsed.path.strip("/")
    if not bucket or not obj:
        raise AppError(ErrorCode.INVALID_URL, "The Google Cloud Storage URL must include a bucket and object.")
    normalized_obj = quote(unquote(obj), safe="/")
    return SourceDetection(
        source_type=SourceType.GCS,
        normalized_url=f"https://storage.googleapis.com/{bucket}/{normalized_obj}",
        source_identifier=f"{bucket}/{unquote(obj)}",
        display_name="Google Cloud video detected",
    )
