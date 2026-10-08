from mcp.server.fastmcp import FastMCP
from mcp.types import ToolAnnotations
from services.creator.creatorvideos import get_creator_uploads
from services.mcp_user import get_current_mcp_user
from bson import ObjectId

def register_creator_tools(mcp:FastMCP):
    @mcp.tool(annotations = ToolAnnotations(readOnlyHint=True,destructiveHint=False,idempotentHint=True,))
    async def find_creator_user_uploads(page : int, limit : int):
        """Fetch all uploaded videos and vibes of creator as well as user with pagination with page and limit"""
        user = await get_current_mcp_user()
        user_id = ObjectId(user["id"]) or ObjectId(user["_id"])
        uploads = await get_creator_uploads(id=user_id,page=page,limit=limit)
        return {
            "platform" : "vidorahub",
            "uploads" : uploads
        }