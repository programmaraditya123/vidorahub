import logging

from fastapi import APIRouter, HTTPException, Query
from pymongo.errors import PyMongoError

from services.storeproducts.products import ProductSort, find_products

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("/find")
async def find_trending_products(
    query: str | None = Query(default=None, max_length=200),
    min_price: float | None = Query(default=None, alias="minPrice", ge=0, allow_inf_nan=False),
    max_price: float | None = Query(default=None, alias="maxPrice", ge=0, allow_inf_nan=False),
    rating: float | None = Query(default=None, ge=1, le=5, allow_inf_nan=False,
                                description="Minimum average rating (inclusive)"),
    sort: ProductSort = Query(default="latest"),
    page: int = Query(default=1, ge=1, le=10000),
    limit: int = Query(default=20, ge=1, le=100),
):
    """Return active products, newest first by default, with optional filters."""
    if min_price is not None and max_price is not None and min_price > max_price:
        raise HTTPException(status_code=422, detail="minPrice must not exceed maxPrice")
    try:
        result = await find_products(
            query, min_price=min_price, max_price=max_price, rating=rating,
            sort=sort, page=page, limit=limit,
        )
    except PyMongoError:
        logger.exception("Product search failed")
        raise HTTPException(status_code=503, detail="Product search is temporarily unavailable") from None
    return {"platform": "vidorahub", "count": len(result["products"]), **result}
