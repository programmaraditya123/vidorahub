from config.mongo import videos_collection

field_selection = {
    "title" : 1,
    "description" : 1,
    "thumbnailUrl" : 1,
}

conditions = {
     "isDeleted" : False,
     "isPause" : False
}

async def search_videos(query:str):
    cursor = videos_collection.find(
        {
            "$or":[
                {"title":{"$regex" : query , "$options" : "i"}},
                {"description" : {"$regex" : query , "$options" : "i"}}
            ],
            "isDeleted" : False,
        },field_selection
    ).limit(20)

    videos =  await cursor.to_list(length=20)
    for video in videos:
            video["_id"] = str(video["_id"])
            video["vedio_url"] = f"https://www.vidorahub.com/video/{video['_id']}"

    return videos

async def find_trending_video():
    cursor = videos_collection.find({"isDeleted" : False},field_selection).sort("stats.views",-1).limit(20)
    
    videos = await cursor.to_list(length=20)
    
    for video in videos:
        video["_id"] = str(video["_id"])
        video["vedio_url"] = f"https://www.vidorahub.com/video/{video['_id']}"
    return videos