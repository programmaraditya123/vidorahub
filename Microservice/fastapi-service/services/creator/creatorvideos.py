from bson import ObjectId
from bson.errors import InvalidId
from config.mongo import videos_collection

async def get_creator_uploads(id : str, page:int =1,limit:int = 20):
    try:
        object_id = ObjectId(id)
    except InvalidId:
        return {
            "success":False,
            "error":"Invalid user ID"
        } 

    skip = (page - 1) * limit

    match_filter = {
        "uploader" : object_id,
        "isDeleted" : False

    }
    total_count = await videos_collection.count_documents(match_filter)

    if(total_count < 1):
        return {
                    "success": True,
                    "total_count": total_count,
                    "page": page,
                    "limit": limit,
                    "total_pages": 0,
                    "has_next": False,
                    "has_previous": page > 1,
                    "videos": [],
                    "message" : "you don't upload any video yet"
                }


    pipeline=[
        {
            "$match": match_filter
        },
        {
            "$sort" : {
                "createdAt" : -1
            }

        },
        {
            "$skip": skip
        },
        {
            "$limit": limit
        },
        {
            "$lookup" : {
                "from": "userprofiles",
                "localField": "uploader",
                "foreignField":"_id",
                "as" : "uploader"
            }
        },
        {
            "$unwind" : {
                "path" : "$uploader",
                "preserveNullAndEmptyArrays" : True
            }
        },
        {
            "$project":{
                "_id" : 1,
                "title" : 1,
                "description": 1,
                "duration" : 1,
                "contentType" : 1,

                "thumbnailUrl": 1,
                "category": 1,
                "tags": 1,
                "stats": 1,
                "createdAt": 1,
        
                # "uploader._id": 1,
                # "uploader.username": 1,
                # "uploader.name": 1,
                # "uploader.avatar": 1

            }
        }

    ]
    result = await videos_collection.aggregate(pipeline).to_list(length=limit)


    if not result:
        return {
            "success": True,
            "total_count": total_count,
            "page": page,
            "limit": limit,
            "total_pages": 0,
            "has_next": False,
            "has_previous": page > 1,
            "videos": []
        }
    
    
    # uploads = result[0]

    for uploads in result:
        uploads["_id"] = str(uploads["_id"])
        if uploads.get("uploader") and uploads["uploader"].get("_id"):
            uploads["uploader"]["_id"] = str(uploads["uploader"]["_id"])


    

    total_pages = (total_count + limit - 1) // limit

    return {
        "success": True,

        "total_count": total_count,

        "page": page,
        "limit": limit,

        "total_pages": total_pages,

        "has_next": page < total_pages,
        "has_previous": page > 1,

        "videos": result
    }



async def update_title(id,videoId,updatedtitle):
    try:
        object_id = ObjectId(id)
        video_id = ObjectId(videoId)
    except InvalidId:
        return {
            "success":False,
            "error":"Invalid user ID or videoId"
            }

    filter = {
        "_id":video_id,
        "uploader":object_id,
        "isDeleted" : False
        }

    validate = await videos_collection.find_one(filter)

    current_title = validate.get("title", "")

    if current_title == updatedtitle:
        return {
            "success": False,
            "message": "New title is same as current title"
        }

    iteration = validate.get("titleUpdateIteration", 0) + 1

    history_field = f"updatedTitle{iteration}"

    update_data = {
        "$set": {
            "title": updatedtitle,
            history_field: current_title,
            "titleUpdateIteration": iteration
        }
    }

    await videos_collection.update_one(
        filter,
        update_data
    )


    validate["_id"] = str(validate["_id"])
    validate["uploader"] = str(validate["uploader"])
    

    if not validate:
        return {
            "success" : False,
            "message" : "User has no permissions to update title ",
        }
    else:
        return {
            "success" : True,
            "message" :  "title updated successfully",
        }

    
    