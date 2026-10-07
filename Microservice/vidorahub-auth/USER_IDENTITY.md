# User identity and MCP tool reuse

## Endpoint

`GET /oauth/userinfo` accepts the **MCP OAuth access token** returned by `/token`:

```http
GET /oauth/userinfo
Authorization: Bearer <access_token>
```

```json
{
  "authenticated": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Example User",
    "email": "user@example.com",
    "role": 0,
    "profilePicUrl": null
  }
}
```

The endpoint verifies expiry, revocation, the OAuth client and grant, the MCP
audience, and configured scopes before reading `userprofiles`. Missing, blocked,
or deleted accounts are rejected. Responses expose only the fields shown above
and are never cached. Invalid tokens return 401, insufficient scope returns 403,
and storage outages return 503. Refresh tokens and Express login JWTs are rejected;
`/auth/me` continues to accept the separate Express login JWT.

## Reusable functions

Auth-service code can reuse `get_user_for_access_token(raw_token)` from
`services/user_service.py`, or `require_oauth_user` from
`security/oauth_dependencies.py` as a FastAPI dependency. The underlying
`get_user_by_id(user_id)` performs a safe account lookup; use it only after
establishing the authenticated identity.

In `Microservice/fastapi-service`, any MCP tool can resolve its caller without
accepting a token or user ID in its arguments:

```python
from services.mcp_user import get_current_mcp_user

@mcp.tool()
async def my_user_tool() -> dict:
    user = await get_current_mcp_user()
    # Use user["id"] to restrict account-specific queries to this caller.
    return {"user_id": user["id"]}
```

The helper obtains the bearer token from the MCP SDK's authenticated request
context and calls the auth server's `/oauth/userinfo`. It does not cache identities
between users and rejects lookup failures. `get_current_vidorahub_user` is a
registered tool using this helper. Deploy the auth server before deploying the
MCP service so the new endpoint is available.

## Token storage and validation

With the current configuration, both access and refresh token records are in
`test.oauth_tokens`, distinguished by `kind="access"` and `kind="refresh"`.
Only `SHA-256(raw_token)` is stored in `token_hash`, alongside the owning `user_id`,
client, resource, scope, grant and expiry. The raw token is returned to the OAuth
client once and cannot be recovered from MongoDB. The older `oauth_access_tokens`
and `oauth_refresh_tokens` collections are not used by this implementation.
`test.oauth_grants` controls grant-wide revocation; `test.userprofiles` contains
the account. Changing `MONGODB_DATABASE` changes the OAuth database, and changing
`MONGODB_USERS_DATABASE` can separately change the account database.

ChatGPT performs OAuth with PKCE, obtains tokens from `/token`, and attaches the
access token to MCP requests in `Authorization: Bearer <token>`. Validation is
performed by this MCP server: `services/mcp_auth.py` calls `/introspect` using the
server-only introspection secret, checks issuer, audience and expiry, and the SDK
enforces required scopes before running a tool. The auth server hashes the raw
token and checks `oauth_tokens`, `oauth_client`, and `oauth_grants`. The user helper
then resolves the account. These tokens are opaque, so there is no JWT signature
or client-side decoding step. See the [official OpenAI authentication guide](https://developers.openai.com/plugins/build/auth).
