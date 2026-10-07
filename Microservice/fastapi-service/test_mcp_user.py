import asyncio
from types import SimpleNamespace
from unittest.mock import patch

import httpx
import pytest
from services import mcp_user


def resolve(data, status=200):
    actual_client = httpx.AsyncClient
    def handler(request):
        assert str(request.url) == "https://auth.example/oauth/userinfo"
        assert request.headers["authorization"] == "Bearer current-request-token"
        return httpx.Response(status, json=data)
    with patch.object(mcp_user, "settings", SimpleNamespace(oauth_issuer="https://auth.example/")), \
            patch.object(mcp_user, "get_access_token", return_value=SimpleNamespace(token="current-request-token")), \
            patch.object(mcp_user.httpx, "AsyncClient", side_effect=lambda **kwargs:
                actual_client(transport=httpx.MockTransport(handler), **kwargs)):
        return asyncio.run(mcp_user.get_current_mcp_user())


def test_resolver_uses_current_request_token_and_returns_user():
    user = {"id": "507f1f77bcf86cd799439011", "name": "Test User"}
    assert resolve({"authenticated": True, "user": user}) == user


@pytest.mark.parametrize("status", [401, 403, 503, 302])
def test_resolver_rejects_authentication_failures_and_outages(status):
    with pytest.raises(RuntimeError):
        resolve({}, status)


@pytest.mark.parametrize("data", [{}, {"authenticated": False, "user": {"id": "user"}},
    {"authenticated": True, "user": {}}, {"authenticated": True, "user": "invalid"}])
def test_resolver_rejects_invalid_identity_response(data):
    with pytest.raises(RuntimeError, match="temporarily unavailable"):
        resolve(data)


def test_resolver_requires_request_context():
    with patch.object(mcp_user, "get_access_token", return_value=None), \
            patch.object(mcp_user.httpx, "AsyncClient") as client:
        with pytest.raises(RuntimeError, match="Authentication required"):
            asyncio.run(mcp_user.get_current_mcp_user())
        client.assert_not_called()
