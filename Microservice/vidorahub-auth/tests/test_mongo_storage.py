"""Opt-in real MongoDB flow using a temporary, isolated database.

Run from the auth folder with VHOAUTH_RUN_MONGO_TESTS=1. Uses .env credentials,
creates only a vh_oauth_smoke_<random> database, and removes it in finally.
"""
import os
import secrets
import sys
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

import pytest


@pytest.mark.skipif(os.getenv("VHOAUTH_RUN_MONGO_TESTS") != "1",
    reason="Real MongoDB test requires explicit opt-in")
def test_real_mongo_authorize_login_tokens_and_refresh(monkeypatch):
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    import bcrypt
    from bson import ObjectId
    from dotenv import dotenv_values
    from fastapi.testclient import TestClient
    from motor.motor_asyncio import AsyncIOMotorClient
    from pydantic import SecretStr
    from pymongo import MongoClient
    import main
    from config import mongo
    from security import dependencies
    from security.pkce import create_code_challenge
    from services import oauth_service, token_service, user_service

    env = dotenv_values(Path(__file__).resolve().parents[1] / ".env")
    uri = os.getenv("VHOAUTH_MONGO_TEST_URI") or env.get("MONGODB_URI")
    assert uri, "Set VHOAUTH_MONGO_TEST_URI or configure .env MONGODB_URI"
    database_name = "vh_oauth_smoke_" + secrets.token_hex(10)
    sync = MongoClient(uri, serverSelectionTimeoutMS=10000, connectTimeoutMS=5000,
        socketTimeoutMS=15000)
    driver = AsyncIOMotorClient(uri, tz_aware=True, serverSelectionTimeoutMS=10000,
        connectTimeoutMS=5000, socketTimeoutMS=15000)
    db = driver[database_name]
    collections = {
        "oauth_clients_collection": "oauth_client",
        "oauth_authorization_codes_collection": "oauth_authorization_codes",
        "oauth_sessions_collection": "oauth_sessions",
        "oauth_transactions_collection": "oauth_transactions",
        "oauth_tokens_collection": "oauth_tokens",
        "oauth_grants_collection": "oauth_grants",
        "users_collection": "userprofiles",
    }
    for module in (mongo, oauth_service, user_service, dependencies):
        for attribute, name in collections.items():
            if hasattr(module, attribute):
                monkeypatch.setattr(module, attribute, db[name])
    for module in (mongo, main, oauth_service):
        monkeypatch.setattr(module, "client", driver)
    for attribute, name in (("codes", "oauth_authorization_codes"),
        ("tokens", "oauth_tokens"), ("grants", "oauth_grants")):
        monkeypatch.setattr(token_service, attribute, db[name])
    monkeypatch.setattr(mongo.settings, "oauth_cookie_secure", False)
    monkeypatch.setattr(mongo.settings, "oauth_issuer", "http://testserver")
    monkeypatch.setattr(mongo.settings, "mcp_resource", "https://mcp.example/mcp")
    monkeypatch.setattr(mongo.settings, "introspection_secret", SecretStr("smoke-test-secret"))
    stored = sync[database_name]
    created = False
    try:
        user_id = ObjectId()
        stored.userprofiles.insert_one({"_id": user_id, "email": "smoke@example.com",
            "password": bcrypt.hashpw(b"smoke-password", bcrypt.gensalt(rounds=4)).decode()})
        created = True
        # Preserve the legacy index alongside the current session index.
        stored.oauth_sessions.create_index("session_hash", unique=True)
        with TestClient(main.app) as browser:
            assert browser.get("/ready").status_code == 200
            redirect = "http://127.0.0.1:3000/callback"
            registration = browser.post("/register", json={"redirect_uris": [redirect],
                "grant_types": ["authorization_code", "refresh_token"]})
            assert registration.status_code == 201
            client_id = registration.json()["client_id"]
            verifier = "a" * 43
            for _ in range(2):
                response = browser.get("/authorize", params={"client_id": client_id,
                    "redirect_uri": redirect, "response_type": "code", "state": "smoke-state",
                    "resource": mongo.settings.mcp_resource,
                    "code_challenge": create_code_challenge(verifier),
                    "code_challenge_method": "S256"}, follow_redirects=False)
                assert response.status_code == 302
                location = response.headers["location"]
                transaction_id = parse_qs(urlsplit(location).query)["transaction_id"][0]
                assert stored.oauth_transactions.find_one({"transaction_id": transaction_id})
                assert browser.get(location).status_code == 200
                assert browser.get("/oauth/login").status_code == 200
                response = browser.post("/oauth/login", data={"transaction_id": transaction_id,
                    "csrf_token": browser.cookies.get("vh_oauth_csrf"), "decision": "allow",
                    "email": "smoke@example.com", "password": "smoke-password"},
                    headers={"Origin": "http://testserver"}, follow_redirects=False)
                assert response.status_code == 303, response.text
                query = parse_qs(urlsplit(response.headers["location"]).query)
                assert query["state"] == ["smoke-state"]
                response = browser.post("/token", data={"grant_type": "authorization_code",
                    "client_id": client_id, "code": query["code"][0], "redirect_uri": redirect,
                    "code_verifier": verifier, "resource": mongo.settings.mcp_resource})
                assert response.status_code == 200, response.text
                pair = response.json()
                response = browser.post("/token", data={"grant_type": "refresh_token",
                    "client_id": client_id, "refresh_token": pair["refresh_token"],
                    "resource": mongo.settings.mcp_resource})
                assert response.status_code == 200, response.text
                access = response.json()["access_token"]
                response = browser.post("/introspect", data={"token": access},
                    headers={"Authorization": "Bearer smoke-test-secret"})
                assert response.json()["active"] and response.json()["sub"] == str(user_id)
                assert browser.post("/revoke", data={"token": access,
                    "client_id": client_id}).status_code == 200
                assert not browser.post("/introspect", data={"token": access},
                    headers={"Authorization": "Bearer smoke-test-secret"}).json()["active"]
            assert stored.oauth_sessions.count_documents({}) == 2
    finally:
        driver.close()
        # The name is generated here, never taken from production configuration.
        try:
            if created:
                sync.drop_database(database_name)
        finally:
            sync.close()
