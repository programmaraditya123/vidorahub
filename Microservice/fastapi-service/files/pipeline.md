# VidoraVibe Pipeline

The processing sequence is:

URL -> source adapter -> acquisition -> media validation -> audio extraction -> transcription -> semantic analysis -> Vibe detection -> rendering -> storage -> completion.

Each job stores `status`, `current_stage`, `progress`, `error`, and `stage_state`.

The pipeline is now local-first and provider-configurable:

- YouTube acquisition uses `yt-dlp`.
- GCS and direct VidoraHub media URLs stream through the HTTP downloader with size/type checks.
- Transcription supports OpenAI Whisper or local Faster Whisper.
- Semantic analysis supports OpenAI, plus a deterministic local heuristic mode for development.
- Rendering uses FFmpeg to cut the moment and OpenCV Haar face detection to crop vertical video, then muxes audio back into the output.
- Rendered videos are stored in `MEDIA_OUTPUT_DIR` and served from `/media` unless `PUBLIC_MEDIA_BASE_URL` points to external storage/CDN.

Stages:

- `VALIDATING`: resolve the adapter and inspect source metadata.
- `DOWNLOADING`: acquire the source video into an isolated job temp directory and validate size/duration with ffprobe.
- `EXTRACTING_AUDIO`: create audio with FFmpeg using argument arrays.
- `TRANSCRIBING`: return structured transcript segments.
- `ANALYZING`: identify semantic moments.
- `DETECTING_VIBES`: rank meaningful candidates.
- `GENERATING_VIBES`: persist Vibe metadata, render each Vibe when `RENDER_VIBES_DURING_JOB=true`, and mark rendered Vibes as `READY`.
- `FINALIZING`: mark the job complete and clean temp files.

Reference implementation notes:

The rendering approach follows the same high-level pattern as the referenced AI YouTube Shorts Generator project: cut a source subclip with FFmpeg, use OpenCV face detection for vertical reframing, and mux audio back into the final short. The VidoraVibe implementation is integrated into the existing FastAPI repository, MongoDB models, job stages, and `/media` serving path.
