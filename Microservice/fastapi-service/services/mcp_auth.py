"""Validate OAuth access tokens against the separate VidoraHub auth server."""
import logging
import time

import httpx
from mcp.server.auth.provider import AccessToken
from pydantic import SecretStr

logger = logging.getLogger(__name__)


class VidoraHubTokenVerifier:
    def __init__(self, issuer: str, resource: str, secret: SecretStr | None):
        self.issuer = issuer.rstrip("/")
        self.resource = resource
        self.secret = secret
        if not secret or not secret.get_secret_value():
            logger.warning("INTROSPECTION_SECRET is missing; MCP access will be rejected")

    async def verify_token(self, token: str) -> AccessToken | None:
        if not self.secret or not self.secret.get_secret_value():
            return None
        try:
            async with httpx.AsyncClient(timeout=5, follow_redirects=False) as client:
                response = await client.post(
                    self.issuer + "/introspect", data={"token": token},
                    headers={"Authorization": "Bearer " + self.secret.get_secret_value()},
                )
                response.raise_for_status()
                data = response.json()
            if (data.get("active") is not True or data.get("aud") != self.resource
                    or data.get("iss") != self.issuer or data.get("exp", 0) <= time.time()):
                return None
            return AccessToken(
                token=token, client_id=data["client_id"], scopes=data["scope"].split(),
                expires_at=data["exp"], resource=data["aud"],
            )
        except (httpx.HTTPError, ValueError, KeyError, TypeError, AttributeError):
            return None
