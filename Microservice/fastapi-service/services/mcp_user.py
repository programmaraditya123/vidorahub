"""Resolve the authenticated caller for any MCP tool, using request context."""
import httpx
from mcp.server.auth.middleware.auth_context import get_access_token
from config.mongo import settings


async def get_current_mcp_user() -> dict:
    """Return the current user's safe profile; no model-supplied token or user ID."""
    access = get_access_token()
    if access is None:
        raise RuntimeError("Authentication required. Connect your VidoraHub account.")
    try:
        async with httpx.AsyncClient(timeout=5, follow_redirects=False) as client:
            response = await client.get(settings.oauth_issuer.rstrip("/") + "/oauth/userinfo",
                headers={"Authorization": "Bearer " + access.token})
        if response.status_code in (401, 403):
            raise RuntimeError("User authentication failed. Reconnect your VidoraHub account.")
        response.raise_for_status()
        body = response.json()
        user = body.get("user")
        if body.get("authenticated") is not True or not isinstance(user, dict) or not user.get("id"):
            raise ValueError("Invalid identity response")
        return user
    except (httpx.HTTPError, ValueError, TypeError, AttributeError):
        raise RuntimeError("User lookup is temporarily unavailable. Please retry.") from None
