import pytest

from app.core.errors import AppError, ErrorCode
from app.models.video_source import SourceType
from app.utils.url import normalize_and_detect


@pytest.mark.parametrize(
    "url,identifier",
    [
        ("https://www.youtube.com/watch?v=abc123&utm_source=x", "abc123"),
        ("https://youtube.com/watch?v=abc123", "abc123"),
        ("https://youtu.be/abc123?t=20", "abc123"),
        ("https://www.youtube.com/shorts/abc123", "abc123"),
    ],
)
def test_detects_youtube_variants(url, identifier):
    detected = normalize_and_detect(url)
    assert detected.source_type == SourceType.YOUTUBE
    assert detected.source_identifier == identifier
    assert detected.normalized_url == f"https://www.youtube.com/watch?v={identifier}"


def test_detects_gcs_path_url():
    detected = normalize_and_detect("https://storage.googleapis.com/bucket/folder/video file.mp4")
    assert detected.source_type == SourceType.GCS
    assert detected.source_identifier == "bucket/folder/video file.mp4"
    assert detected.normalized_url == "https://storage.googleapis.com/bucket/folder/video%20file.mp4"


def test_detects_gcs_virtual_hosted_url():
    detected = normalize_and_detect("https://my-bucket.storage.googleapis.com/videos/a.mp4")
    assert detected.source_type == SourceType.GCS
    assert detected.source_identifier == "my-bucket/videos/a.mp4"


def test_detects_vidorahub_url():
    detected = normalize_and_detect("https://app.vidorahub.com/videos/vid_123")
    assert detected.source_type == SourceType.VIDORAHUB
    assert detected.source_identifier == "videos/vid_123"


@pytest.mark.parametrize("url", ["", "ftp://example.com/video.mp4", "notaurl", "https://example.com/video.mp4"])
def test_rejects_invalid_or_unsupported_urls(url):
    with pytest.raises(AppError) as exc:
        normalize_and_detect(url)
    assert exc.value.code in {ErrorCode.INVALID_URL, ErrorCode.UNSUPPORTED_SOURCE}
