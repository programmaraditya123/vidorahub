from typing import Annotated, Literal

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.model.recommender import RecommendationService

router = APIRouter(prefix="/model", tags=["model"])


class RecommendationResponseItem(BaseModel):
    id: str = Field(alias="_id")
    title: str
    description: str
    tags: list[str]
    aitags: list[str]
    contentType: str
    videoSerialNumber: int | None = None
    thumbnailUrl: str | None = None
    videoUrl: str | None = None
    recommendationScore: float


class RecommendationResponse(BaseModel):
    ok: bool
    contentType: str
    watchedVideoIds: list[str]
    total: int
    items: list[RecommendationResponseItem]


_service: RecommendationService | None = None


def _get_service() -> RecommendationService:
    global _service
    if _service is None:
        _service = RecommendationService()
    return _service


@router.get("/recommendations", response_model=RecommendationResponse)
def get_recommendations(
    tags: Annotated[
        list[str],
        Query(
            default_factory=list,
            description="User interests. Send repeated values or comma-separated text.",
        ),
    ],
    watched_video_ids: Annotated[
        list[str],
        Query(
            default_factory=list,
            description="Videos already watched by the user. Send repeated values or comma-separated ids.",
        ),
    ],
    content_type: Annotated[
        Literal["all", "video", "vibe"],
        Query(description="Filter recommendations to videos, vibes, or both."),
    ] = "all",
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> RecommendationResponse:
    try:
        recommendations = _get_service().recommend(
            user_tags=tags,
            watched_video_ids=watched_video_ids,
            content_type=content_type,
            limit=limit,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    items = [
        RecommendationResponseItem(
            _id=item.id,
            title=item.title,
            description=item.description,
            tags=item.tags,
            aitags=item.aitags,
            contentType=item.content_type,
            videoSerialNumber=item.video_serial_number,
            thumbnailUrl=item.thumbnail_url,
            videoUrl=item.video_url,
            recommendationScore=item.score,
        )
        for item in recommendations
    ]

    return RecommendationResponse(
        ok=True,
        contentType=content_type,
        watchedVideoIds=watched_video_ids,
        total=len(items),
        items=items,
    )
