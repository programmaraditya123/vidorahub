# services/jobs

This folder contains the end-to-end Vibe job pipeline.

## Files

- `processor.py`: Defines `VibeJobProcessor`, which coordinates all steps for one job id.

## Processing stages

`VibeJobProcessor.process(job_id)` performs these stages:

1. Creates a temporary job directory under `MEDIA_TEMP_DIR`.
2. Loads the job document.
3. Resolves the correct source provider.
4. Downloads or acquires source media.
5. Probes media duration and file size.
6. Extracts audio with FFmpeg.
7. Transcribes audio.
8. Analyzes transcript moments.
9. Ranks detected Vibes.
10. Inserts Vibe records into MongoDB.
11. Optionally renders clips immediately.
12. Marks the job completed or failed.
13. Cleans the temporary job directory.

## Cancellation

The processor checks cancellation between major stages. If the job has been cancelled, it raises `JOB_CANCELLED` and marks the job as failed through the normal error path.

## Usage

This module is called by `workers/vibe_worker.py`. Avoid calling it directly from route handlers because processing can take a long time.
