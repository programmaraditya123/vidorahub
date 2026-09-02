# repositories

This folder is the MongoDB data access layer. Repositories hide collection names, ObjectId conversion, serialization, and common persistence operations from routes and services.

## Files

- `vibe_job_repository.py`: Handles `vibe_jobs` documents.
  - Creates a new job or returns an existing active duplicate.
  - Fetches a job by id.
  - Updates job stage, progress, timestamps, and stage state.
  - Marks jobs complete, failed, or cancelled.
  - Checks cancellation state during processing.
- `vibe_repository.py`: Handles `vibes` documents.
  - Lists Vibes for a job sorted by score.
  - Fetches and updates individual Vibes.
  - Marks render states: rendering, ready, failed, and published.
  - Bulk inserts generated Vibe candidates.

## Usage

Routes and services should use repositories instead of calling MongoDB directly. This keeps ObjectId handling and API serialization consistent.

## Document conventions

Repositories serialize Mongo `_id` values to strings before returning documents. Timestamp fields use timezone-aware UTC datetimes. Expected missing-document cases raise `AppError` with `JOB_NOT_FOUND` or `VIBE_NOT_FOUND`.

## When to edit

Edit this folder when adding new persistence operations, indexes, status transitions, or collection fields that require centralized behavior.
