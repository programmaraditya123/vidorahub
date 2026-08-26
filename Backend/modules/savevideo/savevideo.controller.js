const mongoose = require("mongoose");

const accountProfiles = require("../accountprofiles/accountprofiles.model");
const SavedVideo = require("./savevideo.model");
const Video = require("../uploadvideo/uploadvideo.model");

// ============================================================
// CONSTANTS
// ============================================================

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;


// ============================================================
// HELPERS
// ============================================================

const isValidObjectId = (value) => {
    return mongoose.Types.ObjectId.isValid(value);
};


const normalizePagination = (page, limit) => {

    let normalizedPage = Number(page);
    let normalizedLimit = Number(limit);

    if (
        !Number.isInteger(normalizedPage) ||
        normalizedPage < 1
    ) {
        normalizedPage = DEFAULT_PAGE;
    }

    if (
        !Number.isInteger(normalizedLimit) ||
        normalizedLimit < 1
    ) {
        normalizedLimit = DEFAULT_LIMIT;
    }

    if (normalizedLimit > MAX_LIMIT) {
        normalizedLimit = MAX_LIMIT;
    }

    return {
        page: normalizedPage,
        limit: normalizedLimit,
        skip: (normalizedPage - 1) * normalizedLimit,
    };
};


// ============================================================
// GET ACTIVE PROFILE
// ============================================================

const getActiveProfile = async (accountId) => {

    return accountProfiles
        .findOne({
            accountId,
            isActive: true,
        })
        .select("_id")
        .lean();
};


// ============================================================
// SAVE VIDEO
// ============================================================

const saveVideo = async (req, res) => {

    try {

        const { id: accountId } = req.user || {};

        const { videoId } = req.body || req.query || {};

        // ----------------------------------------------------
        // AUTH VALIDATION
        // ----------------------------------------------------

        if (
            !accountId ||
            !isValidObjectId(accountId)
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication.",
            });
        }

        // ----------------------------------------------------
        // VIDEO ID VALIDATION
        // ----------------------------------------------------

        if (
            !videoId ||
            !isValidObjectId(videoId)
        ) {
            return res.status(400).json({
                success: false,
                message: "A valid videoId is required.",
            });
        }

        // ----------------------------------------------------
        // GET ACTIVE PROFILE
        // ----------------------------------------------------

        const profile = await getActiveProfile(accountId);

        if (!profile) {

            return res.status(404).json({
                success: false,
                message: "Active profile not found.",
            });
        }

        // ----------------------------------------------------
        // VERIFY VIDEO EXISTS
        // ----------------------------------------------------

        const videoExists = await Video.exists({
            _id: videoId,
            isDeleted: false,
            contentType: "video",
        });

        if (!videoExists) {

            return res.status(404).json({
                success: false,
                message: "Video not found or unavailable.",
            });
        }

        // ----------------------------------------------------
        // UPSERT
        // ----------------------------------------------------
        //
        // This handles:
        //
        // 1. First save
        // 2. Repeated save request
        // 3. Concurrent save requests
        //
        // The unique DB index is the final protection.
        //

        let saved;

        try {

            saved = await SavedVideo.findOneAndUpdate(
                {
                    accountId,
                    videoId,
                },
                {
                    $setOnInsert: {
                        accountId,
                        profileId: profile._id,
                        videoId,
                    },
                },
                {
                    new: true,
                    upsert: true,
                    setDefaultsOnInsert: true,
                }
            ).lean();

        } catch (error) {

            // ------------------------------------------------
            // DUPLICATE KEY RACE CONDITION
            // ------------------------------------------------

            if (error?.code === 11000) {

                saved = await SavedVideo
                    .findOne({
                        accountId,
                        videoId,
                    })
                    .lean();

                return res.status(200).json({
                    success: true,
                    alreadySaved: true,
                    message: "Video is already saved.",
                    data: saved,
                });
            }

            throw error;
        }

        // ----------------------------------------------------
        // DETERMINE WHETHER THIS WAS NEW
        // ----------------------------------------------------

        const createdAt = saved?.createdAt;

        return res.status(200).json({
            success: true,
            alreadySaved: false,
            message: "Video saved successfully.",
            data: saved,
        });

    } catch (error) {

        console.error(
            "saveVideo error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};


// ============================================================
// SAVE VIDEO STATUS
// ============================================================

const saveVideoStatus = async (req, res) => {

    try {

        const { id: accountId } = req.user || {};

        const { videoId } = req.query;

        // ----------------------------------------------------
        // AUTH
        // ----------------------------------------------------

        if (
            !accountId ||
            !isValidObjectId(accountId)
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication.",
            });
        }

        // ----------------------------------------------------
        // VIDEO ID
        // ----------------------------------------------------

        if (
            !videoId ||
            !isValidObjectId(videoId)
        ) {
            return res.status(400).json({
                success: false,
                message: "A valid videoId is required.",
            });
        }

        // ----------------------------------------------------
        // CHECK SAVE
        // ----------------------------------------------------

        const saved = await SavedVideo
            .findOne({
                accountId,
                videoId,
            })
            .select("_id videoId createdAt")
            .lean();

        return res.status(200).json({
            success: true,

            data: {
                videoId,
                isSaved: Boolean(saved),
                savedAt: saved?.createdAt || null,
                savedVideoId: saved?._id || null,
            },
        });

    } catch (error) {

        console.error(
            "saveVideoStatus error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};


// ============================================================
// DELETE / UNSAVE VIDEO
// ============================================================

const unsaveVideo = async (req, res) => {

    try {

        const { id: accountId } = req.user || {};

        const { videoId } = req.body || req.query || {};

        // ----------------------------------------------------
        // AUTH
        // ----------------------------------------------------

        if (
            !accountId ||
            !isValidObjectId(accountId)
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication.",
            });
        }

        // ----------------------------------------------------
        // VIDEO ID
        // ----------------------------------------------------

        if (
            !videoId ||
            !isValidObjectId(videoId)
        ) {
            return res.status(400).json({
                success: false,
                message: "A valid videoId is required.",
            });
        }

        // ----------------------------------------------------
        // DELETE
        // ----------------------------------------------------

        const deleted = await SavedVideo.findOneAndDelete({
            accountId,
            videoId,
        }).lean();

        // ----------------------------------------------------
        // ALREADY UNSAVED
        // ----------------------------------------------------

        if (!deleted) {

            return res.status(200).json({
                success: true,
                alreadyUnsaved: true,
                message: "Video was not saved.",
                data: {
                    videoId,
                    isSaved: false,
                },
            });
        }

        // ----------------------------------------------------
        // SUCCESS
        // ----------------------------------------------------

        return res.status(200).json({
            success: true,
            alreadyUnsaved: false,
            message: "Video removed from saved videos.",
            data: {
                videoId,
                isSaved: false,
            },
        });

    } catch (error) {

        console.error(
            "unsaveVideo error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};


// ============================================================
// GET ALL SAVED VIDEOS
// ============================================================

const allSavedVideo = async (req, res) => {

    try {

        const { id: accountId } = req.user || {};

        const {
            page = DEFAULT_PAGE,
            limit = DEFAULT_LIMIT,
        } = req.query;

        // ----------------------------------------------------
        // AUTH
        // ----------------------------------------------------

        if (
            !accountId ||
            !isValidObjectId(accountId)
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication.",
            });
        }

        // ----------------------------------------------------
        // PAGINATION
        // ----------------------------------------------------

        const {
            page: currentPage,
            limit: currentLimit,
            skip,
        } = normalizePagination(
            page,
            limit
        );

        // ----------------------------------------------------
        // GET TOTAL
        // ----------------------------------------------------

        const totalSavedVideos =
            await SavedVideo.countDocuments({
                accountId,
            });

        // ----------------------------------------------------
        // EMPTY PAGE
        // ----------------------------------------------------

        if (skip >= totalSavedVideos) {

            return res.status(200).json({
                success: true,

                data: {
                    savedVideos: [],
                },

                pagination: {
                    page: currentPage,
                    limit: currentLimit,
                    total: totalSavedVideos,
                    totalPages:
                        Math.ceil(
                            totalSavedVideos /
                            currentLimit
                        ),
                    hasNextPage: false,
                    hasPreviousPage:
                        currentPage > 1,
                },
            });
        }

        // ----------------------------------------------------
        // GET SAVED VIDEO RECORDS
        // ----------------------------------------------------
        //
        // We paginate SAVED records first.
        //
        // This is important because pagination should be based
        // on the user's saved collection, not on the Video table.
        //

        const savedRecords =
            await SavedVideo
                .find({
                    accountId,
                })
                .sort({
                    createdAt: -1,
                    _id: -1,
                })
                .skip(skip)
                .limit(currentLimit)
                .select(
                    "_id videoId createdAt profileId"
                )
                .lean();

        // ----------------------------------------------------
        // GET VIDEO IDS
        // ----------------------------------------------------

        const primaryIds =
            savedRecords
                .map(item => item.videoId)
                .filter(
                    id => id && isValidObjectId(id)
                );

        // ----------------------------------------------------
        // NO VALID VIDEOS
        // ----------------------------------------------------

        if (!primaryIds.length) {

            return res.status(200).json({
                success: true,

                data: {
                    savedVideos: [],
                },

                pagination: {
                    page: currentPage,
                    limit: currentLimit,
                    total: totalSavedVideos,
                    totalPages:
                        Math.ceil(
                            totalSavedVideos /
                            currentLimit
                        ),
                    hasNextPage:
                        skip + currentLimit <
                        totalSavedVideos,
                    hasPreviousPage:
                        currentPage > 1,
                },
            });
        }

        // ----------------------------------------------------
        // RESOLVE VIDEOS
        // ----------------------------------------------------

        const videos = await Video.find({

            _id: {
                $in: primaryIds,
            },

            isDeleted: false,

            contentType: "video",

        })
            .select(
                "-description -tags -visibility " +
                "-category -updatedAt -__v " +
                "-stats.comments -stats.dislikes"
            )
            .populate({
                path: "uploader",
                select: "name _id profilePicUrl",
            })
            .lean();

        // ----------------------------------------------------
        // CREATE FAST LOOKUP MAP
        // ----------------------------------------------------

        const videoMap = new Map();

        for (const video of videos) {

            videoMap.set(
                String(video._id),
                video
            );
        }

        // ----------------------------------------------------
        // PRESERVE SAVED ORDER
        // ----------------------------------------------------
        //
        // MongoDB $in does NOT guarantee the same ordering
        // as primaryIds.
        //
        // Therefore reconstruct the original saved order.
        //

        const savedVideos = [];

        for (const saved of savedRecords) {

            const video =
                videoMap.get(
                    String(saved.videoId)
                );

            // ------------------------------------------------
            // VIDEO MAY HAVE BEEN DELETED AFTER SAVE
            // ------------------------------------------------

            if (!video) {
                continue;
            }

            savedVideos.push({
                ...video,

                savedVideoId: saved._id,

                savedAt: saved.createdAt,
            });
        }

        // ----------------------------------------------------
        // PAGINATION META
        // ----------------------------------------------------

        const totalPages =
            Math.ceil(
                totalSavedVideos /
                currentLimit
            );

        const hasNextPage =
            currentPage < totalPages;

        const hasPreviousPage =
            currentPage > 1;

        // ----------------------------------------------------
        // RESPONSE
        // ----------------------------------------------------

        return res.status(200).json({

            success: true,

            data: {
                savedVideos,
            },

            pagination: {

                page: currentPage,

                limit: currentLimit,

                total: totalSavedVideos,

                totalPages,

                hasNextPage,

                hasPreviousPage,

            },

        });

    } catch (error) {

        console.error(
            "allSavedVideo error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};




module.exports = {

    saveVideo,

    saveVideoStatus,

    unsaveVideo,

    allSavedVideo,

};



// const { default: mongoose } = require('mongoose');
// const accountProfiles = require('../accountprofiles/accountprofiles.model')
// const savedVideo = require("./savevideo.model")

// const saveVideo = async (req, res) => {
//     const { id: accountId } = req.user;
//     const { videoId } = req.query;

//     try {
//         if (!accountId || !mongoose.Types.ObjectId.isValid(accountId)) {
//             return res.status(401).json({
//                 success: false,
//                 message: "Invalid authentication , id is required",
//             });
//         }
//         if(!videoId){
//              return res.status(401).json({
//                 success: false,
//                 message: "VideoId is required",
//             });
//         }

//         const profileId = await accountProfiles.findOne({accountId,isActive : true}).select("_id")

//         const saved = await savedVideo.create({
//             accountId,
//             profileId,
//             videoId,
//         })


//         // console.log(profileId)

//         return res.status(200).json({
//             success : true,
//             message : "Video saved sucessfully",
//             data : saved
//         })

//     } catch (error) {
//         console.log("error",error)
//         return res.status(500).json({
//             success : false,
//             message : "internal server error"
//         })

//     }
// }

// const saveVideoStatus = async (req, res) => {
//     try {

//     } catch (error) {

//     }
// }

// const allSavedVideo = async (req, res) => {
//     try {

//     } catch (error) {

//     }
// }

// module.exports = { saveVideo, saveVideoStatus, allSavedVideo }
