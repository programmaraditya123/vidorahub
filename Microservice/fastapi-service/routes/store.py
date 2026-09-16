from fastapi import APIRouter,Depends
from typing import Annotated
from pydantic import BaseModel
from services.auth import require_sign_in
from config.mongo import stores_collections
from bson import ObjectId
from typing import Literal
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