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
