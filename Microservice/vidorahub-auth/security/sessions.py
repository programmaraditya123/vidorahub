
import secrets
from datetime import datetime, timedelta, timezone


SESSION_LIFETIME = timedelta(hours=1)


def generate_session_id() -> str:
    return secrets.token_urlsafe(32)


def session_expiry() -> datetime:
    return (
        datetime.now(timezone.utc)
        + SESSION_LIFETIME
    )