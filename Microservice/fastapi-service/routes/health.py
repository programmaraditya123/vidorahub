from fastapi import APIRouter
from config.mongo import db

router = APIRouter(
    prefix="",
    tags=["Home"]
)

@router.get("/")
def home():
    return {
        "platform": "VidoraHub",
        "message": "VidoraHub MCP server is running",
        "mcp_endpoint": "/mcp",
        "transport": "streamable-http",
        "database" : db.name,
        "updateon" : "12-09-2026"
    }

@router.get("/health")
def health():
    return {
        "status": "ok",
    }