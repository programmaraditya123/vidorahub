"""Real JWT verification with a mocked MongoDB boundary."""
import importlib
import sys
import time
import unittest
from types import ModuleType, SimpleNamespace
from unittest.mock import AsyncMock, patch

import jwt
from bson import ObjectId
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import SecretStr
from pymongo.errors import ConnectionFailure


class AuthTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        mongo = ModuleType("config.mongo")
        mongo.settings = SimpleNamespace(jwt_secret=SecretStr("test-only-secret-with-at-least-32-bytes"))
        mongo.users_collection = SimpleNamespace(find_one=AsyncMock())
        with patch.dict(sys.modules, {"config.mongo": mongo}):
            cls.service = importlib.import_module("services.auth")
            cls.routes = importlib.import_module("routes.auth")
        app = FastAPI()
        app.include_router(cls.routes.router)

        @app.get("/public")
        async def public():
            return {"ok": True}

        cls.client = TestClient(app)
        cls.secret = mongo.settings.jwt_secret.get_secret_value()

    def setUp(self):
        self.user_id = ObjectId()
        self.lookup = AsyncMock(return_value={"_id": self.user_id, "name": "Test", "role": 0})
        patcher = patch.object(self.service, "users_collection", SimpleNamespace(find_one=self.lookup))
        patcher.start()
        self.addCleanup(patcher.stop)

    def token(self, **changes):
        payload = {"_id": str(self.user_id), "iat": int(time.time()), "exp": int(time.time()) + 3600}
        payload.update(changes)
        return jwt.encode(payload, self.secret, algorithm="HS256")

    def get(self, token):
        return self.client.get("/api/auth/check-session", headers={"Authorization": token})

    def test_bearer_and_legacy_tokens(self):
        for prefix in ("Bearer ", "", "bearer "):
            response = self.get(prefix + self.token())
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()["user"]["_id"], str(self.user_id))
        self.assertEqual(self.lookup.call_args.args[1], {"name": 1, "email": 1, "role": 1, "profilePicUrl": 1})

    def test_missing_header(self):
        response = self.client.get("/api/auth/check-session")
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.headers["www-authenticate"], "Bearer")
        self.lookup.assert_not_called()

    def test_invalid_tokens_do_not_query_mongo(self):
        payload = {"_id": str(self.user_id), "exp": int(time.time()) + 3600}
        invalid = ["garbage", "Bearer ", "Basic abc", self.token(exp=1),
                   self.token(_id="bad-id"), self.token(_id=123), self.token(exp=None),
                   self.token(exp="invalid"), self.token(iat=None),
                   self.token(nbf=int(time.time()) + 3600),
                   jwt.encode({"_id": str(self.user_id)}, self.secret, algorithm="HS256"),
                   jwt.encode({"exp": int(time.time()) + 3600}, self.secret, algorithm="HS256"),
                   jwt.encode(payload, "wrong-secret-with-at-least-32-bytes", algorithm="HS256"),
                   jwt.encode(payload, self.secret, algorithm="HS384")]
        for token in invalid:
            with self.subTest(token=token[:12]):
                self.assertEqual(self.get(token).status_code, 401)
        self.lookup.assert_not_called()

    def test_missing_user(self):
        self.lookup.return_value = None
        self.assertEqual(self.get(self.token()).status_code, 401)

    def test_database_failure(self):
        self.lookup.side_effect = ConnectionFailure("private database details")
        response = self.get(self.token())
        self.assertEqual(response.status_code, 503)
        self.assertNotIn("private database", response.text)

    def test_missing_secret_does_not_affect_public_route(self):
        with patch.object(self.service, "settings", SimpleNamespace(jwt_secret=None)):
            self.assertEqual(self.get(self.token()).status_code, 503)
            self.assertEqual(self.client.get("/public").status_code, 200)
        self.lookup.assert_not_called()

    def test_public_route_ignores_invalid_auth(self):
        self.assertEqual(self.client.get("/public", headers={"Authorization": "bad"}).status_code, 200)
        self.lookup.assert_not_called()


if __name__ == "__main__":
    unittest.main()
