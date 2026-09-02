# services/source

This folder contains source providers. A source provider knows how to inspect and acquire a local video file for one source type.

## Files

- `base.py`: Defines shared dataclasses and the `VideoSourceProvider` interface.
  - `SourceMetadata`: normalized metadata about the remote video.
  - `LocalMedia`: local file path plus metadata.
  - `VideoSourceProvider`: provider interface with `inspect()` and `acquire()`.
- `registry.py`: Resolves a URL to the correct provider using URL detection.
- `youtube.py`: Downloads YouTube videos with `yt-dlp`.
- `gcs.py`: Handles Google Cloud Storage media URLs through direct HTTP download.
- `vidorahub.py`: Handles VidoraHub URLs. Current behavior downloads direct media URLs and leaves room for an internal API-backed transport later.

## Usage

The job processor asks `SourceRegistry.resolve(url)` for a provider, inspects metadata, and then downloads media through `MediaDownloader`.

## Adding a source

1. Add a new value in `models/video_source.py`.
2. Update URL detection in `utils/url.py`.
3. Implement a provider in this folder.
4. Register it in `registry.py`.
5. Update schemas or tests if the new source affects API behavior.
