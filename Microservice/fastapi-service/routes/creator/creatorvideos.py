from fastapi import APIRouter,Depends,Query
from services.creator.creatorvideos import get_creator_uploads,update_title,update_description,update_tags
from typing import Annotated
from services.auth import require_sign_in
from pydantic import BaseModel

router = APIRouter(
    prefix="/api/creator",
    tags=["creator videos"]
)

@router.get("/videos")
async def get_creator_videos(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user : Annotated[dict,Depends(require_sign_in)] = None
    ):
    id = user["_id"]
    videos = await get_creator_uploads(id=id,page=page,limit=limit,)
    return videos

class UpdateVideoTitleRequest(BaseModel):
    video_id: str
    title: str

class UpdateVideoDescriptionRequest(BaseModel):
    video_id: str
    description: str

class UpdateVideoTagRequest(BaseModel):
    video_id: str
    tag: list[str]

@router.post("/updateVideoTitle")
async def updateVideoTitle(
    data : UpdateVideoTitleRequest,
    user : Annotated[dict,Depends(require_sign_in)] = None
    ):
    id = user["_id"]  
    updatedVideo = await update_title(id=id,videoId=data.video_id,updatedtitle=data.title)

    return updatedVideo

@router.post("/updateVideoDescription")
async def updateVideoDescription(
    data : UpdateVideoDescriptionRequest,
    user : Annotated[dict,Depends(require_sign_in)] = None
   ):
    id = user["_id"]  
    updatedVideo = await update_description(id=id,videoId=data.video_id,updatedtags=data.description)
    
    return updatedVideo

@router.post("/updateTags")
async def updateTags(
    data : UpdateVideoTagRequest,
    user : Annotated[dict,Depends(require_sign_in)] = None
   ):
    id = user["_id"]  
    updatedVideo = await update_tags(id=id,videoId=data.video_id,updatedtags=data.tag)
    
    return updatedVideo