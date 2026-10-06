from typing import Literal
from urllib.parse import urlsplit
from pydantic import BaseModel, Field, field_validator, model_validator

class OAuthClientRegistrationRequest(BaseModel):
    model_config = {"json_schema_extra": {"examples": [{
        "client_name": "My MCP client",
        "redirect_uris": ["http://127.0.0.1:3000/callback"],
        "grant_types": ["authorization_code", "refresh_token"],
        "response_types": ["code"],
        "token_endpoint_auth_method": "none",
        "scope": "mcp:access",
    }]}}
    client_name: str = Field(default="MCP client", min_length=1, max_length=100)
    redirect_uris: list[str] = Field(min_length=1, max_length=20)
    grant_types: list[Literal["authorization_code", "refresh_token"]] = ["authorization_code"]
    response_types: list[Literal["code"]] = ["code"]
    token_endpoint_auth_method: Literal["none"] = "none"
    scope: str | None = None

    @field_validator("redirect_uris")
    @classmethod
    def validate_redirects(cls, uris):
        for uri in uris:
            parsed = urlsplit(uri)
            try:
                parsed.port
            except ValueError:
                raise ValueError("Invalid redirect URI port") from None
            if (not parsed.hostname or parsed.username or parsed.password or "#" in uri
                or any(c.isspace() or ord(c) < 32 for c in uri) or chr(92) in uri
                or not (parsed.scheme == "https" or (parsed.scheme == "http"
                    and parsed.hostname in {"localhost", "127.0.0.1", "::1"}))):
                raise ValueError("Redirect URIs require HTTPS; HTTP is allowed on loopback only")
        return list(dict.fromkeys(uris))

    @model_validator(mode="after")
    def validate_grants(self):
        if "authorization_code" not in self.grant_types or self.response_types != ["code"]:
            raise ValueError("authorization_code and response_types=['code'] are required")
        return self
