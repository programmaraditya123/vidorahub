# models

This folder contains small domain models that are shared across the service. These are not MongoDB ORM classes; they are enums and constants that keep statuses and source types consistent.

## Files

- `vibe.py`: Defines `VibeStatus`.
  - `DRAFT`: Vibe exists but has not been rendered.
  - `RENDERING`: render is in progress.
  - `READY`: render output is available.
  - `FAILED`: render or generation failed.
  - `PUBLISHED`: Vibe has been published externally.
- `vibe_job.py`: Defines `JobStatus` and `ACTIVE_JOB_STATUSES`.
  - Tracks the full processing pipeline from `QUEUED` through `COMPLETED`, `FAILED`, or `CANCELLED`.
  - `ACTIVE_JOB_STATUSES` is used to avoid creating duplicate active jobs for the same owner and source.
- `video_source.py`: Defines `SourceType`.
  - Supported values are `YOUTUBE`, `GCS`, and `VIDORAHUB`.

## Usage

Use these enums instead of hard-coded status strings when adding new logic. If a new source type or job state is added, update related schemas, repositories, source providers, and README notes in the same change.
