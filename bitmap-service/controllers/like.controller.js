const {
    existsInBitmap,
    removeFromBitmap,
    addToBitmap,
    countBitmap,
} = require("../services/roaring.service");

const redis = require("../config/redis");

const Video = require("../models/uploadvideo.model");

const {
    createLikeDislike,
    deleteLikeDislike,
    getLikeDislike,
    getUserReactionsByScope,
    getVideoReactionsFromDB,
} = require("../modules/LikeDislike/LikeDislike.model");

const {
    safeExistsInBitmap,
    safeCountBitmap,
    rebuildBitmapFromAstra,
} = require("../modules/LikeDislike/LikeDislike.helper");




// ============================================================
// VALIDATION
// ============================================================

const validateSerialNumbers = (
    userSerialNumber,
    videoSerialNumber
) => {

    const userNumber = Number(userSerialNumber);
    const videoNumber = Number(videoSerialNumber);

    if (
        !Number.isInteger(userNumber) ||
        userNumber < 0
    ) {
        throw new Error(
            "userSerialNumber must be a valid integer"
        );
    }

    if (
        !Number.isInteger(videoNumber) ||
        videoNumber < 0
    ) {
        throw new Error(
            "videoSerialNumber must be a valid integer"
        );
    }

    return {
        userNumber,
        videoNumber,
    };
};


// ============================================================
// ADD LIKE
// ============================================================

const addLike = async (req, res) => {

    try {

        const {
            userSerialNumber,
            videoSerialNumber,
        } = req.body;

        const {
            userNumber,
            videoNumber,
        } = validateSerialNumbers(
            userSerialNumber,
            videoSerialNumber
        );

        const likeKey =
            `video:${videoNumber}:likes`;

        const dislikeKey =
            `video:${videoNumber}:dislikes`;


        // ----------------------------------------------------
        // Check current bitmap state
        // ----------------------------------------------------

        const liked =
            await safeExistsInBitmap(
                likeKey,
                userNumber,
                videoNumber,
                "like"
            );

        if (liked) {

            return res.json({
                success: true,
                liked: true,
                disliked: false,

                likes:
                    await safeCountBitmap(
                        likeKey,
                        videoNumber,
                        "like"
                    ),

                dislikes:
                    await safeCountBitmap(
                        dislikeKey,
                        videoNumber,
                        "dislike"
                    ),
            });
        }


        // ----------------------------------------------------
        // FIRST: durable state
        //
        // replace/upsert means:
        //
        // dislike -> like
        //
        // becomes one Astra document with scope=like
        // ----------------------------------------------------

        await createLikeDislike({
            userSerialNumber: userNumber,
            videoSerialNumber: videoNumber,
            scope: "like",
        });


        // ----------------------------------------------------
        // Redis
        // ----------------------------------------------------

        try {

            // Remove old dislike bitmap state
            await removeFromBitmap(
                dislikeKey,
                userNumber
            );

            // Add like
            await addToBitmap(
                likeKey,
                userNumber
            );

        } catch (error) {

            console.error(
                "Like bitmap update failed:",
                error.message
            );

            // Rebuild both bitmaps from Astra
            await rebuildBitmapFromAstra(
                videoNumber,
                "like"
            );

            await rebuildBitmapFromAstra(
                videoNumber,
                "dislike"
            );
        }


        // ----------------------------------------------------
        // Response
        // ----------------------------------------------------

        res.json({
            success: true,
            liked: true,
            disliked: false,

            likes:
                await safeCountBitmap(
                    likeKey,
                    videoNumber,
                    "like"
                ),

            dislikes:
                await safeCountBitmap(
                    dislikeKey,
                    videoNumber,
                    "dislike"
                ),
        });

    } catch (error) {

        console.error(
            "Like failed:",
            error
        );

        res.status(500).json({
            error: "Like failed",
            message: error.message,
        });
    }
};


// ============================================================
// REMOVE LIKE
// ============================================================

const removeLike = async (req, res) => {

    try {

        const {
            userSerialNumber,
            videoSerialNumber,
        } = req.body;

        const {
            userNumber,
            videoNumber,
        } = validateSerialNumbers(
            userSerialNumber,
            videoSerialNumber
        );

        const likeKey =
            `video:${videoNumber}:likes`;

        const dislikeKey =
            `video:${videoNumber}:dislikes`;


        // ----------------------------------------------------
        // DURABLE STATE
        //
        // Delete only if current scope is LIKE
        // ----------------------------------------------------

        await deleteLikeDislike({
            userSerialNumber: userNumber,
            videoSerialNumber: videoNumber,
            scope: "like",
        });


        // ----------------------------------------------------
        // Redis
        // ----------------------------------------------------

        try {

            await removeFromBitmap(
                likeKey,
                userNumber
            );

        } catch (error) {

            console.error(
                "Remove like bitmap failed:",
                error.message
            );

            await rebuildBitmapFromAstra(
                videoNumber,
                "like"
            );

            await rebuildBitmapFromAstra(
                videoNumber,
                "dislike"
            );
        }


        res.json({
            success: true,
            liked: false,
            disliked: false,

            likes:
                await safeCountBitmap(
                    likeKey,
                    videoNumber,
                    "like"
                ),

            dislikes:
                await safeCountBitmap(
                    dislikeKey,
                    videoNumber,
                    "dislike"
                ),
        });

    } catch (error) {

        console.error(
            "Remove like failed:",
            error
        );

        res.status(500).json({
            error: "Remove like failed",
            message: error.message,
        });
    }
};


// ============================================================
// ADD DISLIKE
// ============================================================

const addDislike = async (req, res) => {

    try {

        const {
            userSerialNumber,
            videoSerialNumber,
        } = req.body;

        const {
            userNumber,
            videoNumber,
        } = validateSerialNumbers(
            userSerialNumber,
            videoSerialNumber
        );

        const likeKey =
            `video:${videoNumber}:likes`;

        const dislikeKey =
            `video:${videoNumber}:dislikes`;


        // ----------------------------------------------------
        // Check existing dislike
        // ----------------------------------------------------

        const disliked =
            await safeExistsInBitmap(
                dislikeKey,
                userNumber,
                videoNumber,
                "dislike"
            );

        if (disliked) {

            return res.json({
                success: true,
                liked: false,
                disliked: true,

                likes:
                    await safeCountBitmap(
                        likeKey,
                        videoNumber,
                        "like"
                    ),

                dislikes:
                    await safeCountBitmap(
                        dislikeKey,
                        videoNumber,
                        "dislike"
                    ),
            });
        }


        // ----------------------------------------------------
        // DURABLE STATE
        //
        // like -> dislike
        //
        // One document, scope becomes dislike
        // ----------------------------------------------------

        await createLikeDislike({
            userSerialNumber: userNumber,
            videoSerialNumber: videoNumber,
            scope: "dislike",
        });


        // ----------------------------------------------------
        // Redis
        // ----------------------------------------------------

        try {

            await removeFromBitmap(
                likeKey,
                userNumber
            );

            await addToBitmap(
                dislikeKey,
                userNumber
            );

        } catch (error) {

            console.error(
                "Dislike bitmap update failed:",
                error.message
            );

            await rebuildBitmapFromAstra(
                videoNumber,
                "like"
            );

            await rebuildBitmapFromAstra(
                videoNumber,
                "dislike"
            );
        }


        res.json({
            success: true,
            liked: false,
            disliked: true,

            likes:
                await safeCountBitmap(
                    likeKey,
                    videoNumber,
                    "like"
                ),

            dislikes:
                await safeCountBitmap(
                    dislikeKey,
                    videoNumber,
                    "dislike"
                ),
        });

    } catch (error) {

        console.error(
            "Dislike failed:",
            error
        );

        res.status(500).json({
            error: "Dislike failed",
            message: error.message,
        });
    }
};


// ============================================================
// REMOVE DISLIKE
// ============================================================

const removeDislike = async (req, res) => {

    try {

        const {
            userSerialNumber,
            videoSerialNumber,
        } = req.body;

        const {
            userNumber,
            videoNumber,
        } = validateSerialNumbers(
            userSerialNumber,
            videoSerialNumber
        );

        const likeKey =
            `video:${videoNumber}:likes`;

        const dislikeKey =
            `video:${videoNumber}:dislikes`;


        // ----------------------------------------------------
        // DURABLE STATE
        // ----------------------------------------------------

        await deleteLikeDislike({
            userSerialNumber: userNumber,
            videoSerialNumber: videoNumber,
            scope: "dislike",
        });


        // ----------------------------------------------------
        // Redis
        // ----------------------------------------------------

        try {

            await removeFromBitmap(
                dislikeKey,
                userNumber
            );

        } catch (error) {

            console.error(
                "Remove dislike bitmap failed:",
                error.message
            );

            await rebuildBitmapFromAstra(
                videoNumber,
                "like"
            );

            await rebuildBitmapFromAstra(
                videoNumber,
                "dislike"
            );
        }


        res.json({
            success: true,
            liked: false,
            disliked: false,

            likes:
                await safeCountBitmap(
                    likeKey,
                    videoNumber,
                    "like"
                ),

            dislikes:
                await safeCountBitmap(
                    dislikeKey,
                    videoNumber,
                    "dislike"
                ),
        });

    } catch (error) {

        console.error(
            "Remove dislike failed:",
            error
        );

        res.status(500).json({
            error: "Remove dislike failed",
            message: error.message,
        });
    }
};


// ============================================================
// VALIDATE LIKE / DISLIKE
// ============================================================

const validateeLikeDislike = async (req, res) => {

    try {

        const {
            userSerialNumber,
            videoSerialNumber,
        } = req.query;

        const {
            userNumber,
            videoNumber,
        } = validateSerialNumbers(
            userSerialNumber,
            videoSerialNumber
        );

        const likeKey =
            `video:${videoNumber}:likes`;

        const dislikeKey =
            `video:${videoNumber}:dislikes`;


        const liked =
            await safeExistsInBitmap(
                likeKey,
                userNumber,
                videoNumber,
                "like"
            );

        const disliked =
            await safeExistsInBitmap(
                dislikeKey,
                userNumber,
                videoNumber,
                "dislike"
            );


        res.json({
            success: true,
            liked,
            disliked,
        });

    } catch (error) {

        console.error(
            "Validation failed:",
            error
        );

        res.status(500).json({
            error: "Validation failed",
            message: error.message,
        });
    }
};


// ============================================================
// GET VIDEO REACTIONS
// ============================================================

const getVideoReactions = async (req, res) => {

    try {

        const {
            userSerialNumber,
            videoSerialNumber,
        } = req.query;

        const videoNumber =
            Number(videoSerialNumber);

        if (
            !Number.isInteger(videoNumber) ||
            videoNumber < 0
        ) {
            throw new Error(
                "videoSerialNumber must be a valid integer"
            );
        }


        const likeKey =
            `video:${videoNumber}:likes`;

        const dislikeKey =
            `video:${videoNumber}:dislikes`;


        let liked = false;
        let disliked = false;


        if (
            userSerialNumber !== undefined &&
            userSerialNumber !== null
        ) {

            const userNumber =
                Number(userSerialNumber);

            if (
                !Number.isInteger(userNumber) ||
                userNumber < 0
            ) {
                throw new Error(
                    "userSerialNumber must be a valid integer"
                );
            }


            liked =
                await safeExistsInBitmap(
                    likeKey,
                    userNumber,
                    videoNumber,
                    "like"
                );

            disliked =
                await safeExistsInBitmap(
                    dislikeKey,
                    userNumber,
                    videoNumber,
                    "dislike"
                );
        }


        res.json({
            success: true,

            liked,
            disliked,

            likes:
                await safeCountBitmap(
                    likeKey,
                    videoNumber,
                    "like"
                ),

            dislikes:
                await safeCountBitmap(
                    dislikeKey,
                    videoNumber,
                    "dislike"
                ),
        });

    } catch (error) {

        console.error(
            "Fetch reactions failed:",
            error
        );

        res.status(500).json({
            error: "Fetch reactions failed",
            message: error.message,
        });
    }
};

// ============================================================
// GET LIKED VIDEOS FOR USER
// ============================================================

const getLikedVideos = async (req, res) => {

    try {

        const {
            userSerialNumber,
            pageState = null
        } = req.query;


        const userNumber =
            Number(userSerialNumber);


        if (
            !Number.isInteger(userNumber) ||
            userNumber < 0
        ) {

            return res.status(400).json({
                success: false,
                error:
                    "userSerialNumber must be a valid integer"
            });
        }


        // ----------------------------------------------------
        // Get maximum 20 reaction records from Astra
        // ----------------------------------------------------

        const result =
            await getUserReactionsByScope(
                userNumber,
                "like",
                20,
                pageState
            );


        const reactions =
            Array.isArray(result?.documents)
                ? result.documents
                : [];


        // ----------------------------------------------------
        // Extract video serial numbers
        // ----------------------------------------------------

        const videoSerialNumbers =
            reactions
                .map(
                    reaction =>
                        Number(
                            reaction.videoSerialNumber
                        )
                )
                .filter(
                    Number.isInteger
                );


        // ----------------------------------------------------
        // No liked videos
        // ----------------------------------------------------

        if (videoSerialNumbers.length === 0) {

            return res.json({

                success: true,

                userSerialNumber:
                    userNumber,

                limit: 20,

                count: 0,

                videos: [],

                nextPageState:
                    result?.nextPageState || null,

                hasMore:
                    Boolean(
                        result?.nextPageState
                    )
            });
        }


        // ----------------------------------------------------
        // Resolve actual videos from MongoDB
        // ----------------------------------------------------

        const mongoVideos =
            await Video.find({

                videoSerialNumber: {
                    $in: videoSerialNumbers
                },

                isDeleted: false,

                contentType: "video"

            })
                .select(
                    "-description -tags -visibility " +
                    "-category -updatedAt -__v " +
                    "-stats.comments -stats.dislikes"
                )
                .populate({

                    path: "uploader",

                    select:
                        "name _id profilePicUrl"

                })
                .lean();


        // ----------------------------------------------------
        // Create lookup map
        // ----------------------------------------------------

        const videoMap =
            new Map(
                mongoVideos.map(
                    video => [
                        Number(
                            video.videoSerialNumber
                        ),
                        video
                    ]
                )
            );


        // ----------------------------------------------------
        // Restore Astra reaction order
        //
        // MongoDB $in does NOT guarantee order.
        // ----------------------------------------------------

        const videos =
            reactions
                .map(reaction => {

                    const video =
                        videoMap.get(
                            Number(
                                reaction.videoSerialNumber
                            )
                        );

                    if (!video) {
                        return null;
                    }

                    return {

                        ...video,

                        reaction: {
                            scope:
                                reaction.scope,

                            updatedAt:
                                reaction.updatedAt
                        }

                    };

                })
                .filter(Boolean);


        // ----------------------------------------------------
        // Response
        // ----------------------------------------------------

        res.json({

            success: true,

            userSerialNumber:
                userNumber,

            limit: 20,

            count:
                videos.length,

            videos,

            nextPageState:
                result?.nextPageState || null,

            hasMore:
                Boolean(
                    result?.nextPageState
                )

        });

    } catch (error) {

        console.error(
            "Get liked videos failed:",
            error
        );

        res.status(500).json({

            success: false,

            error:
                "Get liked videos failed",

            message:
                error.message

        });
    }
};


// ============================================================
// GET DISLIKED VIDEOS FOR USER
// ============================================================

const getDislikedVideos = async (req, res) => {

    try {

        const {
            userSerialNumber,
            pageState = null
        } = req.query;


        const userNumber =
            Number(userSerialNumber);


        if (
            !Number.isInteger(userNumber) ||
            userNumber < 0
        ) {

            return res.status(400).json({
                success: false,
                error:
                    "userSerialNumber must be a valid integer"
            });
        }


        // ----------------------------------------------------
        // Get maximum 20 reaction records from Astra
        // ----------------------------------------------------

        const result =
            await getUserReactionsByScope(
                userNumber,
                "dislike",
                20,
                pageState
            );


        const reactions =
            Array.isArray(result?.documents)
                ? result.documents
                : [];


        // ----------------------------------------------------
        // Extract video serial numbers
        // ----------------------------------------------------

        const videoSerialNumbers =
            reactions
                .map(
                    reaction =>
                        Number(
                            reaction.videoSerialNumber
                        )
                )
                .filter(
                    Number.isInteger
                );


        // ----------------------------------------------------
        // No disliked videos
        // ----------------------------------------------------

        if (videoSerialNumbers.length === 0) {

            return res.json({

                success: true,

                userSerialNumber:
                    userNumber,

                limit: 20,

                count: 0,

                videos: [],

                nextPageState:
                    result?.nextPageState || null,

                hasMore:
                    Boolean(
                        result?.nextPageState
                    )

            });
        }


        // ----------------------------------------------------
        // Resolve actual videos from MongoDB
        // ----------------------------------------------------

        const mongoVideos =
            await Video.find({

                videoSerialNumber: {
                    $in: videoSerialNumbers
                },

                isDeleted: false,

                contentType: "video"

            })
                .select(
                    "-description -tags -visibility " +
                    "-category -updatedAt -__v " +
                    "-stats.comments -stats.dislikes"
                )
                .populate({

                    path: "uploader",

                    select:
                        "name _id profilePicUrl"

                })
                .lean();


        // ----------------------------------------------------
        // Create lookup map
        // ----------------------------------------------------

        const videoMap =
            new Map(
                mongoVideos.map(
                    video => [
                        Number(
                            video.videoSerialNumber
                        ),
                        video
                    ]
                )
            );


        // ----------------------------------------------------
        // Restore Astra reaction order
        // ----------------------------------------------------

        const videos =
            reactions
                .map(reaction => {

                    const video =
                        videoMap.get(
                            Number(
                                reaction.videoSerialNumber
                            )
                        );

                    if (!video) {
                        return null;
                    }

                    return {

                        ...video,

                        reaction: {
                            scope:
                                reaction.scope,

                            updatedAt:
                                reaction.updatedAt
                        }

                    };

                })
                .filter(Boolean);


        // ----------------------------------------------------
        // Response
        // ----------------------------------------------------

        res.json({

            success: true,

            userSerialNumber:
                userNumber,

            limit: 20,

            count:
                videos.length,

            videos,

            nextPageState:
                result?.nextPageState || null,

            hasMore:
                Boolean(
                    result?.nextPageState
                )

        });

    } catch (error) {

        console.error(
            "Get disliked videos failed:",
            error
        );

        res.status(500).json({

            success: false,

            error:
                "Get disliked videos failed",

            message:
                error.message

        });
    }
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {

    addLike,
    removeLike,

    addDislike,
    removeDislike,

    validateeLikeDislike,
    getVideoReactions,

    getLikedVideos,
    getDislikedVideos,
};


// const {
//   existsInBitmap,
//   removeFromBitmap,
//   addToBitmap,
//   countBitmap,
// } = require("../services/roaring.service");

// const redis = require("../config/redis");

// const {
//     createLikeDislike,
//     deleteLikeDislike,
//     getLikeDislike,
//     getUserReactionsByScope,
//     getVideoReactionsFromDB
// } = require('../modules/LikeDislike/LikeDislike.model');
// const { safeExistsInBitmap } = require("../modules/LikeDislike/LikeDislike.helper");


// const addLike = async (req, res) => {
//   try {
//     const { userSerialNumber, videoSerialNumber } = req.body;

//     const likeKey = `video:${videoSerialNumber}:likes`;
//     const dislikeKey = `video:${videoSerialNumber}:dislikes`;

//     const liked =
//             await safeExistsInBitmap(
//                 likeKey,
//                 userId,
//                 videoId,
//                 "like"
//             );

//     if (await existsInBitmap(likeKey, userSerialNumber)) {
//       return res.json({
//         success: true,
//         liked: true,
//         disliked: false,
//         likes: await countBitmap(likeKey),
//         dislikes: await countBitmap(dislikeKey),
//       });
//     }

//     if (await existsInBitmap(dislikeKey, userSerialNumber)) {
//       await removeFromBitmap(dislikeKey, userSerialNumber);
//     }

//     await addToBitmap(likeKey, userSerialNumber);

//     res.json({
//       success: true,
//       liked: true,
//       disliked: false,
//       likes: await countBitmap(likeKey),
//       dislikes: await countBitmap(dislikeKey),
//     });
//   } catch (error) {
//     res.status(500).json({ error: "Like failed" });
//   }
// };




// const removeLike = async (req, res) => {
//   try {
//     const { userSerialNumber, videoSerialNumber } = req.body;

//     const likeKey = `video:${videoSerialNumber}:likes`;
//     const dislikeKey = `video:${videoSerialNumber}:dislikes`;

//     await removeFromBitmap(likeKey, userSerialNumber);

//     res.json({
//       success: true,
//       liked: false,
//       disliked: false,
//       likes: await countBitmap(likeKey),
//       dislikes: await countBitmap(dislikeKey),
//     });
//   } catch {
//     res.status(500).json({ error: "Remove like failed" });
//   }
// };


 
// const addDislike = async (req, res) => {
//   try {
//     const { userSerialNumber, videoSerialNumber } = req.body;

//     const likeKey = `video:${videoSerialNumber}:likes`;
//     const dislikeKey = `video:${videoSerialNumber}:dislikes`;

//     if (await existsInBitmap(dislikeKey, userSerialNumber)) {
//       return res.json({
//         success: true,
//         liked: false,
//         disliked: true,
//         likes: await countBitmap(likeKey),
//         dislikes: await countBitmap(dislikeKey),
//       });
//     }

//     if (await existsInBitmap(likeKey, userSerialNumber)) {
//       await removeFromBitmap(likeKey, userSerialNumber);
//     }

//     await addToBitmap(dislikeKey, userSerialNumber);

//     res.json({
//       success: true,
//       liked: false,
//       disliked: true,
//       likes: await countBitmap(likeKey),
//       dislikes: await countBitmap(dislikeKey),
//     });
//   } catch {
//     res.status(500).json({ error: "Dislike failed" });
//   }
// };



 
// const removeDislike = async (req, res) => {
//   try {
//     const { userSerialNumber, videoSerialNumber } = req.body;

//     const dislikeKey = `video:${videoSerialNumber}:dislikes`;

//     await removeFromBitmap(dislikeKey, userSerialNumber);

//     res.json({
//       success: true,
//       liked: false,
//       disliked: false,
//       likes: await countBitmap(`video:${videoSerialNumber}:likes`),
//       dislikes: await countBitmap(dislikeKey),
//     });
//   } catch {
//     res.status(500).json({ error: "Remove dislike failed" });
//   }
// };

 
// const validateeLikeDislike = async (req, res) => {
//   try {
//     const { userSerialNumber, videoSerialNumber } = req.query;

//     const likeKey = `video:${videoSerialNumber}:likes`;
//     const dislikeKey = `video:${videoSerialNumber}:dislikes`;

//     const liked = existsInBitmap(likeKey, Number(userSerialNumber));
//     const disliked = existsInBitmap(dislikeKey, Number(userSerialNumber));

//     res.json({
//       success: true,
//       liked,
//       disliked,
//     });
//   } catch (error) {
//     res.status(500).json({ error: "Validation failed" });
//   }
// };

// const getVideoReactions = async (req, res) => {
//   try {
//     const { userSerialNumber, videoSerialNumber } = req.query;

//     const likeKey = `video:${videoSerialNumber}:likes`;
//     const dislikeKey = `video:${videoSerialNumber}:dislikes`;

//     let liked = false;
//     let disliked = false;

//     if (userSerialNumber) {
//       const userId = Number(userSerialNumber);
//       liked = await existsInBitmap(likeKey, userId);
//       disliked = await existsInBitmap(dislikeKey, userId);
//     }

//     res.json({
//       success: true,
//       liked,
//       disliked,
//       likes: await countBitmap(likeKey),
//       dislikes: await countBitmap(dislikeKey),
//     });
//   } catch (error) {
//     console.log(error)
//     res.status(500).json({ error: "Fetch reactions failed" });
//   }
// };




// module.exports = {
//   addLike,
//   removeLike,
//   addDislike,
//   removeDislike,
//   validateeLikeDislike,
//   getVideoReactions
// };
