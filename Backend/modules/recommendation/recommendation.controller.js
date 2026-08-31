const client = require('../../config/redis');
const Video = require('../uploadvideo/uploadvideo.model');
const { randomVideos, randomVibes } = require('./randomVideos.helper');
const mongoose = require("mongoose");

// const getHomeVideoFeed = async (req, res) => {
//     const { category, id } = req.body;

//     const primarykey = `category:${category}:videos:primary`;
//     const secondarykey = `category:${category}:videos:secondary`
//     const PAGE_SIZE = 20;
//     const page = Math.max(parseInt(req.body.page) || 1, 1);

//     const logicalOffset = (page - 1) * PAGE_SIZE;

//     const [primaryCount, secondaryCount] = await Promise.all([
//         client.zCard(primarykey),
//         client.zCard(secondarykey)
//     ]);

//     const primaryStart = logicalOffset;
//     const primaryEnd = logicalOffset + PAGE_SIZE - 1;

//     let primaryIds = [];

//     if (primaryStart < primaryCount) {
//         primaryIds = await client.zRange(
//             primarykey,
//             primaryStart,
//             Math.min(primaryEnd, primaryCount - 1),
            
//         );
//     }

//     const remaining = PAGE_SIZE - primaryIds.length;

//     let secondaryIds = [];

//     if (remaining > 0) {
//         const secondaryStart = Math.max(
//             0,
//             logicalOffset - primaryCount
//         );

//         const secondaryEnd =
//             secondaryStart + remaining - 1;

//         if (secondaryStart < secondaryCount) {

//             secondaryIds = await client.zRange(
//                 secondarykey,
//                 secondaryStart,
//                 Math.min(
//                     secondaryEnd,
//                     secondaryCount - 1
//                 ),
               
//             );
//         }
//     }


//     const primaryredisIds = await client.zRange(primarykey, 0, -1);
//     const secondaryredisIds = await client.zRange(secondarykey, 0, -1)

//     const redisIds = [...primaryredisIds, ...secondaryredisIds]

//     if (primaryIds.length > 0 || secondaryIds.length > 0) {
//         const mongoprimaryVideos = await Video.find({
//             _id: { $in: primaryIds },
//             isDeleted: false,
//             contentType: "video"
//         })
//             .select(
//                 "-description -tags -visibility " +
//                 "-category -updatedAt -__v " +
//                 "-stats.comments -stats.dislikes"
//             )
//             .populate({
//                 path: "uploader",
//                 select: "name _id profilePicUrl"
//             })
//             .lean();

//         const mongosecondaryVideos = await Video.find({
//             _id: { $in: secondaryIds },
//             isDeleted: false,
//             contentType: "video"
//         })
//             .select(
//                 "-description -tags -visibility " +
//                 "-category -updatedAt -__v " +
//                 "-stats.comments -stats.dislikes"
//             )
//             .populate({
//                 path: "uploader",
//                 select: "name _id profilePicUrl"
//             })
//             .lean();

//         const totalmdbvideos = mongoprimaryVideos.length + mongosecondaryVideos.length
//         return res.json({
//             success: true,
//             message: 'videos from redis reolved  successfully',
//             length: totalmdbvideos,
//             primary: mongoprimaryVideos,
//             secondary: mongosecondaryVideos,
//             hasMore: totalmdbvideos > 0 ? true : false,
//             redisSet: primaryCount + secondaryCount,
//             primarySet: primaryCount,
//             secondarySet: secondaryCount

//         })
//     }

//     const normalizeRedisIds = redisIds.flatMap(id => id.split(","))
//         .filter(id => mongoose.Types.ObjectId.isValid(id))
//         .map(id => new mongoose.Types.ObjectId(id)) ?? [];

//     // console.log("normalize redis ids", normalizeRedisIds)

//     const filter = {
//         isDeleted: false,
//         contentType: "video",
//         _id: { $nin: normalizeRedisIds },
//     }

//     if (category && category.trim().toLowerCase() !== "all") {
//         const searchRegex = new RegExp(category.trim(), "i");
//         filter.$or = [
//             { title: searchRegex },
//             { description: searchRegex },
//             { tags: searchRegex },
//             { aitags: searchRegex }
//         ];
//     }
//     try {
//         const videos = await Video.find(filter)
//             .select("-description -tags -visibility -category -updatedAt -__v -stats.comments -stats.dislikes")
//             .populate({ path: "uploader", select: "name _id profilePicUrl" })
//             .sort({ createdAt: -1 })
//             .limit(20)
//             .lean()

//         const primaryIds = videos.map(video => video._id?.toString());

//         const filterIds = [...normalizeRedisIds, ...primaryIds];
//         // console.log("filterIds", filterIds)

//         let secondaryVideos = {
//             count: 0,
//             videos: []
//         }

//         if (videos.length < 20) {
//             const count = 20 - videos.length
//             secondaryVideos = await randomVideos(count, filterIds)

//         }

//         const totalVideos = videos.length + secondaryVideos.count;

//         const secondaryIds = secondaryVideos.videos.map(video => video._id?.toString());

//         const allIds = [...primaryIds, ...secondaryIds];

//         // console.log("all ids", allIds)

//         if (allIds.length > 0) {
//             // const currentCount = await client.zCard(key);
//             const timestamp = Date.now();
//             if (primaryIds.length > 0) {
//                 const primaryMembers = primaryIds.map((id, index) => ({
//                     score: timestamp + index,
//                     value: id
//                 }));
//                 await client.zAdd(primarykey, primaryMembers);
//             }

//             if (secondaryIds.length > 0) {
//                 const secondaryMembers = secondaryIds.map((id, index) => ({
//                     score: timestamp + index,
//                     value: id
//                 }));
//                 await client.zAdd(secondarykey, secondaryMembers);
//             }
//         }


//         const totalInPrimarySet = await client.zCard(primarykey);
//         const totalInSecondarySet = await client.zCard(secondarykey);


//         res.json({
//             success: true,
//             message: 'video fetched successfully',
//             length: totalVideos,
//             primary: videos,
//             secondary: secondaryVideos.videos,
//             hasMore: totalVideos > 0 ? true : false,
//             redisSet: totalInPrimarySet + totalInSecondarySet,
//             primarySet: totalInPrimarySet,
//             secondarySet: totalInSecondarySet
//         })

//     }
//     catch (error) {
//         console.log("Error", error)
//         return res.status(500).json({
//             success: false,
//             message: "Unable to fetch videos"
//         })

//     }
// }

// const getHomeVibesFeed = async (req, res) => {
//     const { category, id } = req.body;

//     const primarykey = `category:${category}:vibes:primary`;
//     const secondarykey = `category:${category}:vibes:secondary`
//     const PAGE_SIZE = 20;
//     const page = Math.max(parseInt(req.body.page) || 1, 1);

//     const logicalOffset = (page - 1) * PAGE_SIZE;

//     const [primaryCount, secondaryCount] = await Promise.all([
//         client.zCard(primarykey),
//         client.zCard(secondarykey)
//     ]);

//     const primaryStart = logicalOffset;
//     const primaryEnd = logicalOffset + PAGE_SIZE - 1;

//     let primaryIds = [];

//     if (primaryStart < primaryCount) {
//         primaryIds = await client.zRange(
//             primarykey,
//             primaryStart,
//             Math.min(primaryEnd, primaryCount - 1)
//         );
//     }

//     const remaining = PAGE_SIZE - primaryIds.length;

//     let secondaryIds = [];

//     if (remaining > 0) {
//         const secondaryStart = Math.max(
//             0,
//             logicalOffset - primaryCount
//         );

//         const secondaryEnd =
//             secondaryStart + remaining - 1;

//         if (secondaryStart < secondaryCount) {

//             secondaryIds = await client.zRange(
//                 secondarykey,
//                 secondaryStart,
//                 Math.min(
//                     secondaryEnd,
//                     secondaryCount - 1
//                 )
//             );
//         }
//     }

//     // const startIndex = (page - 1) * batchSize;
//     // const endIndex = startIndex + batchSize - 1;

//     // const primaryVideoIds = await client.zRange(primarykey, startIndex, endIndex)
//     // const secondaryVideoIds = await client.zRange(secondarykey, startIndex, endIndex)


//     // console.log("videoIds", VideoIds)

//     const primaryredisIds = await client.zRange(primarykey, 0, -1);
//     const secondaryredisIds = await client.zRange(secondarykey, 0, -1)

//     const redisIds = [...primaryredisIds, ...secondaryredisIds]

//     if (primaryIds.length > 0 || secondaryIds.length > 0) {
//         const mongoprimaryVideos = await Video.find({
//             _id: { $in: primaryIds },
//             isDeleted: false,
//             contentType: "vibe"
//         })
//             .select(
//                 "-description -tags -visibility " +
//                 "-category -updatedAt -__v " +
//                 "-stats.comments -stats.dislikes"
//             )
//             .populate({
//                 path: "uploader",
//                 select: "name _id profilePicUrl"
//             })
//             .lean();

//         const mongosecondaryVideos = await Video.find({
//             _id: { $in: secondaryIds },
//             isDeleted: false,
//             contentType: "vibe"
//         })
//             .select(
//                 "-description -tags -visibility " +
//                 "-category -updatedAt -__v " +
//                 "-stats.comments -stats.dislikes"
//             )
//             .populate({
//                 path: "uploader",
//                 select: "name _id profilePicUrl"
//             })
//             .lean();

//         const totalmdbvideos = mongoprimaryVideos.length + mongosecondaryVideos.length
//         return res.json({
//             success: true,
//             message: 'videos from redis reolved  successfully',
//             length: totalmdbvideos,
//             primary: mongoprimaryVideos,
//             secondary: mongosecondaryVideos,
//             hasMore: totalmdbvideos > 0 ? true : false,
//             redisSet: primaryCount + secondaryCount,
//             primarySet: primaryCount,
//             secondarySet: secondaryCount

//         })
//     }

//     const normalizeRedisIds = redisIds.flatMap(id => id.split(","))
//         .filter(id => mongoose.Types.ObjectId.isValid(id))
//         .map(id => new mongoose.Types.ObjectId(id)) ?? [];

//     // console.log("normalize redis ids", normalizeRedisIds)

//     const filter = {
//         isDeleted: false,
//         contentType: "vibe",
//         _id: { $nin: normalizeRedisIds },
//     }

//     if (category && category.trim().toLowerCase() !== "all") {
//         const searchRegex = new RegExp(category.trim(), "i");
//         filter.$or = [
//             { title: searchRegex },
//             { description: searchRegex },
//             { tags: searchRegex },
//             { aitags: searchRegex }
//         ];
//     }
//     try {
//         const videos = await Video.find(filter)
//             .select("-description -tags -visibility -category -updatedAt -__v -stats.comments -stats.dislikes")
//             .populate({ path: "uploader", select: "name _id profilePicUrl" })
//             .sort({ createdAt: -1 })
//             .limit(20)
//             .lean()

//         const primaryIds = videos.map(video => video._id?.toString());

//         const filterIds = [...normalizeRedisIds, ...primaryIds];
//         // console.log("filterIds", filterIds)

//         let secondaryVideos = {
//             count: 0,
//             videos: []
//         }

//         if (videos.length < 20) {
//             const count = 20 - videos.length
//             secondaryVideos = await randomVibes(count, filterIds)

//         }

//         const totalVideos = videos.length + secondaryVideos.count;

//         const secondaryIds = secondaryVideos.videos.map(video => video._id?.toString());

//         const allIds = [...primaryIds, ...secondaryIds];

//         // console.log("all ids", allIds)

//         if (allIds.length > 0) {
//             // const currentCount = await client.zCard(key);
//             const timestamp = Date.now();
//             if (primaryIds.length > 0) {
//                 const primaryMembers = primaryIds.map((id, index) => ({
//                     score: timestamp + index,
//                     value: id
//                 }));
//                 await client.zAdd(primarykey, primaryMembers);
//             }

//             if (secondaryIds.length > 0) {
//                 const secondaryMembers = secondaryIds.map((id, index) => ({
//                     score: timestamp + index,
//                     value: id
//                 }));
//                 await client.zAdd(secondarykey, secondaryMembers);
//             }
//         }


//         const totalInPrimarySet = await client.zCard(primarykey);
//         const totalInSecondarySet = await client.zCard(secondarykey);


//         res.json({
//             success: true,
//             message: 'video fetched successfully',
//             length: totalVideos,
//             primary: videos,
//             secondary: secondaryVideos.videos,
//             hasMore: totalVideos > 0 ? true : false,
//             redisSet: totalInPrimarySet + totalInSecondarySet,
//             primarySet: totalInPrimarySet,
//             secondarySet: totalInSecondarySet
//         })

//     }
//     catch (error) {
//         console.log("Error", error)
//         return res.status(500).json({
//             success: false,
//             message: "Unable to fetch videos"
//         })

//     }
// }




const PAGE_SIZE = 20;
const MAX_TIMELINE_SIZE = 5000; 
 

const feedKey = (contentType, category) =>
    category && category !== "all"
        ? `feed:${contentType}:${category}`
        : `feed:${contentType}:all`;
 
async function addItemToFeed(item) {
    const score = new Date(item.createdAt).getTime();
    const member = item._id.toString();
    const contentType = item.contentType; // "video" | "vibe"
    const categories = getCategoriesForItem(item);
 
    const multi = client.multi();
 
    const allKey = feedKey(contentType, "all");
    multi.zAdd(allKey, [{ score, value: member }]);
    multi.zRemRangeByRank(allKey, 0, -MAX_TIMELINE_SIZE - 1);
 
    for (const cat of categories) {
        const key = feedKey(contentType, cat.toLowerCase());
        multi.zAdd(key, [{ score, value: member }]);
        multi.zRemRangeByRank(key, 0, -MAX_TIMELINE_SIZE - 1);
    }
 
    await multi.exec();
}
 
async function removeItemFromFeed(item) {
    const member = item._id.toString();
    const contentType = item.contentType;
    const multi = client.multi();
 
    multi.zRem(feedKey(contentType, "all"), member);
    for (const cat of getCategoriesForItem(item)) {
        multi.zRem(feedKey(contentType, cat.toLowerCase()), member);
    }
    await multi.exec();
}
 
function getCategoriesForItem(item) {
    return item.category ? [item.category] : [];
}
 

async function getHomeFeed({ contentType, category, cursor: rawCursor }) {
    
    const cursor = rawCursor ? Number(rawCursor) : Date.now() + 1;
 
    const isAll = !category || category.trim().toLowerCase() === "all";
    const key = feedKey(contentType, isAll ? "all" : category.trim().toLowerCase());
 
  
    let ids = await client.zRange(key, cursor - 1, "-inf", {
        BY: "SCORE",
        REV: true,
        LIMIT: { offset: 0, count: PAGE_SIZE },
    });
 
    let usedFallback = false;
 
    if (ids.length < PAGE_SIZE) {
        usedFallback = true;
        const remaining = PAGE_SIZE - ids.length;
 
        const filter = {
            isDeleted: false,
            contentType,
            createdAt: { $lt: new Date(cursor) },
            _id: { $nin: ids.map((id) => new mongoose.Types.ObjectId(id)) },
        };
 
        if (!isAll) {
            const searchRegex = new RegExp(category.trim(), "i");
            filter.$or = [
                { title: searchRegex },
                { tags: searchRegex },
                { aitags: searchRegex },
            ];
        }
 
        const fallbackDocs = await Video.find(filter)
            .select("_id createdAt")
            .sort({ createdAt: -1 })
            .limit(remaining)
            .lean();
 
        ids.push(...fallbackDocs.map((d) => d._id.toString()));
    }
 
    if (ids.length === 0) {
        return { videos: [], nextCursor: null, hasMore: false, source: usedFallback ? "redis+mongo" : "redis" };
    }
 
    
    const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));
    const docs = await Video.find({ _id: { $in: objectIds }, isDeleted: false, contentType })
        .select(
            "-description -tags -visibility -category -updatedAt -__v " +
            "-stats.comments -stats.dislikes -aitags -isPaused -isDeleted -tagIteration  "
        )
        .populate({ path: "uploader", select: "name _id profilePicUrl" })
        .lean();
 
    const byId = new Map(docs.map((d) => [d._id.toString(), d]));
    const orderedVideos = ids.map((id) => byId.get(id)).filter(Boolean);
 
    const last = orderedVideos[orderedVideos.length - 1];
    const nextCursor = last ? new Date(last.createdAt).getTime() : null;
 
    return {
        videos: orderedVideos,
        nextCursor,
        hasMore: orderedVideos.length === PAGE_SIZE,
        source: usedFallback ? "redis+mongo" : "redis", // handy for debugging/metrics
    };
}

const getHomeVideoFeed = async (req, res) => {
    try {
        const { category, cursor } = req.body;
        const result = await getHomeFeed({ contentType: "video", category, cursor });
        return res.json({ success: true, ...result });
    } catch (error) {
        console.error("getHomeVideoFeed error", error);
        return res.status(500).json({ success: false, message: "Unable to fetch videos" });
    }
};
 
const getHomeVibesFeed = async (req, res) => {
    try {
        const { category, cursor } = req.body;
        const result = await getHomeFeed({ contentType: "vibe", category, cursor });
        return res.json({ success: true, ...result });
    } catch (error) {
        console.error("getHomeVibesFeed error", error);
        return res.status(500).json({ success: false, message: "Unable to fetch videos" });
    }
};
 
module.exports = {
    getHomeVideoFeed,
    getHomeVibesFeed,
    addItemToFeed,
    removeItemFromFeed,
};



// module.exports = { getHomeVideoFeed ,getHomeVibesFeed }
