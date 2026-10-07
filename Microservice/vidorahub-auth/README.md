# VidoraHub MCP authorization server

A small FastAPI authorization server for public MCP clients using authorization code + S256 PKCE. Existing Vidorahub accounts remain in MongoDB `userprofiles`. Client registration registers OAuth apps, not user accounts.

## Run

From this directory:

```powershell
python -m pip install -r requirements.txt
Copy-Item .env.example .env  # only when .env does not already exist
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Configure `MONGODB_URI` and `MONGODB_DATABASE` for the existing Vidorahub database. Set `OAUTH_ISSUER` to this service's public origin, `MCP_RESOURCE` to the exact public MCP endpoint, and `INTROSPECTION_SECRET` to a long random secret shared only with the MCP service. `JWT_SECRET` is optional and only enables `/auth/me` for existing Express login JWTs.

If existing accounts are in another database on the same MongoDB cluster, set `MONGODB_USERS_DATABASE` to that database. User lookups (password sign-in and `/auth/me`) use its `userprofiles` collection; OAuth clients, transactions and tokens remain in `MONGODB_DATABASE`. When unset, both use `MONGODB_DATABASE`. The checked workspace and deployment use `test` for both accounts and OAuth records. Browser authorization records are in `test.oauth_transactions`; the separate `transactions` collection is not used by this service.

For local development use `OAUTH_ISSUER=http://localhost:8000` and `OAUTH_COOKIE_SECURE=false`. Production must use HTTPS and secure cookies. Never publish `.env`.

## Flow and endpoints

1. `POST /register` with JSON: `{"redirect_uris":["http://127.0.0.1:3000/callback"],"grant_types":["authorization_code","refresh_token"]}`. Name defaults to `MCP client`; clients are activated by the server. `/oauth/register` remains an alias. Only public clients (`token_endpoint_auth_method=none`) are supported. Redirect strings are preserved and compared exactly. HTTPS is required except for loopback HTTP.
2. Discover endpoints at `GET /.well-known/oauth-authorization-server`.
3. Open `GET /authorize` with `client_id`, `redirect_uri`, `response_type=code`, `code_challenge`, `code_challenge_method=S256`, `resource`, and optionally `state` and `scope`. The default scope is `mcp:access`.
4. The server presents its own `/oauth/login` page with the requested client, destination and permissions. The user signs in with their existing email/password and explicitly allows or denies access. A valid session skips password entry but still requires consent. Transactions expire after ten minutes. Repeated consent submissions by the same authenticated user/browser recover the same unused authorization code instead of issuing another code. The server returns `code` and the original `state` to the registered redirect URI, preserving its existing query string.
5. `POST /token` with **application/x-www-form-urlencoded** fields: `grant_type=authorization_code`, `client_id`, `code`, `redirect_uri`, `code_verifier`, `resource`. Codes expire after five minutes and are consumed atomically. Clients allowing the refresh grant also receive a refresh token.
6. Refresh with `grant_type=refresh_token`, `client_id`, `refresh_token`, `resource`, optionally a narrower `scope`. Every refresh rotates the token. Reuse revokes the entire grant, including its access tokens. Grants have a fixed 30-day maximum lifetime; access tokens last 15 minutes.
7. `POST /revoke` with `token`, `client_id` and optional `token_type_hint`. Either token revokes the entire grant. Unknown tokens return success.
8. The MCP service calls `POST /introspect` with form field `token` and `Authorization: Bearer <INTROSPECTION_SECRET>`. An active response includes `sub` (Vidorahub user ID), `client_id`, `aud`, `scope`, `iss`, `iat`, and `exp`. Login JWTs and refresh tokens are not MCP access tokens.

Tokens and session IDs are stored as SHA-256 hashes. All expiry checks happen in queries; MongoDB TTL cleanup is only housekeeping. OAuth responses use standard error fields and no-store headers. Disabling an OAuth client (`isActive=false` in MongoDB) immediately rejects its tokens. Existing unexpired plaintext sessions from the previous implementation are invalidated; users sign in again.

## Connect the MCP resource server

See [User identity and MCP tool reuse](USER_IDENTITY.md) for `/oauth/userinfo`,
the reusable user helpers, token collections, and ChatGPT's validation flow.

The separate `Microservice/fastapi-service` MCP service must validate bearer tokens and advertise protected-resource metadata. Its HTTP transport is wired to `services/mcp_auth.py` for introspection. Deploy both services with matching issuer, resource and introspection-secret settings. Deploying this auth service alone does not protect an older MCP deployment.

The MCP service is configured with `AuthSettings` and a token verifier. For another resource service, `integrations/mcp_verifier.py` is a reusable adapter; the wiring is:

```python
from mcp.server.auth.settings import AuthSettings
from integrations.mcp_verifier import VidoraHubTokenVerifier

mcp = FastMCP(
    "VidoraHub",
    # Keep existing transport/tool configuration here.
    auth=AuthSettings(
        issuer_url=OAUTH_ISSUER,
        resource_server_url=MCP_RESOURCE,
        required_scopes=["mcp:access"],
    ),
    token_verifier=VidoraHubTokenVerifier(
        OAUTH_ISSUER, MCP_RESOURCE, INTROSPECTION_SECRET,
    ),
)
```

The SDK supplies protected-resource metadata and bearer-token enforcement. The adapter checks the audience and issuer and fails closed if introspection fails. For tools needing a user identity, use authenticated introspection's `sub`; never treat a client ID as a user ID. Keep the introspection secret on the server.

## Deployment boundaries

Use a reverse proxy to enforce request-size limits and rate limits on `/register`, `/authorize`, `/oauth/login`, and `/token`, especially password attempts. Open registration creates database records and must be protected against abuse. The service deliberately has no in-process rate limiter or Redis dependency. Trust proxy headers only from your proxy. Restrict introspection network access to the MCP service when possible.

Password sign-in is implemented against the same bcrypt hashes as Express. Google-only accounts without passwords need an existing frontend/Google sign-in bridge before they can use this page; no new password or account is created here. This implementation supports dynamic registration and pre-registered clients; it does not fetch client ID metadata documents or provide OpenID Connect.

## Test

```powershell
python -m pip install -r requirements-dev.txt
python -m pytest tests -q
```

Tests replace MongoDB collections with in-memory implementations and skip application startup. They cover registration, unsafe redirects, authorization validation, sign-in, CSRF, consent, single-use transactions, PKCE/client/resource binding, replay, refresh rotation, scope narrowing, revocation, expiry, discovery and introspection authentication. A real MongoDB/proxy deployment smoke test is still required.

Protocol references: [MCP authorization](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization), [RFC 7591 registration](https://www.rfc-editor.org/rfc/rfc7591), [RFC 7662 introspection](https://www.rfc-editor.org/rfc/rfc7662), [RFC 9700 OAuth security](https://www.rfc-editor.org/rfc/rfc9700).


## Storage failures and login retries

The consent page's CSP permits form submission to this service and the validated
OAuth callback origin. Chrome checks the cross-origin redirect after the login
POST against `form-action`; allowing only `'self'` can block the callback even
after login successfully returns 303. Callback paths and query parameters are
excluded from this policy, and callback origins are encoded to prevent directive
injection. Other pages keep their existing policy.

If login says "Start a new connection", begin a fresh authorization from the app
connecting to VidoraHub. Each browser transaction expires after ten minutes and
MongoDB then cleans it up with a TTL index. Opening `/oauth/login` directly in
the same browser resumes its latest pending transaction using an HttpOnly cookie.
An explicit transaction ID takes priority; expired or completed transactions are
never replaced with another request's consent details.

Code exchange and refresh rotation commit consumption, grant creation, and token
inserts together. A failed token write rolls back the consumed code or refresh
token so the same request can be retried. Initial OAuth writes also require
majority acknowledgment. Startup logs identify the configured OAuth and account
databases without printing credentials.

To verify the complete flow with real MongoDB, run this optional test from this
directory. It creates and removes a randomly named temporary database and never
changes existing users or OAuth records. The credentials need permission to
create and drop that temporary database.

```powershell
$env:VHOAUTH_RUN_MONGO_TESTS = "1"
python -m pytest tests/test_mongo_storage.py -q
Remove-Item Env:VHOAUTH_RUN_MONGO_TESTS
```

Set `VHOAUTH_MONGO_TEST_URI` to use a test cluster; otherwise the test reads
`MONGODB_URI` from `.env`.

Authorization completion marks the browser transaction complete and inserts its code
in one MongoDB transaction. Use MongoDB Atlas or a replica set (including for local
development); standalone MongoDB does not support this atomic operation.
The driver retries eligible reads/writes and transient transaction/commit errors.
A failed/aborted code write keeps the original browser transaction available until
its normal ten-minute expiry. A remembered login session is optional: if its write
fails after the code commits, the code is still returned to ChatGPT.

Session writes populate both hashed `session_id` and legacy `session_hash` fields.
This preserves compatibility with the older unique `session_hash` index, which
otherwise rejects repeated inserts with a missing/null value. No account records
or indexes need to be deleted for this fix.

Browser storage errors show a retry page with the transaction ID and a support
reference; passwords are never embedded in retry pages. Missing/expired links tell
users to restart linking from ChatGPT. Reloading consent preserves the existing
CSRF token so another pending browser tab remains valid. Completed transactions retain an encrypted recovery copy of their code until expiry.
Recovery is bound to the original user and browser CSRF token; redeemed or expired
codes cannot be recovered or exchanged again. The encryption key is derived from
`INTROSPECTION_SECRET` (or `JWT_SECRET` as a fallback), so all auth replicas must
share the same secret. Rotating it invalidates outstanding recovery results. Codes
remain single-use at `/token`.

`GET /ready` checks database connectivity and returns 503 during an outage.
503 responses include `Retry-After: 3` and `X-Request-ID`. Server logs record the
request reference, route, MongoDB exception type and error code, excluding exception
messages and credentials. Use these to identify deployment-specific failures:
network/Atlas IP allowlists, database credentials/permissions, unsupported standalone
transactions, or index conflicts. OAuth collections need read/write access; the
existing user database needs read access. Application retries cannot fix persistent
permissions, bad credentials or blocked network access.


A consent form without email/password is valid only while its login session is
active. If that session expires before submission, browser requests show the
sign-in form again. Incorrect credentials stay on the form with an inline error;
passwords are not echoed. Transactions deleted by older deployments or removed by
TTL cannot be recreated from a transaction ID alone; start a fresh ChatGPT linking
flow after deploying these changes.
