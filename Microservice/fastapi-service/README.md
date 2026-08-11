# FastAPI Microservice

Simple FastAPI backend with root and health routes.

## Run locally

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Routes

- `GET /`
- `GET /health`
- `GET /model/recommendations?content_type=video&tags=ai&tags=technology&watched_video_ids=<video-id>`

Set `MONGODB_KEY` or `MONGO_URI` before calling recommendation routes. Optional env values:

- `MONGO_DB_NAME` defaults to `test`
- `VIDEOS_COLLECTION` defaults to `videos`
- `RECOMMENDER_CACHE_TTL_SECONDS` defaults to `300`
