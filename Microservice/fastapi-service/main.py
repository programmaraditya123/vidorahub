import argparse
import os
from contextlib import asynccontextmanager
from typing import Literal
from urllib.parse import urlsplit
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mcp.server.fastmcp import FastMCP
from mcp.server.auth.settings import AuthSettings
from mcp.server.transport_security import TransportSecuritySettings
from mcp.types import ToolAnnotations

from config.mongo import db, client, settings
from services.mcp_auth import VidoraHubTokenVerifier
from services.mcp_user import get_current_mcp_user
from services.search import search_videos,find_trending_video
from services.videos import get_Video_Details
from routes.health import router as main_router
from routes.videos import router as video_router
from routes.products import router as product_router
from routes.auth import router as auth_router
from services.storeproducts.products import find_products
from routes.store import router as store_router
from mcptools.store import register_store_tools

def env_list(name: str) -> list[str]:
    return [value.strip() for value in os.getenv(name, "").split(",") if value.strip()]


mcp_resource_url = urlsplit(settings.mcp_resource)


mcp = FastMCP(
    "VidoraHub",
    json_response=True,
    stateless_http=True,
    streamable_http_path="/mcp",
    auth=AuthSettings(
        issuer_url=settings.oauth_issuer,
        resource_server_url=settings.mcp_resource,
        required_scopes=settings.oauth_scopes.split(),
    ),
    token_verifier=VidoraHubTokenVerifier(
        settings.oauth_issuer, settings.mcp_resource, settings.introspection_secret,
    ),
    transport_security=TransportSecuritySettings(
        enable_dns_rebinding_protection=True,
        allowed_hosts=[
            "localhost", "localhost:*", "127.0.0.1", "127.0.0.1:*", "[::1]", "[::1]:*",
            "vidorahub.fastapicloud.dev", "vidorahub.fastapicloud.dev:443",
            mcp_resource_url.netloc, f"{mcp_resource_url.hostname}:443",
            *env_list("MCP_ALLOWED_HOSTS"),
        ],
        allowed_origins=[
            f"{mcp_resource_url.scheme}://{mcp_resource_url.netloc}",
            "http://localhost", "http://localhost:*", "http://127.0.0.1", "http://127.0.0.1:*",
            "https://vidorahub.fastapicloud.dev","www.vidorahub.com","https://www.vidorahub.com","https://studio.vidorahub.com",
            *env_list("MCP_ALLOWED_ORIGINS"),
        ],
    ),
)


@mcp.tool(annotations=ToolAnnotations(readOnlyHint=True, destructiveHint=False, idempotentHint=True))
async def get_current_vidorahub_user() -> dict:
    """Get the VidoraHub profile of the authenticated caller."""
    return await get_current_mcp_user()


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


@mcp.tool(annotations=ToolAnnotations(readOnlyHint=True, destructiveHint=False, idempotentHint=True))
async def get_video_details(video_id : str) -> dict:
    """
    Get complete details of a VidoraHub video by MongoDB ObjectId.
    """
    video = await get_Video_Details(video_id)
    return {
        "platform" : "vidorahub",
        "video_Details" : video
    }


ProductSort = Literal["latest", "price_asc", "price_desc"]

@mcp.tool(annotations=ToolAnnotations(readOnlyHint=True, destructiveHint=False, idempotentHint=True))
async def find_products_viodrahub(
    query: str | None = None,
        *,
        min_price: float | None = None,
        max_price: float | None = None,
        rating: float | None = None,
        sort: ProductSort = "latest",
        page: int = 1,
        limit: int = 20,
) -> dict:
     """
    Search and retrieve products available on VidoraHub.

    Use this tool when the user wants to:
    - Find products by name or keyword.
    - Filter products by minimum price.
    - Filter products by maximum price.
    - Filter products by minimum rating.
    - Sort products by latest, price_asc,price_desc, rating, .
    - Browse products page by page.

    Parameters:
        query:
            Optional search keyword. Searches product names,
            descriptions, categories, or other indexed product fields.

        min_price:
            Optional minimum product price.

        max_price:
            Optional maximum product price.

        rating:
            Optional minimum rating required for returned products.

        sort:
            Sorting method:
            - latest: newest products first.
            - price_asc: lowest price first.
            - price_desc: highest price first.
            - rating: highest-rated products first.
        

        page:
            Page number. Starts from 1.

        limit:
            Maximum number of products to return.
            Default is 20.

    Returns:
        A dictionary containing:
        - platform: Platform name.
        - products: Matching product records.
        - pagination: Pagination information.
    """
     products = await find_products(
         query=query,
        min_price=min_price,
        max_price=max_price,
        rating=rating,
        sort=sort,
        page=page,
        limit=limit,
    )
     return {
        "platform ": "vidorahub",
        "products" : products
    }

register_store_tools(mcp)


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

# Public catalog requests from the web frontend; additional deployments can opt in.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://www.vidorahub.com", "https://vidorahub.com",
        "http://localhost:3000", "http://127.0.0.1:3000","https://studio.vidorahub.com",
        *env_list("FRONTEND_ALLOWED_ORIGINS"),
    ],
    allow_credentials=False,
    allow_methods=["GET","POST"],
    allow_headers=["Accept", "Content-Type", "Authorization"],
)

app.include_router(main_router)
app.include_router(video_router)
app.include_router(product_router)
app.include_router(auth_router)
app.include_router(store_router)


@app.get("/.well-known/oauth-protected-resource", tags=["OAuth"])
@app.get("/.well-known/oauth-protected-resource/mcp", include_in_schema=False)
@app.get("/mcp/.well-known/oauth-protected-resource", include_in_schema=False)
async def oauth_protected_resource():
    # The last alias also supports older SDKs that advertise this URL in 401s.
    return {
        "resource": settings.mcp_resource,
        "authorization_servers": [settings.oauth_issuer.rstrip("/")],
        "scopes_supported": settings.oauth_scopes.split(),
        "bearer_methods_supported": ["header"],
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
