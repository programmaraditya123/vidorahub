from datetime import datetime
from pydantic import BaseModel


class OAuthSession(BaseModel):

    session_id: str
    user_id: str

    created_at: datetime
    expires_at: datetime


class OAuthClient(BaseModel):

    client_id: str
    client_name: str

    redirect_uris: list[str]

    grant_types: list[str]

    token_endpoint_auth_method: str


class AuthorizationCode(BaseModel):

    code_hash: str

    client_id: str
    user_id: str

    redirect_uri: str

    resource: str

    code_challenge: str
    code_challenge_method: str

    created_at: datetime
    expires_at: datetime

    used: bool = False


class RefreshToken(BaseModel):

    token_hash: str

    client_id: str
    user_id: str

    resource: str

    created_at: datetime
    expires_at: datetime

    revoked: bool = False