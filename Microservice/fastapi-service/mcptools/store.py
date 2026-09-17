from mcp.server.fastmcp import FastMCP
from mcp.types import ToolAnnotations

from routes.store import get_stores

def register_store_tools(mcp:FastMCP):
    @mcp.tool(annotations=ToolAnnotations(readOnlyHint=True,destructiveHint=False,idempotentHint=True,))
    async def find_creator_stores(page : int,limit : int):
        """find all available stores on vidorahub with pagination with page and limit"""
        stores = await get_stores(page,limit)
        return {
            "platform" : "vidorahub",
            "stores" : stores
        }