# workers

This folder contains background worker entrypoints.

## Files

- `vibe_worker.py`: Creates a `ThreadPoolExecutor` and exposes `enqueue_vibe_job(job_id)`. New jobs are submitted to the executor and processed by `VibeJobProcessor`.

## Usage

`api/routes/vibe_jobs.py` calls `enqueue_vibe_job()` after creating a new job. The route can return quickly while processing continues in the background.

## Current worker model

The current implementation runs in-process with two worker threads. This is simple for local development, but production deployments may need a separate queue system such as Celery, RQ, Dramatiq, or a cloud task queue so jobs survive app restarts and can scale independently.

## When to edit

Edit this folder when changing how background work is queued, retried, scaled, or supervised.
