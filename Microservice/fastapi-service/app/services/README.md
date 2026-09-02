# services

This folder contains the business logic of the microservice. Services perform the actual media, AI, source, rendering, and job-processing work.

## Subfolders

- `ai/`: Transcription, semantic analysis, and Vibe candidate ranking.
- `jobs/`: The end-to-end processing pipeline for a Vibe job.
- `media/`: FFmpeg, ffprobe, audio extraction, and generic HTTP video downloads.
- `rendering/`: Clip cutting, reframing, thumbnail generation, and public media URLs.
- `source/`: Source-specific adapters for YouTube, Google Cloud Storage, and VidoraHub URLs.

## Usage

API routes should call services for behavior that is more complex than basic validation or persistence. Services can use repositories, core settings, and utility helpers.

## Pipeline summary

`jobs/processor.py` coordinates most service work:

1. Resolve the source provider.
2. Download or acquire source media.
3. Probe duration and size limits.
4. Extract audio.
5. Transcribe speech.
6. Analyze the transcript for useful moments.
7. Store Vibe records.
8. Optionally render final clips.
9. Clean temporary files.

## External tools

Rendering and probing require FFmpeg and ffprobe. YouTube acquisition requires `yt-dlp`. AI and transcription providers depend on the configured environment variables.
