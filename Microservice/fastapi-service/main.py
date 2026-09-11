from contextlib import asynccontextmanager
from fastapi import FastAPI
from mcp.server.fastmcp import FastMCP
from constants.videos import VIDEOS



def search_videos(query: str):
    "search vidorahub videos by title and category"
    query = query.lower().strip()
    results = []
    for video in VIDEOS:
        title = video["title"].lower()
        category = video["category"].lower()
        if query in title or query in category:
            results.append(video)
            return results


mcp = FastMCP("VidoraHub", json_response=True, )


@mcp.tool() 
def search_vidorahub_videos(query: str) -> dict: 
    """ Search videos available on VidoraHub. Use this tool when a user wants to find videos on the VidoraHub platform. """ 
    results = search_videos(query) 
    return {"platform": "VidoraHub", "query": query, "count": len(results), "videos": results, }

@mcp.tool() 
def get_trending_vidorahub_videos() -> dict: 
    """ Get currently trending videos on VidoraHub. """ 
    trending = sorted( VIDEOS, key=lambda video: video["views"], reverse=True, ) 
    return { "platform": "VidoraHub", "videos": trending[:5], }

@asynccontextmanager 
async def lifespan(app: FastAPI): 
    async with mcp.session_manager.run(): yield

app = FastAPI(
    title="vidoravibe Backend",
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/")
def home():
    return { "platform": "VidoraHub", 
            "message": "VidoraHub backend is running",
              }


@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/api/videos/trending") 
async def api_trending_videos(): 
    trending = sorted( VIDEOS, key=lambda video: video["views"], reverse=True, ) 
    return { "platform": "VidoraHub", "videos": trending[:5], }


app.mount("/mcp",mcp.streamable_http_app())