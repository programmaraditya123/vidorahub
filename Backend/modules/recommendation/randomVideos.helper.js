const Video = require('../uploadvideo/uploadvideo.model')

const randomVideos = async (limit = 20,filterIds = []) => {
    try {
        const videos = await Video.aggregate([
            {
                $match : {
                    isDeleted : false,
                    contentType : "video",

                    _id : {
                        $nin : filterIds
                    }
                }
            },
            {
                $sample : {
                    size : Number(limit)
                }
            },
            // {
            //     $project : {
            //          description: 0,
            //         tags: 0,
            //         visibility: 0,
            //         category: 0,
            //         updatedAt: 0,
            //         __v: 0,
            //         "stats.comments": 0,
            //         "stats.dislikes": 0
            //     }
            // },
            {
                $lookup: {
                    from: "userprofiles",
                    localField: "uploader",
                    foreignField: "_id",
                    as: "uploader"
                }
            },
            {
                $unwind: {
                    path: "$uploader",
                    preserveNullAndEmptyArrays: true
                }
            },

            {
                $project: {
                    "title" : 1,
                    "thumbnailUrl" : 1,
                    "duration" : 1,
                    "contentType" : 1,
                    "isDeleted" : 1,
                    "stats.views" : 1,
                    "stats.likes" : 1,
                    "videoUrl" : 1,
                    "videoSerialNumber" : 1,
                    "createdAt" : 1,
                    "Status" : 1,
                    "hlsUl" : 1,

                    "uploader.name": 1,
                    "uploader._id": 1,
                    "uploader.profilePicUrl": 1
                }
            }
        ])

        return {count: videos.length,videos}
        
    } catch (error) {
        console.error("Random videos error:", error);

        return {
            success: false,
            message: "Failed to fetch random videos"
        };
        
    }
}

const randomVibes = async (limit = 20,filterIds = []) => {
    try {
        const videos = await Video.aggregate([
            {
                $match : {
                    isDeleted : false,
                    contentType : "vibe",

                    _id : {
                        $nin : filterIds
                    }
                }
            },
            {
                $sample : {
                    size : Number(limit)
                }
            },
            {
                $lookup: {
                    from: "userprofiles",
                    localField: "uploader",
                    foreignField: "_id",
                    as: "uploader"
                }
            },
            {
                $unwind: {
                    path: "$uploader",
                    preserveNullAndEmptyArrays: true
                }
            },

            {
                $project: {
                    "title" : 1,
                    "thumbnailUrl" : 1,
                    "duration" : 1,
                    "contentType" : 1,
                    "isDeleted" : 1,
                    "stats.views" : 1,
                    "stats.likes" : 1,
                    "videoUrl" : 1,
                    "videoSerialNumber" : 1,
                    "createdAt" : 1,
                    "Status" : 1,
                    "hlsUl" : 1,

                    "uploader.name": 1,
                    "uploader._id": 1,
                    "uploader.profilePicUrl": 1
                }
            }
        ])

        return {count: videos.length,videos}
        
    } catch (error) {
        console.error("Random videos error:", error);

        return {
            success: false,
            message: "Failed to fetch random videos"
        };
        
    }
}

module.exports = {randomVideos,randomVibes}