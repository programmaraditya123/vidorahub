"""MCP OAuth discovery and enforcement with mocked MongoDB/introspection."""
import asyncio
import importlib
import json
import sys
import time
import unittest
from types import ModuleType, SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
from fastapi.testclient import TestClient
from mcp.server.auth.provider import AccessToken
from pydantic import SecretStr

ISSUER = "https://vidorahub-e5925e63.fastapicloud.dev"
RESOURCE = "https://vidorahub-fastapi2-189065286116.asia-south1.run.app/mcp"
HEADERS = {"Accept": "application/json, text/event-stream"}


class MCPOAuthTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        mongo = ModuleType("config.mongo")
        mongo.settings = SimpleNamespace(oauth_issuer=ISSUER, mcp_resource=RESOURCE,
            oauth_scopes="mcp:access", introspection_secret=SecretStr("test-secret"), jwt_secret=None)
        mongo.client = SimpleNamespace(admin=SimpleNamespace(command=AsyncMock()))
        mongo.db = SimpleNamespace(name="test")
        for name in ("users_collection", "videos_collection", "products_collections", "stores_collections"):
            setattr(mongo, name, MagicMock())
        with patch.dict(sys.modules, {"config.mongo": mongo}):
            cls.main = importlib.import_module("main")
        cls.client = TestClient(cls.main.app, base_url="https://vidorahub-fastapi2-189065286116.asia-south1.run.app")
        cls.client.__enter__()

    @classmethod
    def tearDownClass(cls):
        cls.client.__exit__(None, None, None)

    def test_metadata_is_public_at_all_discovery_paths(self):
        for path in ("/.well-known/oauth-protected-resource",
                "/.well-known/oauth-protected-resource/mcp", "/mcp/.well-known/oauth-protected-resource"):
            response = self.client.get(path)
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()["resource"], RESOURCE)
            self.assertEqual(response.json()["authorization_servers"], [ISSUER])
            self.assertEqual(response.json()["scopes_supported"], ["mcp:access"])

    def test_missing_bearer_returns_resolvable_metadata_challenge(self):
        for method in (self.client.get, self.client.post):
            response = method("/mcp", headers=HEADERS)
            self.assertEqual(response.status_code, 401)
            challenge = response.headers["www-authenticate"]
            self.assertIn("resource_metadata=", challenge)
            metadata_url = challenge.split('resource_metadata="')[1].split('"')[0]
            self.assertEqual(self.client.get(metadata_url).status_code, 200)

    def test_invalid_bearer_is_rejected(self):
        with patch.object(self.main.mcp._token_verifier, "verify_token", AsyncMock(return_value=None)):
            response = self.client.post("/mcp", headers={**HEADERS, "Authorization": "Bearer invalid"}, json={})
        self.assertEqual(response.status_code, 401)

    def test_required_scope_is_enforced(self):
        token = AccessToken(token="valid", client_id="client", scopes=[], expires_at=int(time.time()) + 600)
        with patch.object(self.main.mcp._token_verifier, "verify_token", AsyncMock(return_value=token)):
            response = self.client.post("/mcp", headers={**HEADERS, "Authorization": "Bearer valid"}, json={})
        self.assertEqual(response.status_code, 403)

    def test_authenticated_initialization_and_tools_list(self):
        token = AccessToken(token="valid", client_id="client", scopes=["mcp:access"],
            expires_at=int(time.time()) + 600, resource=RESOURCE)
        with patch.object(self.main.mcp._token_verifier, "verify_token", AsyncMock(return_value=token)):
            headers = {**HEADERS, "Authorization": "Bearer valid"}
            response = self.client.post("/mcp", headers=headers, json={"jsonrpc": "2.0", "id": 1,
                "method": "initialize", "params": {"protocolVersion": "2025-03-26", "capabilities": {},
                    "clientInfo": {"name": "test", "version": "1"}}})
            self.assertEqual(response.status_code, 200, response.text)
            self.assertIn("tools", response.json()["result"]["capabilities"])
            response = self.client.post("/mcp", headers=headers,
                json={"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}})
            self.assertEqual(response.status_code, 200, response.text)
            names = {tool["name"] for tool in response.json()["result"]["tools"]}
            self.assertIn("search_vidorahub_videos", names)

    def test_health_is_still_public(self):
        self.assertEqual(self.client.get("/health").json(), {"status": "ok"})


class TokenVerifierTests(unittest.TestCase):
    def verify(self, data, status=200):
        from services.mcp_auth import VidoraHubTokenVerifier
        verifier = VidoraHubTokenVerifier(ISSUER, RESOURCE, SecretStr("test-secret"))
        real_client = httpx.AsyncClient
        def handler(request):
            self.assertEqual(str(request.url), ISSUER + "/introspect")
            self.assertEqual(request.headers["authorization"], "Bearer test-secret")
            return httpx.Response(status, json=data)
        with patch("services.mcp_auth.httpx.AsyncClient", side_effect=lambda **kwargs:
                real_client(transport=httpx.MockTransport(handler), **kwargs)):
            return asyncio.run(verifier.verify_token("access-token"))

    def test_active_token_and_invalid_claims(self):
        data = dict(active=True, client_id="client", scope="mcp:access", iss=ISSUER,
            aud=RESOURCE, exp=int(time.time()) + 600)
        self.assertEqual(self.verify(data).client_id, "client")
        for change in ({"active": False}, {"iss": "https://other.example"},
                {"aud": "https://other.example/mcp"}, {"exp": int(time.time()) - 1},
                {"scope": None}):
            self.assertIsNone(self.verify(dict(data, **change)))
        self.assertIsNone(self.verify(data, 503))

    def test_missing_secret_fails_closed(self):
        from services.mcp_auth import VidoraHubTokenVerifier
        verifier = VidoraHubTokenVerifier(ISSUER, RESOURCE, None)
        self.assertIsNone(asyncio.run(verifier.verify_token("access-token")))


if __name__ == "__main__":
    unittest.main()
