import argparse
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from mcp.server.fastmcp import FastMCP
from mcp.server.transport_security import TransportSecuritySettings
from mcp.types import ToolAnnotations

from constants.videos import VIDEOS


def search_videos(query: str):
    """Search VidoraHub videos by title and category."""

    query = query.lower().strip()

    results = []

    for video in VIDEOS:
        title = video["title"].lower()
        category = video["category"].lower()

        if query in title or query in category:
            results.append(video)

    return results


def env_list(name: str) -> list[str]:
    return [value.strip() for value in os.getenv(name, "").split(",") if value.strip()]


mcp = FastMCP(
    "VidoraHub",
    json_response=True,
    stateless_http=True,
    streamable_http_path="/mcp",
    transport_security=TransportSecuritySettings(
        enable_dns_rebinding_protection=True,
        allowed_hosts=[
            "localhost", "localhost:*", "127.0.0.1", "127.0.0.1:*", "[::1]", "[::1]:*",
            *env_list("MCP_ALLOWED_HOSTS"),
        ],
        allowed_origins=[
            "http://localhost", "http://localhost:*", "http://127.0.0.1", "http://127.0.0.1:*",
            *env_list("MCP_ALLOWED_ORIGINS"),
        ],
    ),
)


@mcp.tool(annotations=ToolAnnotations(readOnlyHint=True, destructiveHint=False, idempotentHint=True))
def search_vidorahub_videos(query: str) -> dict:
    """
    Search videos available on VidoraHub.

    Use this tool when a user wants to find videos
    on the VidoraHub platform.
    """

    results = search_videos(query)

    return {
        "platform": "VidoraHub",
        "query": query,
        "count": len(results),
        "videos": results,
    }


@mcp.tool(annotations=ToolAnnotations(readOnlyHint=True, destructiveHint=False, idempotentHint=True))
def get_trending_vidorahub_videos() -> dict:
    """
    Get currently trending videos on VidoraHub.
    """

    trending = sorted(
        VIDEOS,
        key=lambda video: video["views"],
        reverse=True,
    )

    return {
        "platform": "VidoraHub",
        "count": min(len(trending), 5),
        "videos": trending[:5],
    }


@asynccontextmanager
async def lifespan(app: FastAPI):

    async with mcp.session_manager.run():
        yield


app = FastAPI(
    title="VidoraHub MCP Server",
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/")
def home():
    return {
        "platform": "VidoraHub",
        "message": "VidoraHub MCP server is running",
        "mcp_endpoint": "/mcp",
        "transport": "streamable-http",
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
    }


@app.get("/api/videos/trending")
async def api_trending_videos():

    trending = sorted(
        VIDEOS,
        key=lambda video: video["views"],
        reverse=True,
    )

    return {
        "platform": "VidoraHub",
        "videos": trending[:5],
    }


# Mount at root: FastMCP already owns /mcp. Mounting at /mcp doubles
# the prefix and makes clients receive 404 at the advertised endpoint.
app.mount("/", mcp.streamable_http_app())


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="VidoraHub MCP server")
    parser.add_argument("--transport", choices=["stdio", "http"], default="stdio")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()
    if args.transport == "stdio":
        mcp.run(transport="stdio")
    else:
        import uvicorn

        uvicorn.run(app, host=args.host, port=args.port)
