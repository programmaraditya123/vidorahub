"""Browser OAuth + authenticated MCP tool calls; run with --help for options."""
import argparse
import asyncio
import base64
import hashlib
import json
import secrets
import threading
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlencode, urlsplit

import httpx
from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client


def acquire_tokens(auth_url, resource, timeout):
    state = secrets.token_urlsafe(32)
    verifier = secrets.token_urlsafe(64)
    challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).decode().rstrip("=")
    completed = threading.Event()
    result = {}

    class Callback(BaseHTTPRequestHandler):
        def log_message(self, *args):
            pass  # Never write authorization codes or state into HTTP logs.

        def do_GET(self):
            parsed = urlsplit(self.path)
            params = parse_qs(parsed.query)
            valid = (parsed.path == "/callback" and params.get("state") == [state]
                and all(len(values) == 1 for values in params.values())
                and bool(params.get("code") or params.get("error")))
            if not valid:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(b"Invalid callback. Return to the VidoraHub sign-in page.")
                return
            result.update({key: values[0] for key, values in params.items()})
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Referrer-Policy", "no-referrer")
            self.end_headers()
            self.wfile.write(b"Sign-in finished. Return to the terminal to see your MCP tool result.")
            completed.set()

    server = HTTPServer(("127.0.0.1", 0), Callback)
    redirect = f"http://127.0.0.1:{server.server_port}/callback"
    worker = threading.Thread(target=server.serve_forever, daemon=True)
    worker.start()
    try:
        with httpx.Client(base_url=auth_url.rstrip("/"), timeout=30, follow_redirects=False) as client:
            registration = client.post("/register", json={"client_name": "Local MCP tester",
                "redirect_uris": [redirect], "grant_types": ["authorization_code", "refresh_token"]})
            registration.raise_for_status()
            client_id = registration.json()["client_id"]
            authorization = auth_url.rstrip("/") + "/authorize?" + urlencode({
                "client_id": client_id, "redirect_uri": redirect, "response_type": "code",
                "resource": resource, "state": state, "code_challenge": challenge,
                "code_challenge_method": "S256"})
            print("Open this URL, sign in with your VidoraHub account, and click Allow:")
            print(authorization)
            webbrowser.open(authorization)
            if not completed.wait(timeout):
                raise RuntimeError("Login timed out. Run the tester again to start a fresh authorization.")
            if result.get("error"):
                raise RuntimeError("Authorization was denied. Run again and allow access.")
            response = client.post("/token", data={"grant_type": "authorization_code",
                "client_id": client_id, "code": result["code"], "redirect_uri": redirect,
                "code_verifier": verifier, "resource": resource})
            response.raise_for_status()
            return response.json()
    finally:
        server.shutdown()
        server.server_close()
        worker.join(timeout=2)


async def check_mcp(url, access_token, tool, arguments):
    async with streamablehttp_client(url, headers={"Authorization": "Bearer " + access_token}) as streams:
        async with ClientSession(streams[0], streams[1]) as session:
            await session.initialize()
            available = await session.list_tools()
            print("Available tools:", ", ".join(item.name for item in available.tools))
            response = await session.call_tool(tool, arguments)
            print(json.dumps(response.model_dump(mode="json", exclude_none=True), indent=2))
            if response.isError:
                raise RuntimeError("The MCP tool returned an error; see the result above.")


def main():
    parser = argparse.ArgumentParser(description="Get an OAuth token through browser login and test an MCP tool.")
    parser.add_argument("--auth-url", default="http://127.0.0.1:8000")
    parser.add_argument("--mcp-url", default="http://127.0.0.1:8001/mcp")
    parser.add_argument("--tool", default="get_current_vidorahub_user")
    parser.add_argument("--arguments", default="{}", help="Tool arguments as a JSON object")
    parser.add_argument("--timeout", type=int, default=300, help="Seconds to wait for browser login")
    parser.add_argument("--show-token", action="store_true", help="Print the raw access token for manual local API tests")
    args = parser.parse_args()
    arguments = json.loads(args.arguments)
    if not isinstance(arguments, dict):
        parser.error("--arguments must be a JSON object")
    pair = acquire_tokens(args.auth_url, args.mcp_url, args.timeout)
    print(f"Access token obtained from /token; expires in {pair['expires_in']} seconds.")
    if args.show_token:
        print("access_token:", pair["access_token"])
    asyncio.run(check_mcp(args.mcp_url, pair["access_token"], args.tool, arguments))


if __name__ == "__main__":
    main()
