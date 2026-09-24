# models/identity.py

from pydantic import BaseModel


class OAuthIdentity(BaseModel):

    user_id: str

    client_id: str

    audience: str

    issued_at: int

    expires_at: int