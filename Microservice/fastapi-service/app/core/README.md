# core

This folder contains application-wide infrastructure used by every layer of the service.

## Files

- `config.py`: Defines `Settings`, reads environment variables, and exposes `get_settings()` with caching. Important values include MongoDB connection details, media directories, provider settings, limits, CORS origins, and public base URLs.
- `database.py`: Creates the MongoDB client, selects the configured database, returns collections, initializes indexes, and closes the client on shutdown.
- `errors.py`: Defines `ErrorCode` and `AppError`. These are used by routes and services to return predictable API errors.
- `logging.py`: Configures Python logging. Development uses debug-level logs; other environments use info-level logs.

## Usage

Use `get_settings()` whenever code needs configuration. Use `get_collection()` inside repositories, not directly in route handlers or service logic. Raise `AppError` for expected application failures such as unsupported sources, provider configuration issues, missing jobs, or rendering failures.

## Configuration notes

The settings model reads `.env` from the process working directory. The safe variable list is documented in `../.env.example`. Keep secrets out of source control.

## Startup behavior

`app/main.py` calls `ensure_indexes()` on startup and `close_mongo()` on shutdown. If `MONGODB_URI` is empty, index creation is skipped.
