# api

This folder contains the HTTP interface for the service. API files should stay thin: accept requests, call repositories or services, and return normalized responses.

## Files

- `dependencies.py`: Defines `AuthContext` and `get_auth_context()`. It reads optional headers such as `X-User-Id`, `X-Account-Id`, `X-Profile-Id`, `X-Session-Id`, and `X-Device-Id`, then creates an owner fingerprint used for duplicate job detection.
- `routes/`: Contains the route modules mounted by `app/main.py`.

## Usage

Add new HTTP endpoints under `routes/` and include the router from `main.py`. Keep request validation in Pydantic schemas, shared dependencies in this folder, and long-running business logic in `services/`.

## Response style

Routes usually return `schemas.common.ok(...)`, which produces:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

Errors should use `AppError` from `core/errors.py` so `main.py` can return consistent error JSON.
