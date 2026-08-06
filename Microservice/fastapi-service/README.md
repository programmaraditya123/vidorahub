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
