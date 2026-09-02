# services/rendering

This folder renders final short-form Vibe videos and thumbnails.

## Files

- `vibe_renderer.py`: Defines `VibeRenderer`.
  - Cuts a source clip between start and end timestamps.
  - Reframes the clip to a target aspect ratio, defaulting to `9:16`.
  - Uses OpenCV face detection to keep faces near the crop center when possible.
  - Adds audio back to the reframed output.
  - Generates a thumbnail image.
  - Builds public URLs for generated media.

## Output behavior

Rendered files are written under `MEDIA_OUTPUT_DIR`, usually grouped by job id. `app/main.py` mounts this directory at `/media`, so generated videos can be served by the FastAPI app.

## Usage

Routes can call `VibeRenderer` for manual rerenders. The job processor can also render immediately when `RENDER_VIBES_DURING_JOB=true`.

## Requirements

Rendering requires FFmpeg and `opencv-python`. Public URLs depend on `PUBLIC_MEDIA_BASE_URL` or `PUBLIC_API_BASE_URL`.
