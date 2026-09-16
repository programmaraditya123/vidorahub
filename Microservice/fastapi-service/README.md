# VidoraHub MCP server

The MCP endpoint is `/mcp` (Streamable HTTP). `/`, `/health`, and
`/api/videos/trending` are ordinary HTTP routes, not MCP endpoints.
The tools currently read the sample catalog in `constants/videos.py`.

The production host `vidorahub.fastapicloud.dev` is explicitly allowed.
After deploying this code, use `https://vidorahub.fastapicloud.dev/mcp`
in Gemini Spark's custom-app URL field. A `421 Invalid Host header`
response means MCP host validation rejected the hostname; `/health` can
still succeed in that situation. Other domains need `MCP_ALLOWED_HOSTS`.

Run these commands from this directory in PowerShell.

## URL-based MCP clients

```powershell
.\.venv\Scripts\python.exe main.py --transport http --port 8000
```

Configure a local client with `http://127.0.0.1:8000/mcp`.
For a cloud-hosted client, deploy the server or expose it through your HTTPS
tunnel and configure `https://YOUR_HOST/mcp`. A cloud client cannot reach
this computer through its own `localhost`.

Before starting the server behind a domain or tunnel, explicitly allow its
host. Include a port if the client sends a non-default port. If the client
sends an Origin header, allow that exact origin as well:

```powershell
$env:MCP_ALLOWED_HOSTS = 'YOUR_HOST'
$env:MCP_ALLOWED_ORIGINS = 'https://YOUR_HOST'
.\.venv\Scripts\python.exe main.py --transport http --host 0.0.0.0 --port 8000
```

Both variables accept comma-separated values. Restart the process after
changing them. Host validation stays enabled. This sample server has no
OAuth or bearer-token authentication; select no authentication when testing
this sample catalog in an MCP client that offers that setting.

Existing ASGI deployment commands also work:

```powershell
.\.venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000
```

## Command-based MCP clients

Set the executable to the absolute path of `.venv/Scripts/python.exe` and
arguments to the absolute path of `main.py`, followed by `--transport`,
`stdio`. No separate HTTP process is required for this transport.
Running `main.py` without arguments also starts stdio MCP.

## Verification

```powershell
.\.venv\Scripts\python.exe -m unittest test_mcp -v
```

The tests initialize MCP, discover both tools, and invoke them over HTTP;
they also check stdio discovery/invocation and rejection of untrusted hosts.
A successful `/health` response alone does not verify MCP discovery.

After restarting/redeploying the server, reconnect or refresh the client's
MCP tool list. The advertised tools are `search_vidorahub_videos` and
`get_trending_vidorahub_videos`.

## Product catalog search

`GET /api/products/find` accepts only optional parameters:

| Parameter | Meaning | Default |
| --- | --- | --- |
| `query` | Literal, case-insensitive text across name, description, category, brand and tags; max 200 characters | No text filter |
| `minPrice` / `maxPrice` | Inclusive nonnegative price bounds | No price bounds |
| `rating` | Minimum `rating.average`, from 1 to 5 inclusive | No rating filter |
| `sort` | `latest`, `price_asc`, or `price_desc` | `latest` |
| `page` | Page number, 1–10000 | 1 |
| `limit` | Products per page, 1–100 | 20 |

Example: `/api/products/find?query=shirt&minPrice=100&maxPrice=2000&rating=4&sort=price_asc`

With no parameters, all active products are eligible, ordered newest first and
returned in pages. Responses retain `platform`, `count` (this page), and
`products`, and add `page`, `limit`, `hasMore`, and `nextPage`. Follow `nextPage`
with the same filters to browse more results. Equal sort values use creation
time and product ID as deterministic tie breakers. As with offset pagination,
concurrent catalog changes can shift later pages.

`creatorId` now contains a public profile object (`_id`, `username`, `name`,
`avatar`) joined from `userprofiles`, or null if the profile is missing.
It is no longer a bare ID string. Inactive products are always excluded.
Invalid filters return 422; database failures return a generic 503.

The Product schema in `Backend/modules/store/store.model.js` defines compound
indexes for active/latest and both price sort directions. Ensure those indexes
are built in the deployment database if Mongoose automatic index creation is
disabled. This change does not execute an index migration. Substring searches
across multiple fields still require scanning candidates; a large catalog
should use a dedicated search index. Deep offset pages are also more expensive.
Queries have a five-second database execution limit and fetch one extra record
to report `hasMore` without counting the entire matching catalog.

Run the isolated HTTP/service contract tests with `python -m unittest test_products -v`.
These tests mock MongoDB; they do not replace database integration or load tests.

## Authentication for selected HTTP APIs

FastAPI reuses login tokens from Backend/modules/auth. Registration, password
login, and Google login remain in the backend. Set JWT_SECRET in this service's
.env or deployment environment to the same secret as the backend, and use the
same MongoDB database. Never send JWT_SECRET to the browser.
Install dependencies: `.\.venv\Scripts\python.exe -m pip install -r requirements.txt`.

GET /api/auth/check-session is protected and returns {"ok": true, "user": ...}.
The service verifies HS256, exp, and _id, then loads _id, name, email, role,
and profilePicUrl from userprofiles. Both backend login flows already set exp.
Like Express, this checks identity and user existence, not role, blocked/deleted
flags, or resource ownership. Add those checks where an endpoint needs them.
Failures return 401 with a detail message; configuration/database failures return 503.

Protect only the routes you choose:

```python
from typing import Annotated
from fastapi import Depends
from services.auth import require_sign_in

@router.get("/private-example")
async def private_example(user: Annotated[dict, Depends(require_sign_in)]):
    return {"userId": user["_id"]}

@router.get("/public-example")
async def public_example():
    return {"message": "No token needed"}
```

If the handler does not need the user, use
`@router.get("/private-example", dependencies=[Depends(require_sign_in)])`.
The dependency also sets request.state.user. To protect an entire router, use
`APIRouter(dependencies=[Depends(require_sign_in)])`. Do not add it to the whole
app when only selected APIs need authentication.

```javascript
const response = await fetch(`${FASTAPI_URL}/api/auth/check-session`, {
  headers: { Authorization: `Bearer ${token}` },
});
```

Use the token returned by backend login. Legacy raw Authorization tokens also
work. CORS permits Authorization for configured frontend origins. Existing
products, videos, health, and MCP endpoints remain public. This dependency
protects HTTP routes, not MCP tool calls. If adding cross-origin POST/PUT/DELETE
routes, also allow those methods in main.py.

Run auth tests: `.\.venv\Scripts\python.exe -m unittest test_auth -v`.
Tests use real JWT verification with mocked MongoDB; they do not access live users.
