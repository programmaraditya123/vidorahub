# Run authenticated MCP tools locally

Use two HTTP services: auth on port 8000 and MCP on port 8001. Keep your existing
MongoDB settings pointing to the account database. The auth database must be on
Atlas or a replica set, since authorization and token writes use transactions.
An ordinary standalone MongoDB at localhost:27017 is insufficient.

Install dependencies once, from the workspace root:

```powershell
python -m pip install -r Microservice/vidorahub-auth/requirements.txt
python -m pip install -r Microservice/fastapi-service/requirements.txt
```

In terminal 1, start the auth service:

```powershell
Set-Location 'D:\All working projects\vidorahub\Microservice\vidorahub-auth'
$env:OAUTH_ISSUER = 'http://127.0.0.1:8000'
$env:MCP_RESOURCE = 'http://127.0.0.1:8001/mcp'
$env:OAUTH_COOKIE_SECURE = 'false'
$env:INTROSPECTION_SECRET = 'local-development-shared-secret'
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

In terminal 2, start the MCP HTTP service with matching settings:

```powershell
Set-Location 'D:\All working projects\vidorahub\Microservice\fastapi-service'
$env:OAUTH_ISSUER = 'http://127.0.0.1:8000'
$env:MCP_RESOURCE = 'http://127.0.0.1:8001/mcp'
$env:INTROSPECTION_SECRET = 'local-development-shared-secret'
python main.py --transport http --host 127.0.0.1 --port 8001
```

These process environment variables override `.env` without editing production
values. The example shared secret is for local testing only. Use the same exact
issuer, resource, scopes, and secret on both services.

In terminal 3, run the browser OAuth tester:

```powershell
Set-Location 'D:\All working projects\vidorahub\Microservice\fastapi-service'
python scripts/check_local_mcp.py --show-token
```

The tester registers a local OAuth client, generates PKCE, starts a temporary
loopback callback listener, and opens the login page in your browser. Sign in with
an existing VidoraHub email/password and click Allow. The tester receives the
authorization code, exchanges it at `/token`, connects to `/mcp`, lists tools,
and calls `get_current_vidorahub_user`. The terminal shows your profile and,
with `--show-token`, the access token. Without that flag the token is not printed.
Only test-client OAuth records are created; no user account is created or edited.
Each run creates an OAuth client named `Local MCP tester`, which remains registered.
The callback listener is closed when the flow finishes or times out.

## Direct user endpoint

Copy the printed access token into this PowerShell variable:

```powershell
$mcpAccessToken = '<access_token>'
Invoke-RestMethod -Uri 'http://127.0.0.1:8000/oauth/userinfo' -Headers @{
    Authorization = "Bearer $mcpAccessToken"
}
```

`access_token` comes from `/token`. `code`, `csrf_token`, browser session cookies,
refresh tokens, and Express login JWTs cannot be used in its place. MongoDB stores
the SHA-256 hash in `oauth_tokens.token_hash`; the raw token cannot be recovered
from the database. Access tokens expire in 15 minutes; rerun the tester for a fresh
token. Local tests need a token minted for `http://127.0.0.1:8001/mcp`.

## MCP Inspector

With Node.js available, list tools using the token from the tester:

```powershell
npx @modelcontextprotocol/inspector --cli http://127.0.0.1:8001/mcp --transport http --method tools/list --header "Authorization: Bearer $mcpAccessToken"
```

Call the user tool:

```powershell
npx @modelcontextprotocol/inspector --cli http://127.0.0.1:8001/mcp --transport http --method tools/call --tool-name get_current_vidorahub_user --header "Authorization: Bearer $mcpAccessToken"
```

See the [official Inspector CLI documentation](https://github.com/modelcontextprotocol/inspector/blob/main/clients/cli/README.md).

Authenticated user tools require HTTP transport. Running `python main.py` without
`--transport http` starts stdio, which has no HTTP bearer-token context.

## Troubleshooting

- Connection refused: start both services and check their ports.
- 401: obtain a fresh MCP access token and check matching issuer/resource/secret.
- 403: the token needs the configured scopes, normally `mcp:access`.
- Login form rejected for origin: open the tester's URL using `127.0.0.1`, matching
  `OAUTH_ISSUER` exactly rather than mixing it with `localhost`.
- Start a new connection: rerun the tester; authorization links last ten minutes.
- Tool isError with user lookup unavailable: check that the local auth service has
  the new `/oauth/userinfo` endpoint and its MongoDB connection is available.
