"""Copy this adapter into the MCP resource service, which already depends on mcp."""
import httpx
from mcp.server.auth.provider import AccessToken

class VidoraHubTokenVerifier:
    def __init__(self, issuer: str, resource: str, introspection_secret: str):
        self.issuer = issuer.rstrip("/")
        self.resource = resource
        self.secret = introspection_secret

    async def verify_token(self, token: str) -> AccessToken | None:
        try:
            async with httpx.AsyncClient(timeout=5, follow_redirects=False) as client:
                response = await client.post(self.issuer + "/introspect",
                    data={"token": token}, headers={"Authorization": "Bearer " + self.secret})
                response.raise_for_status()
                data = response.json()
            if (data.get("active") is not True or data.get("aud") != self.resource
                    or data.get("iss") != self.issuer):
                return None
            return AccessToken(token=token, client_id=data["client_id"],
                scopes=data["scope"].split(), expires_at=data["exp"], resource=data["aud"])
        except (httpx.HTTPError, ValueError, KeyError, TypeError):
            return None
