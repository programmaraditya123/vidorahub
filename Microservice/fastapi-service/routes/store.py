from fastapi import APIRouter,Depends,Query
from typing import Annotated
from pydantic import BaseModel
from services.auth import require_sign_in
from config.mongo import stores_collections
from bson import ObjectId
from typing import Literal
from fastapi.encoders import jsonable_encoder

router = APIRouter(prefix="/api/store",tags=["creator stores"])

# 1. Define nested structures as their own models
class StorePolicies(BaseModel):
    shipping: str
    returns: str

class CreateStoreRequest(BaseModel):
    name: str
    description: str
    category: list[str]
    subCatgories : list[str]
    currency: Literal["dollar", "rupee", "euro","yen"] 
    rating: int
    review_count: int
    isAvailable: bool
    policies: StorePolicies
    location : str
    websiteurl : str

@router.post("/create")
async def create_store(body : CreateStoreRequest,user : Annotated[dict,Depends(require_sign_in)]):
    userId = user["_id"]

    store_created = await stores_collections.find_one({"ownerId" : ObjectId(userId) })
    if store_created:
        return {
            "success" : True,
            "message" : "store already created"
        }
    

    store = await stores_collections.insert_one({
        "ownerId" : ObjectId(userId),
        "name" : body.name,
        "description" : body.description,
        "category" : body.category,
        "subCategory" : body.subCatgories,
        "currency" : body.currency,
        "rating" : body.rating,
        "review_count" : body.review_count,
        "isAvailable" : body.isAvailable,
        "policies" : { "shipping" : body.policies.shipping , "returns" : body.policies.returns},
        "location" : body.location,
        "websiteurl" : body.websiteurl
    })

    return {
        "success": True,
        "message" : "store created successfully"
        }


@router.get("/status")
async def store_status(user : Annotated[dict,Depends(require_sign_in)]):
    userId = user["_id"]
    
    store_created = await stores_collections.find_one({"ownerId" : ObjectId(userId) })
    if store_created:
        return {
                "success" : True,
                "message" : "store already created"
            }

    else :
            return {
                "success" : False,
                "message" : "No store found"
            }

@router.post("/update")
async def update_store(body: CreateStoreRequest, user: Annotated[dict, Depends(require_sign_in)]):
    userId = user["_id"]

    # 1. Fix the logic block: If NO store is created, we can't update one.
    store_created = await stores_collections.find_one({"ownerId": ObjectId(userId)})
    if not store_created:
        return {
            "success": False, 
            "message": "Store not found. Please create a store first."
        }

    # 2. Fix the MongoDB syntax: Separate the filter and the $set data
    store = await stores_collections.find_one_and_update(
        {"ownerId": ObjectId(userId)},  # Argument 1: The Filter
        {"$set": {                      # Argument 2: The Update Operation ($set)
            "name": body.name,
            "description": body.description,
            "category": body.category,
            "subCategory": body.subCatgories,
            "currency": body.currency,
            "rating": body.rating,
            "review_count": body.review_count,
            "isAvailable": body.isAvailable,
            "policies": { 
                "shipping": body.policies.shipping, 
                "returns": body.policies.returns
            },
            "location": body.location,
            "websiteurl": body.websiteurl
        }}
    )

    return {
        "success": True,
        "message": "store updated successfully"
    }


@router.get("/store_details")
async def get_store_details(user : Annotated[dict,Depends(require_sign_in)]):
    userId = user["_id"]

    store_created = await stores_collections.find_one({"ownerId" : ObjectId(userId) })
    if store_created:
        store_created["_id"] = str(store_created["_id"])
        
        if "ownerId" in store_created:
            store_created["ownerId"] = str(store_created["ownerId"])
    if store_created:
        return {
                    "success" : True,
                    "message" : "store deatils fetched successfully",
                    "store" : store_created
                }
    else :
        return {
            "success" : False,
            "message" : "No store found"
        }

@router.get("/")
async def get_stores(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
):
    skip = (page - 1) * limit

    # Total stores
    total_stores = await stores_collections.count_documents({})

    pipeline = [
        # Pagination
        {"$sort": {"_id": -1}},
        {"$skip": skip},
        {"$limit": limit},

        # Get only required fields from userprofiles
        {
            "$lookup": {
                "from": "userprofiles",
                "let": {
                    "owner_id": "$ownerId"
                },
                "pipeline": [
                    {
                        "$match": {
                            "$expr": {
                                "$eq": ["$_id", "$$owner_id"]
                            }
                        }
                    },
                    {
                        "$project": {
                            "_id": 1,
                            "name": 1,
                            "email": 1,
                            "subscriber": 1,
                            "totalviews": 1,
                            "totalvideos": 1,
                            "bio": 1,
                            "location": 1,
                            "tags": 1,
                            "profilePicUrl": 1,
                        }
                    }
                ],
                "as": "ownerProfile",
            }
        },

        # Convert ownerProfile array into an object
        {
            "$set": {
                "ownerId": {
                    "$ifNull": [
                        {"$arrayElemAt": ["$ownerProfile", 0]},
                        None,
                    ]
                }
            }
        },

        # Remove temporary ownerProfile field
        {
            "$project": {
                "ownerProfile": 0
            }
        },
    ]

    stores = await stores_collections.aggregate(
        pipeline
    ).to_list(length=limit)

    # Convert ObjectId -> string
    stores = jsonable_encoder(
        stores,
        custom_encoder={ObjectId: str}
    )

    total_pages = (total_stores + limit - 1) // limit

    return {
        "success": True,
        "data": stores,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total_stores,
            "totalPages": total_pages,
            "hasNext": page < total_pages,
            "hasPrevious": page > 1,
        },

    }