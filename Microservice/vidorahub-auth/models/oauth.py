from datetime import datetime
from pydantic import BaseModel, Field, HttpUrl
from typing import Literal


class OAuthClientRegistrationRequest(BaseModel):
    client_name: str = Field(min_length=1, max_length=100)

    redirect_uris: list[HttpUrl] = Field(min_length=1)

    grant_types: list[
        Literal["authorization_code", "refresh_token"]
    ] = ["authorization_code"]

    response_types: list[
        Literal["code"]
    ] = ["code"]

    token_endpoint_auth_method: Literal[
        "none"
    ] = "none"
    scope: str | None = None
    isActive : bool

class OAuthClientResponse(BaseModel):
    client_id: str
    client_name: str
    redirect_uris: list[str]

    grant_types: list[str]
    response_types: list[str]

    token_endpoint_auth_method: str

    client_id_issued_at: int

    scope : str | None = None
    isActive : bool


class AuthorizeQuery(BaseModel):
    client_id: str
    redirect_uri: str
    response_type: str
    scope: str | None = None
    state: str | None = None

    code_challenge: str
    code_challenge_method: str





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