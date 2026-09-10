# Processing Flow

1. Sign in with an existing VidoraHub account.
2. Paste a public/signed GCS HTTPS URL or directly upload a video through a resumable storage session.
3. Choose 25–60 second duration bounds, clip count, captions, face framing, and an optional topic preference.
4. An authenticated, idempotent request persists a job in MongoDB. Atomic worker leases process jobs outside the API.
5. The worker validates and downloads media, extracts audio, transcribes locally, and chooses coherent moments with Gemini or a visibly identified local fallback.
6. OpenCV estimates face positions, FFmpeg reframes and burns captions, and outputs go to a private bucket.
7. The job page uses non-overlapping 3-second polling, backs off on errors, and stops at a terminal state. Closing the page does not stop processing.
8. Only the completed attempt's clip manifest is exposed. Clips can be previewed, downloaded, or edited through a new render job. Cancellation prevents publication of unfinished results.

See [the service README](../../Microservice/vidoravibe-fastapi/README.md) for retention, retries, quotas and production limitations.
