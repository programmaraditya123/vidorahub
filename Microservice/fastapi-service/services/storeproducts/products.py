import re
from typing import Literal
import re
from bson import ObjectId
from fastapi import APIRouter, Query, HTTPException

router = APIRouter()

from bson import ObjectId

from config.mongo import products_collections,product_category_collection


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
        product["category"] = str(product["category"])
        # product["subcategory"] = str(product["subcategory"])
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






def serialize_mongo_doc(doc):
    """Convert MongoDB ObjectIds to strings, including nested fields."""
    if isinstance(doc, ObjectId):
        return str(doc)

    if isinstance(doc, list):
        return [serialize_mongo_doc(item) for item in doc]

    if isinstance(doc, dict):
        return {
            key: serialize_mongo_doc(value)
            for key, value in doc.items()
        }

    return doc



async def find_categoy_wise_products(
    category: str,
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=100),
    search: str | None = None,
    min_price: float | None = Query(None, ge=0),
    max_price: float | None = Query(None, ge=0),
    min_rating: float | None = Query(None, ge=0, le=5),
    sort_by: str = Query("newest", pattern="^(newest|price_low|price_high|rating)$"),
):
    # 1. Find category by slug
    cat = await product_category_collection.find_one(
        {"slug": category, "isActive": True},
        {"_id": 1, "name": 1, "slug": 1}
    )

    if cat is None:
        raise HTTPException(
            status_code=404,
            detail=f"Category '{category}' not found"
        )

    # 2. Build product filters
    filters = {
        "category": cat["_id"],
        "status": "active"
    }

    # Search by product name or description
    if search and search.strip():
        search_regex = {"$regex": re.escape(search.strip()), "$options": "i"}
        filters["$or"] = [
            {"name": search_regex},
            {"description": search_regex},
            {"brand": search_regex},
        ]

    # Filter by price range
    price_filter = {}

    if min_price is not None:
        price_filter["$gte"] = min_price

    if max_price is not None:
        price_filter["$lte"] = max_price

    if price_filter:
        filters["price"] = price_filter

    if min_price is not None and max_price is not None:
        if min_price > max_price:
            raise HTTPException(
                status_code=400,
                detail="min_price cannot exceed max_price"
            )

    # Filter by minimum average rating
    if min_rating is not None:
        filters["rating.average"] = {"$gte": min_rating}

    # 3. Sorting
    sort_options = {
        "newest": [("createdAt", -1)],
        "price_low": [("price", 1)],
        "price_high": [("price", -1)],
        "rating": [("rating.average", -1)],
    }

    # 4. Pagination
    skip = (page - 1) * limit

    total = await products_collections.count_documents(filters)

    cursor = (
        products_collections
        .find(filters)
        .sort(sort_options[sort_by])
        .skip(skip)
        .limit(limit)
    )

    products = await cursor.to_list(length=limit)

    # 5. Serialize ObjectIds for JSON
    products = [serialize_mongo_doc(p) for p in products]

    return {
        "success": True,
        "category": serialize_mongo_doc(cat),
        "pagination": {
            "page": page,
            "limit": limit,
            "totalProducts": total,
            "totalPages": (total + limit - 1) // limit,
            "hasNextPage": skip + len(products) < total,
            "hasPreviousPage": page > 1,
        },
        "products": products,
    }