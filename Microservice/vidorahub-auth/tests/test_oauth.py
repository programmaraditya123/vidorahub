"""HTTP flow tests with in-memory collections; no production database access."""
import copy
import os
import sys
from datetime import timedelta
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

os.environ["MONGODB_URI"] = "mongodb://localhost:27017"
os.environ["MONGODB_DATABASE"] = "oauth_tests"
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import bcrypt
import pytest
from fastapi.testclient import TestClient
from pydantic import SecretStr
import main
from config.mongo import settings
from routes import authorize
from services import oauth_service as oauth, token_service as tokens, user_service
from security.pkce import create_code_challenge
from security.token_hash import hash_token

class Collection:
    def __init__(self):
        self.documents = []

    def matches(self, doc, query):
        for key, value in query.items():
            if isinstance(value, dict):
                if "$gt" in value and not doc.get(key) > value["$gt"]:
                    return False
            elif doc.get(key) != value:
                return False
        return True

    async def insert_one(self, doc, session=None):
        self.documents.append(copy.deepcopy(doc))

    async def find_one(self, query, session=None):
        return next((copy.deepcopy(d) for d in self.documents if self.matches(d, query)), None)

    async def find_one_and_update(self, query, update, session=None):
        for doc in self.documents:
            if self.matches(doc, query):
                before = copy.deepcopy(doc)
                doc.update(update["$set"])
                return before

    async def update_one(self, query, update):
        await self.find_one_and_update(query, update)

    async def find_one_and_delete(self, query, session=None):
        for index, doc in enumerate(self.documents):
            if self.matches(doc, query):
                return self.documents.pop(index)

    async def delete_one(self, query):
        await self.find_one_and_delete(query)

@pytest.fixture
def client(monkeypatch):
    collections = {name: Collection() for name in ("clients", "codes", "sessions", "transactions", "tokens", "grants", "users")}
    for name, value in (("oauth_clients_collection", "clients"),
        ("oauth_authorization_codes_collection", "codes"), ("oauth_sessions_collection", "sessions"),
        ("oauth_transactions_collection", "transactions")):
        monkeypatch.setattr(oauth, name, collections[value])
    class Session:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            pass

        async def with_transaction(self, callback, **kwargs):
            snapshot = {name: copy.deepcopy(collection.documents) for name, collection in collections.items()}
            try:
                return await callback(self)
            except BaseException:
                for name, documents in snapshot.items():
                    collections[name].documents = documents
                raise

    from types import SimpleNamespace
    from unittest.mock import AsyncMock
    monkeypatch.setattr(oauth, "client", SimpleNamespace(start_session=AsyncMock(return_value=Session())))
    for name in ("codes", "tokens", "grants"):
        monkeypatch.setattr(tokens, name, collections[name])
    monkeypatch.setattr(user_service, "users_collection", collections["users"])
    monkeypatch.setattr(settings, "oauth_cookie_secure", False)
    monkeypatch.setattr(settings, "oauth_issuer", "http://testserver")
    monkeypatch.setattr(settings, "mcp_resource", "https://mcp.example/mcp")
    monkeypatch.setattr(settings, "oauth_scopes", "mcp:access")
    monkeypatch.setattr(settings, "introspection_secret", SecretStr("test-resource-secret"))
    collections["users"].documents.append({"_id": "user-1", "email": "user@example.com",
        "password": bcrypt.hashpw(b"password", bcrypt.gensalt(rounds=4)).decode()})
    # No context manager: skip Mongo startup; every collection used below is replaced.
    http = TestClient(main.app)
    http.collections = collections
    yield http
    http.close()

REDIRECT = "http://127.0.0.1:3000/callback?existing=value"
VERIFIER = "a" * 43


def test_documentation_can_load_assets_without_relaxing_auth_headers(client):
    for path in ("/docs", "/redoc", "/docs/oauth2-redirect"):
        response = client.get(path)
        assert response.status_code == 200
        assert "content-security-policy" not in response.headers
    schema = client.get("/openapi.json")
    assert schema.status_code == 200
    assert "/authorize" in schema.json()["paths"]
    body = schema.json()["paths"]["/register"]["post"]["requestBody"]
    assert body["required"] is True
    assert body["content"]["application/json"]["schema"]["$ref"].endswith("/OAuthClientRegistrationRequest")
    model = schema.json()["components"]["schemas"]["OAuthClientRegistrationRequest"]
    assert model["examples"][0]["redirect_uris"] == ["http://127.0.0.1:3000/callback"]
    assert "default-src 'none'" in client.get("/").headers["content-security-policy"]

def register(client, **overrides):
    body = dict(redirect_uris=[REDIRECT], grant_types=["authorization_code", "refresh_token"])
    body.update(overrides)
    return client.post("/register", json=body)

def start(client, client_id, **overrides):
    params = dict(client_id=client_id, redirect_uri=REDIRECT, response_type="code",
        resource=settings.mcp_resource, state="state & value", code_challenge=create_code_challenge(VERIFIER),
        code_challenge_method="S256")
    params.update(overrides)
    return client.get("/authorize", params=params, follow_redirects=False)

def authorize_code(client, client_id):
    response = start(client, client_id)
    assert response.status_code == 302
    location = response.headers["location"]
    transaction_id = parse_qs(urlsplit(location).query)["transaction_id"][0]
    page = client.get(location)
    assert page.status_code == 200
    assert page.headers["referrer-policy"] == "same-origin"
    csrf = client.cookies.get(authorize.CSRF_COOKIE)
    response = client.post("/oauth/login", data=dict(transaction_id=transaction_id,
        csrf_token=csrf, decision="allow", email="user@example.com", password="password"),
        follow_redirects=False)
    assert response.status_code == 303, response.text
    assert response.headers["referrer-policy"] == "no-referrer"
    query = parse_qs(urlsplit(response.headers["location"]).query)
    assert query["existing"] == ["value"]
    assert query["state"] == ["state & value"]
    return query["code"][0]

def exchange(client, client_id, code, **overrides):
    data = dict(grant_type="authorization_code", client_id=client_id, code=code,
        redirect_uri=REDIRECT, code_verifier=VERIFIER, resource=settings.mcp_resource)
    data.update(overrides)
    return client.post("/token", data=data)

def introspect(client, token):
    return client.post("/introspect", data={"token": token},
        headers={"Authorization": "Bearer test-resource-secret"}).json()

def test_registration_defaults_exact_redirect_and_alias(client):
    response = register(client)
    assert response.status_code == 201
    data = response.json()
    assert data["redirect_uris"] == [REDIRECT]
    assert data["isActive"] is True
    assert "_id" not in data and "client_secret" not in data
    assert client.post("/oauth/register", json={"redirect_uris": ["https://example.com"]}).status_code == 201
    assert client.collections["clients"].documents[-1]["redirect_uris"] == ["https://example.com"]

@pytest.mark.parametrize("uri", ["http://example.com/cb", "https://example.com/#fragment",
    "https://user:pass@example.com/cb", "javascript:alert(1)", "https://example.com:bad", "https://example.com/ bad"])
def test_registration_rejects_unsafe_redirects(client, uri):
    response = register(client, redirect_uris=[uri])
    assert response.status_code == 400
    assert response.json()["error"] == "invalid_client_metadata"

@pytest.mark.parametrize("overrides,error", [
    ({"client_id": "unknown"}, "invalid_client"),
    ({"redirect_uri": "https://evil.example/cb"}, "invalid_request"),
    ({"response_type": "token"}, "unsupported_response_type"),
    ({"code_challenge": ""}, "invalid_request"),
    ({"code_challenge_method": "plain"}, "invalid_request"),
    ({"resource": "https://evil.example/mcp"}, "invalid_target"),
    ({"scope": "admin"}, "invalid_scope"),
])
def test_authorize_validation(client, overrides, error):
    client_id = register(client).json()["client_id"]
    response = start(client, client_id, **overrides) if "client_id" not in overrides else start(client, overrides["client_id"])
    assert response.status_code == 400
    assert response.json()["error"] == error
    assert "location" not in response.headers

def test_full_flow_rotation_reuse_revocation_and_storage(client):
    client_id = register(client).json()["client_id"]
    code = authorize_code(client, client_id)
    response = exchange(client, client_id, code)
    assert response.status_code == 200
    first = response.json()
    assert response.headers["cache-control"] == "no-store"
    identity = introspect(client, first["access_token"])
    assert identity["active"] and identity["sub"] == "user-1" and identity["aud"] == settings.mcp_resource
    form = dict(grant_type="refresh_token", client_id=client_id,
        refresh_token=first["refresh_token"], resource=settings.mcp_resource)
    response = client.post("/token", data=form)
    assert response.status_code == 200
    second = response.json()
    assert second["refresh_token"] != first["refresh_token"]
    assert introspect(client, second["access_token"])["active"]
    assert client.post("/token", data=form).json()["error"] == "invalid_grant"
    assert not introspect(client, second["access_token"])["active"]
    assert not introspect(client, first["access_token"])["active"]
    stored = repr(client.collections["tokens"].documents)
    assert first["access_token"] not in stored and first["refresh_token"] not in stored
    assert code not in repr(client.collections["codes"].documents)
    assert client.cookies.get(oauth.SESSION_COOKIE) not in repr(client.collections["sessions"].documents)

def test_code_verifier_binding_and_replay(client):
    client_id = register(client).json()["client_id"]
    code = authorize_code(client, client_id)
    assert exchange(client, client_id, code, code_verifier="b" * 43).status_code == 400
    assert exchange(client, client_id, code, redirect_uri="https://other.example").status_code == 400
    assert exchange(client, client_id, code, resource="https://other.example").status_code == 400
    other_id = register(client).json()["client_id"]
    assert exchange(client, other_id, code).status_code == 400
    first = exchange(client, client_id, code).json()
    assert introspect(client, first["access_token"])["active"]
    assert exchange(client, client_id, code).json()["error"] == "invalid_grant"
    assert not introspect(client, first["access_token"])["active"]

def test_revocation_is_idempotent_and_client_bound(client):
    client_id = register(client).json()["client_id"]
    other_id = register(client).json()["client_id"]
    pair = exchange(client, client_id, authorize_code(client, client_id)).json()
    assert client.post("/revoke", data={"client_id": other_id, "token": pair["refresh_token"]}).status_code == 200
    assert introspect(client, pair["access_token"])["active"]
    for raw in (pair["refresh_token"], pair["refresh_token"], "unknown"):
        assert client.post("/revoke", data={"client_id": client_id, "token": raw}).status_code == 200
    assert not introspect(client, pair["access_token"])["active"]

def test_expiry_does_not_depend_on_mongo_ttl_cleanup(client):
    client_id = register(client).json()["client_id"]
    code = authorize_code(client, client_id)
    client.collections["codes"].documents[0]["expires_at"] = oauth.now() - timedelta(seconds=1)
    assert exchange(client, client_id, code).json()["error"] == "invalid_grant"
    pair = exchange(client, client_id, authorize_code(client, client_id)).json()
    client.collections["tokens"].documents[-2]["expires_at"] = oauth.now() - timedelta(seconds=1)
    assert not introspect(client, pair["access_token"])["active"]

def test_consent_csrf_login_and_transaction_single_use(client):
    client_id = register(client).json()["client_id"]
    location = start(client, client_id).headers["location"]
    transaction_id = parse_qs(urlsplit(location).query)["transaction_id"][0]
    client.get(location)
    csrf = client.cookies.get(authorize.CSRF_COOKIE)
    form = dict(transaction_id=transaction_id, csrf_token=csrf, decision="allow",
        email="user@example.com", password="wrong")
    assert client.post("/oauth/login", data=dict(form, csrf_token="wrong")).status_code == 403
    assert client.post("/oauth/login", data=form).status_code == 401
    form["password"] = "password"
    assert client.post("/oauth/login", data=form, headers={"Origin": "https://evil.example"}).status_code == 403
    assert client.post("/oauth/login", data=form, headers={"Origin": "null"}).status_code == 403
    response = client.post("/oauth/login", data=form, headers={"Origin": settings.oauth_issuer}, follow_redirects=False)
    assert response.status_code == 303
    assert len(client.collections["codes"].documents) == 1
    # Reinstall form cookie to check transaction consumption, independently of CSRF.
    client.cookies.set(authorize.CSRF_COOKIE, csrf, path="/oauth/login")
    assert client.post("/oauth/login", data=form, follow_redirects=False).status_code == 303
    assert client.get(location).status_code == 400

def test_deny_and_session_still_require_consent(client):
    client_id = register(client).json()["client_id"]
    authorize_code(client, client_id)
    location = start(client, client_id).headers["location"]
    page = client.get(location)
    assert 'name="password"' not in page.text
    tx = parse_qs(urlsplit(location).query)["transaction_id"][0]
    response = client.post("/oauth/login", data=dict(transaction_id=tx,
        csrf_token=client.cookies.get(authorize.CSRF_COOKIE), decision="deny"), follow_redirects=False)
    query = parse_qs(urlsplit(response.headers["location"]).query)
    assert query["error"] == ["access_denied"] and query["state"] == ["state & value"]
    assert len(client.collections["codes"].documents) == 1


def test_consent_template_escapes_client_name_and_uses_nonce_styles(client):
    import re
    client_id = register(client, client_name='<script>alert("app")</script>').json()["client_id"]
    location = start(client, client_id).headers["location"]
    first = client.get(location)
    nonce = re.search(r'<style nonce="([^"]+)"', first.text).group(1)
    assert f"style-src 'nonce-{nonce}'" in first.headers["content-security-policy"]
    assert "'unsafe-inline'" not in first.headers["content-security-policy"]
    assert '<script>alert("app")</script>' not in first.text
    assert "&lt;script&gt;" in first.text
    assert 'label for="email"' in first.text
    assert 'label for="password"' in first.text
    second = client.get(location)
    assert nonce not in second.headers["content-security-policy"]

def test_discovery_introspection_auth_and_errors(client):
    metadata = client.get("/.well-known/oauth-authorization-server").json()
    assert metadata["registration_endpoint"] == "http://testserver/register"
    assert metadata["code_challenge_methods_supported"] == ["S256"]
    assert client.post("/introspect", data={"token": "unknown"}).status_code == 401
    assert introspect(client, "unknown") == {"active": False}
    assert client.post("/token", json={}).json()["error"] == "invalid_request"
    assert client.get("/authorize").status_code == 400
    assert client.get("/oauth/login", params={"transaction_id": "unknown"}).status_code == 400

def test_disabled_client_and_no_refresh_grant(client):
    client_id = register(client, grant_types=["authorization_code"]).json()["client_id"]
    pair = exchange(client, client_id, authorize_code(client, client_id)).json()
    assert "refresh_token" not in pair
    client.collections["clients"].documents[0]["isActive"] = False
    assert not introspect(client, pair["access_token"])["active"]
    assert start(client, client_id).json()["error"] == "invalid_client"

def test_duplicate_token_parameters_and_scope_escalation(client):
    client_id = register(client).json()["client_id"]
    response = client.post("/token", content="client_id=a&client_id=b&grant_type=authorization_code",
        headers={"Content-Type": "application/x-www-form-urlencoded"})
    assert response.json()["error"] == "invalid_request"
    pair = exchange(client, client_id, authorize_code(client, client_id)).json()
    form = dict(grant_type="refresh_token", client_id=client_id, refresh_token=pair["refresh_token"],
        resource=settings.mcp_resource, scope="admin")
    assert client.post("/token", data=form).json()["error"] == "invalid_scope"
    form["scope"] = ""
    assert client.post("/token", data=form).json()["scope"] == ""


def test_concurrent_code_exchanges_have_one_winner_and_revoke_grant(client, monkeypatch):
    import asyncio
    from fastapi import HTTPException
    client_id = register(client).json()["client_id"]
    code = authorize_code(client, client_id)
    collection = client.collections["codes"]
    original_find = collection.find_one
    arrived = 0

    async def exercise():
        barrier = asyncio.Event()
        async def synchronized_find(query):
            nonlocal arrived
            document = await original_find(query)
            if document and not document["used"]:
                arrived += 1
                if arrived == 2:
                    barrier.set()
                await barrier.wait()
            return document
        monkeypatch.setattr(collection, "find_one", synchronized_find)
        form = dict(grant_type="authorization_code", client_id=client_id, code=code,
            redirect_uri=REDIRECT, code_verifier=VERIFIER, resource=settings.mcp_resource)
        return await asyncio.gather(tokens.exchange_token(form), tokens.exchange_token(form), return_exceptions=True)

    results = asyncio.run(exercise())
    winners = [item for item in results if isinstance(item, dict)]
    failures = [item for item in results if isinstance(item, HTTPException)]
    assert len(winners) == len(failures) == 1
    assert failures[0].detail["error"] == "invalid_grant"
    assert not introspect(client, winners[0]["access_token"])["active"]
    assert len(client.collections["grants"].documents) == 1


def test_concurrent_refresh_reuse_revokes_winning_tokens(client, monkeypatch):
    import asyncio
    from fastapi import HTTPException
    client_id = register(client).json()["client_id"]
    pair = exchange(client, client_id, authorize_code(client, client_id)).json()
    collection = client.collections["tokens"]
    original_find = collection.find_one
    arrived = 0

    async def exercise():
        barrier = asyncio.Event()
        async def synchronized_find(query):
            nonlocal arrived
            document = await original_find(query)
            if document and document["kind"] == "refresh" and not document["used"]:
                arrived += 1
                if arrived == 2:
                    barrier.set()
                await barrier.wait()
            return document
        monkeypatch.setattr(collection, "find_one", synchronized_find)
        form = dict(grant_type="refresh_token", client_id=client_id,
            refresh_token=pair["refresh_token"], resource=settings.mcp_resource)
        return await asyncio.gather(tokens.exchange_token(form), tokens.exchange_token(form), return_exceptions=True)

    results = asyncio.run(exercise())
    winners = [item for item in results if isinstance(item, dict)]
    assert len(winners) == 1
    assert len([item for item in results if isinstance(item, HTTPException)]) == 1
    assert not introspect(client, winners[0]["access_token"])["active"]


def test_mcp_adapter_checks_issuer_audience_and_fails_closed(monkeypatch):
    import asyncio
    import httpx
    from integrations.mcp_verifier import VidoraHubTokenVerifier
    from integrations import mcp_verifier

    data = {"active": True, "client_id": "client", "scope": "mcp:access", "exp": 2000000000,
        "iss": "https://auth.example", "aud": "https://mcp.example/mcp"}
    observed = []
    def handler(request):
        observed.append(request)
        return httpx.Response(200, json=data)
    real_client = httpx.AsyncClient
    monkeypatch.setattr(mcp_verifier.httpx, "AsyncClient", lambda **kwargs:
        real_client(transport=httpx.MockTransport(handler), **kwargs))
    verifier = VidoraHubTokenVerifier("https://auth.example", "https://mcp.example/mcp", "secret")
    assert asyncio.run(verifier.verify_token("access-token")).client_id == "client"
    assert observed[0].headers["authorization"] == "Bearer secret"
    data["aud"] = "https://evil.example/mcp"
    assert asyncio.run(verifier.verify_token("access-token")) is None
    data["aud"] = "https://mcp.example/mcp"
    data["iss"] = "https://evil.example"
    assert asyncio.run(verifier.verify_token("access-token")) is None
    data.clear()
    assert asyncio.run(verifier.verify_token("access-token")) is None


def consent_form(client, client_id):
    location = start(client, client_id).headers["location"]
    client.get(location, headers={"Accept": "text/html"})
    transaction_id = parse_qs(urlsplit(location).query)["transaction_id"][0]
    return location, dict(transaction_id=transaction_id,
        csrf_token=client.cookies.get(authorize.CSRF_COOKIE), decision="allow",
        email="user@example.com", password="password")


def test_failed_code_write_rolls_back_transaction_and_can_retry(client, monkeypatch, caplog):
    from pymongo.errors import OperationFailure
    client_id = register(client).json()["client_id"]
    location, form = consent_form(client, client_id)
    collection = client.collections["codes"]
    original_insert = collection.insert_one
    failed = False
    async def insert(doc, session=None):
        nonlocal failed
        if not failed:
            failed = True
            raise OperationFailure("private database error", code=91)
        return await original_insert(doc, session=session)
    monkeypatch.setattr(collection, "insert_one", insert)
    first = client.post("/oauth/login", data=form, headers={"Accept": "text/html"}, follow_redirects=False)
    assert first.status_code == 503
    assert "Try again" in first.text
    assert form["transaction_id"] in first.text
    assert 'name="password"' not in first.text and 'value="password"' not in first.text
    assert "private database error" not in first.text and "private database error" not in caplog.text
    assert first.headers["retry-after"] == "3"
    assert first.headers["x-request-id"] in caplog.text
    assert "OperationFailure" in caplog.text and "code=91" in caplog.text
    assert len(client.collections["transactions"].documents) == 1
    assert not collection.documents
    assert client.get(location).status_code == 200
    second = client.post("/oauth/login", data=form, headers={"Accept": "text/html"}, follow_redirects=False)
    assert second.status_code == 303
    assert all(doc.get("completed") for doc in client.collections["transactions"].documents)
    assert len(collection.documents) == 1


def test_session_write_failure_does_not_lose_authorization(client, monkeypatch):
    from pymongo.errors import ConnectionFailure
    from unittest.mock import AsyncMock
    client_id = register(client).json()["client_id"]
    _, form = consent_form(client, client_id)
    monkeypatch.setattr(client.collections["sessions"], "insert_one", AsyncMock(side_effect=ConnectionFailure()))
    response = client.post("/oauth/login", data=form, follow_redirects=False)
    assert response.status_code == 303
    code = parse_qs(urlsplit(response.headers["location"]).query)["code"][0]
    assert exchange(client, client_id, code).status_code == 200
    assert all(doc.get("completed") for doc in client.collections["transactions"].documents)


def test_storage_read_failure_has_browser_retry_and_api_error(client, monkeypatch):
    from pymongo.errors import ServerSelectionTimeoutError
    from unittest.mock import AsyncMock
    client_id = register(client).json()["client_id"]
    location, _ = consent_form(client, client_id)
    collection = client.collections["transactions"]
    monkeypatch.setattr(collection, "find_one", AsyncMock(side_effect=ServerSelectionTimeoutError()))
    browser = client.get(location, headers={"Accept": "text/html"})
    assert browser.status_code == 503 and "Try again" in browser.text
    api = client.get(location)
    assert api.status_code == 503
    assert api.json()["error"] == "temporarily_unavailable"
    assert api.json()["request_id"] == api.headers["x-request-id"]
    assert len(collection.documents) == 1


def test_reloading_consent_preserves_forms_in_other_tabs(client):
    client_id = register(client).json()["client_id"]
    first_location, first = consent_form(client, client_id)
    _, second = consent_form(client, client_id)
    assert first["csrf_token"] == second["csrf_token"]
    client.get(first_location)
    response = client.post("/oauth/login", data=first, follow_redirects=False)
    assert response.status_code == 303
    response = client.post("/oauth/login", data=second, follow_redirects=False)
    assert response.status_code == 303


def test_multiple_sessions_populate_legacy_unique_hash_field(client):
    client_id = register(client).json()["client_id"]
    authorize_code(client, client_id)
    authorize_code(client, client_id)
    sessions = client.collections["sessions"].documents
    assert len(sessions) == 2
    assert all(session["session_hash"] == session["session_id"] for session in sessions)
    assert len({session["session_hash"] for session in sessions}) == 2


def test_expired_and_missing_browser_transactions_offer_restart(client):
    for path in ("/oauth/login", "/oauth/login?transaction_id=expired"):
        response = client.get(path, headers={"Accept": "text/html"})
        assert response.status_code == 400
        assert "Start a new connection" in response.text
        assert "Try again</button>" not in response.text


def test_readiness_checks_database(client, monkeypatch):
    from types import SimpleNamespace
    from unittest.mock import AsyncMock
    from pymongo.errors import ConnectionFailure
    ping = AsyncMock()
    monkeypatch.setattr(main, "client", SimpleNamespace(admin=SimpleNamespace(command=ping)))
    assert client.get("/ready").json() == {"status": "ready"}
    ping.side_effect = ConnectionFailure()
    assert client.get("/ready").status_code == 503


def test_duplicate_allow_resumes_same_unused_code_and_stops_after_redemption(client):
    client_id = register(client).json()["client_id"]
    _, form = consent_form(client, client_id)
    first = client.post("/oauth/login", data=form, follow_redirects=False)
    second = client.post("/oauth/login", data=form, follow_redirects=False)
    assert first.status_code == second.status_code == 303
    assert first.headers["location"] == second.headers["location"]
    assert len(client.collections["codes"].documents) == 1
    code = parse_qs(urlsplit(first.headers["location"]).query)["code"][0]
    assert code not in repr(client.collections["transactions"].documents)
    assert exchange(client, client_id, code).status_code == 200
    assert client.post("/oauth/login", data=form, follow_redirects=False).status_code == 400


def test_completed_consent_is_bound_to_original_user_and_browser(client):
    client_id = register(client).json()["client_id"]
    _, form = consent_form(client, client_id)
    assert client.post("/oauth/login", data=form, follow_redirects=False).status_code == 303
    # A new matching cookie/form token still cannot recover another browser's result.
    other_csrf = "b" * 43
    cookie = next(cookie for cookie in client.cookies.jar if cookie.name == authorize.CSRF_COOKIE)
    cookie.value = other_csrf
    other = dict(form, csrf_token=other_csrf)
    assert client.post("/oauth/login", data=other, follow_redirects=False).status_code == 400
    cookie.value = form["csrf_token"]
    for session in client.collections["sessions"].documents:
        session["user_id"] = "different-user"
    assert client.post("/oauth/login", data=form, follow_redirects=False).status_code == 400


def test_signed_in_form_recovers_when_login_session_expires(client):
    client_id = register(client).json()["client_id"]
    authorize_code(client, client_id)
    location, form = consent_form(client, client_id)
    assert 'name="password"' not in client.get(location).text
    for session in client.collections["sessions"].documents:
        session["expires_at"] = oauth.now() - timedelta(seconds=1)
    minimal = {key: form[key] for key in ("transaction_id", "csrf_token", "decision")}
    response = client.post("/oauth/login", data=minimal, headers={"Accept": "text/html"}, follow_redirects=False)
    assert response.status_code == 200
    assert "Please sign in again" in response.text and 'name="password"' in response.text
    assert not client.collections["transactions"].documents[-1].get("completed")
    assert client.post("/oauth/login", data=form, follow_redirects=False).status_code == 303


def test_wrong_password_stays_on_form_without_echoing_password(client):
    client_id = register(client).json()["client_id"]
    _, form = consent_form(client, client_id)
    form["password"] = "bad-secret-password"
    response = client.post("/oauth/login", data=form, headers={"Accept": "text/html"})
    assert response.status_code == 200
    assert "Please try again" in response.text
    assert "bad-secret-password" not in response.text
    assert 'value="user@example.com"' in response.text
