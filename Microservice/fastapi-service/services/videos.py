from bson import ObjectId
from bson.errors import InvalidId
from config.mongo import videos_collection


async def get_Video_Details(video_id: str):
    try:
        object_id = ObjectId(video_id)
    except InvalidId:
        return {
            "success": False,
            "error": "Invalid Video ID"
        }

    pipeline = [
        {
            "$match": {
                "_id": object_id
            }
        },
        {
            "$lookup": {
                "from": "userprofiles",
                "localField": "uploader",
                "foreignField": "_id",
                "as": "uploader"
            }
        },
        {
            "$unwind": {
                "path": "$uploader",
                "preserveNullAndEmptyArrays": True
            }
        },
        {
            "$project": {
                "_id": 1,
                "title": 1,
                "description": 1,
                "thumbnailUrl": 1,
                "category": 1,
                "tags": 1,
                "stats": 1,
                "createdAt": 1,

                "uploader._id": 1,
                "uploader.username": 1,
                "uploader.name": 1,
                "uploader.avatar": 1
            }
        }
    ]

    results = await videos_collection.aggregate(pipeline).to_list(length=1)

    if not results:
        return {
            "success": False,
            "error": "Video not found"
        }

    video = results[0]

    # Convert video ObjectId
    video["_id"] = str(video["_id"])

    # Convert uploader ObjectId
    if video.get("uploader") and video["uploader"].get("_id"):
        video["uploader"]["_id"] = str(video["uploader"]["_id"])

    # Add URL to video
    video["video_url"] = f"https://www.vidorahub.com/video/{video['_id']}"

    return {
        "success": True,
        "video": video
    }