import re
from typing import Literal

from bson import ObjectId

from config.mongo import products_collections


ProductSort = Literal["latest", "price_asc", "price_desc"]
PRODUCT_FIELDS = {
    field: 1
    for field in (
        "name", "description", "category", "brand", "tags", "price",
        "currency", "images", "rating", "analytics", "shippingRequired",
        "createdAt", "updatedAt", "creatorId",
    )
}


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
    """Search active products; rating is an inclusive minimum average rating."""
    filters = {"status": "active"}
    search = (query or "").strip()
    if search:
        # Treat input as literal text, never as a caller-controlled regex.
        filters["$or"] = [
            {field: {"$regex": re.escape(search), "$options": "i"}}
            for field in ("name", "description", "category", "brand", "tags")
        ]
    if min_price is not None or max_price is not None:
        filters["price"] = {}
        if min_price is not None:
            filters["price"]["$gte"] = min_price
        if max_price is not None:
            filters["price"]["$lte"] = max_price
    if rating is not None:
        filters["rating.average"] = {"$gte": rating, "$lte": 5}

    order = {"createdAt": -1, "_id": -1}
    if sort in ("price_asc", "price_desc"):
        order = {"price": 1 if sort == "price_asc" else -1, **order}

    pipeline = [
        {"$match": filters},
        {"$sort": order},
        {"$skip": (page - 1) * limit},
        {"$limit": limit + 1},
        # Join only the requested page and expose only public profile fields.
        {"$lookup": {
            "from": "userprofiles",
            "localField": "creatorId",
            "foreignField": "_id",
            "pipeline": [{"$project": {
                "_id": 1, "username": 1, "name": 1, "avatar": 1,"profilePicUrl" : 1,
            }}],
            "as": "_creator",
        }},
        {"$set": {"creatorId": {"$ifNull": [
            {"$arrayElemAt": ["$_creator", 0]}, None,
        ]}}},
        {"$project": PRODUCT_FIELDS},
    ]
    results = await products_collections.aggregate(
        pipeline, maxTimeMS=5000,
    ).to_list(length=limit + 1)
    has_more = len(results) > limit
    products = results[:limit]
    for product in products:
        product["_id"] = str(product["_id"])
        creator = product.get("creatorId")
        if creator and isinstance(creator.get("_id"), ObjectId):
            creator["_id"] = str(creator["_id"])

    return {
        "products": products,
        "page": page,
        "limit": limit,
        "hasMore": has_more,
        "nextPage": page + 1 if has_more else None,
    }
