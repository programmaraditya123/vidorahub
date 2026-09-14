from fastapi import APIRouter
from services.search import search_videos,find_trending_video
from services.videos import get_Video_Details

router = APIRouter(
    prefix="/api/videos",
    tags = ["videos"]
)

@router.get("/trending")
async def api_trending_videos():

    trending = await find_trending_video()

    return {
        "platform": "VidoraHub",
        "count" : len(trending),
        "videos": trending,

    }


@router.get("/api/videos/search")
async def search_vidorahub_videos(query:str):
    results = await search_videos(query)

    return {
        "platform" : "vidorahub",
        "count" : len(results),
        "videos" : results
    }

@router.get("/api/videoDetails")
async def get_VideoDetails(id : str):
    results = await get_Video_Details(id)
    return {
        "platform" : "vidorahub",
        "video deatils" : results
    }