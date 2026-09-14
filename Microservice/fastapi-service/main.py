import argparse
import os
from contextlib import asynccontextmanager
from typing import Literal
from fastapi import FastAPI
from mcp.server.fastmcp import FastMCP
from mcp.server.transport_security import TransportSecuritySettings
from mcp.types import ToolAnnotations

from config.mongo import db,client
from services.search import search_videos,find_trending_video
from services.videos import get_Video_Details
from routes.health import router as main_router
from routes.videos import router as video_router
from routes.products import router as product_router
from services.storeproducts.products import find_products

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
async def find_products(
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

app.include_router(main_router)
app.include_router(video_router)
app.include_router(product_router)





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
