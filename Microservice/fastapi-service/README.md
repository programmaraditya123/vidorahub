# VidoraHub MCP server

The MCP endpoint is `/mcp` (Streamable HTTP). `/`, `/health`, and
`/api/videos/trending` are ordinary HTTP routes, not MCP endpoints.
The tools currently read the sample catalog in `constants/videos.py`.

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
