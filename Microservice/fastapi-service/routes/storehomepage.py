from fastapi import APIRouter
from config.mongo import stores_collections
from services.storehomepage import get_stores_first_carousel

router = APIRouter(prefix="/api/storehomepage",tags=["storehomepage"])

@router.get("/topcarousel")
async def get_top_carousel():
    return await get_stores_first_carousel()
    