
from datetime import datetime, timedelta, timezone


ACCESS_TOKEN_LIFETIME = timedelta(minutes=15)


def access_token_expiry() -> datetime:

    return (
        datetime.now(timezone.utc)
        + ACCESS_TOKEN_LIFETIME
    )