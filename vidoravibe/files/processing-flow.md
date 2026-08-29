# Processing Flow

1. User pastes a YouTube, VidoraHub, or Google Cloud Storage URL.
2. The input trims whitespace and detects the likely source.
3. `POST /api/v1/vibe-jobs` creates or returns an active job for the same owner and source fingerprint.
4. The browser navigates to `/vibes/jobs/{jobId}`.
5. The job page polls persisted backend state every 2.5 seconds.
6. Processing stages render as a progress checklist.
7. Completed jobs load Vibe cards from `/api/v1/vibe-jobs/{jobId}/vibes`.
8. Failed jobs display the backend's sanitized structured error.
