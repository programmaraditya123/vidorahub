from datetime import datetime
from pydantic import BaseModel


class OAuthAuthorizationCode(BaseModel):
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