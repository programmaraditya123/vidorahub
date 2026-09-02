# utils

This folder contains small helpers shared by several layers.

## Files

- `cleanup.py`: Deletes a temporary job directory after processing finishes.
- `url.py`: Validates, normalizes, and classifies incoming source URLs.
  - Supports YouTube, Google Cloud Storage, and VidoraHub URLs.
  - Produces source identifiers used by jobs and providers.
  - Builds a stable source fingerprint for duplicate job detection.
- `validation.py`: Contains `clamp_progress()`, which keeps progress values between 0 and 100.

## Usage

Keep this folder for focused helpers that do not own application state. If code needs database access, provider clients, or long-running work, it belongs in `repositories/` or `services/` instead.

## URL behavior

`normalize_and_detect()` raises `AppError` for empty, invalid, unsupported, or incomplete URLs. This lets API handlers return consistent error responses through the global exception handler.
