# services/media

This folder contains reusable media utilities for downloading, probing, and preparing source video files.

## Files

- `audio.py`: Uses FFmpeg to extract mono 16 kHz WAV audio from a source video.
- `downloader.py`: Thin wrapper that asks a source provider to acquire local media.
- `ffmpeg.py`: Shared FFmpeg runner with consistent error handling.
- `http_download.py`: Streams direct HTTP video downloads to disk while enforcing the configured max size.
- `probe.py`: Uses ffprobe to inspect video width, height, duration, and file size.

## Usage

Source providers use `http_download.py` when the source URL can be downloaded directly. The job processor uses `probe.py` for validation and `audio.py` before transcription.

## Requirements

FFmpeg and ffprobe must be installed and reachable. Configure `FFMPEG_PATH` if the executable is not available as `ffmpeg` on the system path.

## Limits

Download and processing limits come from settings:

- `MAX_VIDEO_SIZE_MB`
- `MAX_VIDEO_DURATION_SECONDS`
- `FFMPEG_PATH`
