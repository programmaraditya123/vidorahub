from dataclasses import dataclass

from fastapi import Header


@dataclass(frozen=True)
class AuthContext:
    user_id: str | None = None
    account_id: str | None = None
    profile_id: str | None = None
    session_id: str | None = None
    device_id: str | None = None

    @property
    def owner_fingerprint(self) -> str:
        return self.user_id or self.account_id or self.session_id or "anonymous"


def get_auth_context(
    authorization: str | None = Header(default=None),
    x_user_id: str | None = Header(default=None),
    x_account_id: str | None = Header(default=None),
    x_profile_id: str | None = Header(default=None),
    x_session_id: str | None = Header(default=None),
    x_device_id: str | None = Header(default=None),
) -> AuthContext:
    return AuthContext(
        user_id=x_user_id,
        account_id=x_account_id,
        profile_id=x_profile_id,
        session_id=x_session_id,
        device_id=x_device_id,
    )
