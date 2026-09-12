import argparse
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from mcp.server.fastmcp import FastMCP
from mcp.server.transport_security import TransportSecuritySettings
from mcp.types import ToolAnnotations
from config.mongo import db,client
from services.search import search_videos,find_trending_video

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
            "vidorahub.fastapicloud.dev", "vidorahub.fastapicloud.dev:443",
            *env_list("MCP_ALLOWED_HOSTS"),
        ],
        allowed_origins=[
            "http://localhost", "http://localhost:*", "http://127.0.0.1", "http://127.0.0.1:*",
            "https://vidorahub.fastapicloud.dev","www.vidorahub.com","https://www.vidorahub.com",
            *env_list("MCP_ALLOWED_ORIGINS"),
        ],
    ),
)


@mcp.tool(annotations=ToolAnnotations(readOnlyHint=True, destructiveHint=False, idempotentHint=True))
async def search_vidorahub_videos(query: str) -> dict:
    """
    Search videos available on VidoraHub.

    Use this tool when a user wants to find videos
    on the VidoraHub platform.
    """

    results = await search_videos(query)

    return {
        "platform": "VidoraHub",
        "query": query,
        "count": len(results),
        "videos": results,
    }


@mcp.tool(annotations=ToolAnnotations(readOnlyHint=True, destructiveHint=False, idempotentHint=True))
async def get_trending_vidorahub_videos() -> dict:
    """
    Get currently trending videos on VidoraHub.
    """
    trending = await find_trending_video()
    return {
        "platform": "VidoraHub",
        "count": len(trending),
        "videos": trending,
    }


@asynccontextmanager
async def lifespan(app: FastAPI):
    await client.admin.command("ping")
    print("MongoDB connected successfully")

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
        "database" : db.name,
        "updateon" : "12-09-2026"
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
    }


@app.get("/api/videos/trending")
async def api_trending_videos():

    trending = await find_trending_video()

    return {
        "platform": "VidoraHub",
        "count" : len(trending),
        "videos": trending,

    }

@app.get("/api/videos/search")
async def search_vidorahub_videos(query:str):
    results = await search_videos(query)

    return {
        "platform" : "vidorahub",
        "count" : len(results),
        "videos" : results
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
