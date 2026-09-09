const Video = require("../uploadvideo/uploadvideo.model");

const escapeRegex = (value) => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const getSearchKeywords = async (req, res) => {
    try {

        const q = String(req.query.q || "")
            .trim()
            .toLowerCase();

        if (!q) {
            return res.status(200).json({
                success: true,
                keywords: []
            });
        }

        if (q.length < 2) {
            return res.status(200).json({
                success: true,
                keywords: []
            });
        }

        const regex = new RegExp(`^${escapeRegex(q)}`, "i");

        const results = await Video.aggregate([
            {
                $match: {
                    isDeleted: false,
                    isPaused: false,
                    visibility: "public"
                }
            },

            {
                $project: {
                    candidates: {
                        $concatArrays: [
                            "$tags",
                            "$aitags",
                            ["$category"]
                        ]
                    }
                }
            },

            {
                $unwind: "$candidates"
            },

            {
                $match: {
                    candidates: {
                        $regex: regex
                    }
                }
            },

            {
                $group: {
                    _id: {
                        $toLower: "$candidates"
                    }
                }
            },

            {
                $sort: {
                    "_id": 1
                }
            },

            {
                $limit: 10
            },

            {
                $project: {
                    _id: 0,
                    keyword: "$_id"
                }
            }
        ]);

        return res.status(200).json({
            success: true,
            keywords: results.map(item => item.keyword)
        });

    } catch (error) {

        console.error("getSearchKeywords error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to get search keywords"
        });
    }
};

const getSearchResults = async (req, res) => {

    try {

        const q = String(req.query.q || "").trim();

        const page = Math.max(
            parseInt(req.query.page || "1", 10),
            1
        );

        const limit = Math.min(
            parseInt(req.query.limit || "20", 10),
            50
        );

        if (!q) {
            return res.status(400).json({
                success: false,
                message: "Search query is required"
            });
        }

        if (q.length < 2) {
            return res.status(400).json({
                success: false,
                message: "Search query must contain at least 2 characters"
            });
        }

        const skip = (page - 1) * limit;


        const pipeline = [

            {
                $search: {
                    index: "video_search",

                    compound: {

                        should: [

                            // Exact phrase in title
                            {
                                phrase: {
                                    query: q,
                                    path: "title",
                                    score: {
                                        boost: {
                                            value: 10
                                        }
                                    }
                                }
                            },

                            // Title keyword matching
                            {
                                text: {
                                    query: q,
                                    path: "title",
                                    score: {
                                        boost: {
                                            value: 8
                                        }
                                    }
                                }
                            },

                            // Tags
                            {
                                text: {
                                    query: q,
                                    path: "tags",
                                    score: {
                                        boost: {
                                            value: 6
                                        }
                                    }
                                }
                            },

                            // AI tags
                            {
                                text: {
                                    query: q,
                                    path: "aitags",
                                    score: {
                                        boost: {
                                            value: 5
                                        }
                                    }
                                }
                            },

                            // Description
                            {
                                text: {
                                    query: q,
                                    path: "description",
                                    score: {
                                        boost: {
                                            value: 3
                                        }
                                    }
                                }
                            },

                            // Category
                            {
                                text: {
                                    query: q,
                                    path: "category",
                                    score: {
                                        boost: {
                                            value: 2
                                        }
                                    }
                                }
                            }

                        ],

                        minimumShouldMatch: 1
                    }
                }
            },

            {
                $match: {
                    isDeleted: false,
                    isPaused: false,
                    visibility: "public"
                }
            },

            {
                $set: {
                    relevanceScore: {
                        $meta: "searchScore"
                    }
                }
            },

            {
                $set: {

                    popularityScore: {
                        $add: [

                            {
                                $multiply: [
                                    {
                                        $ln: {
                                            $add: [
                                                "$stats.views",
                                                1
                                            ]
                                        }
                                    },
                                    1
                                ]
                            },

                            {
                                $multiply: [
                                    {
                                        $ln: {
                                            $add: [
                                                "$stats.likes",
                                                1
                                            ]
                                        }
                                    },
                                    2
                                ]
                            },

                            {
                                $multiply: [
                                    {
                                        $ln: {
                                            $add: [
                                                "$stats.comments",
                                                1
                                            ]
                                        }
                                    },
                                    1.5
                                ]
                            }

                        ]
                    }

                }
            },

            {
                $set: {

                    finalScore: {
                        $add: [

                            {
                                $multiply: [
                                    "$relevanceScore",
                                    0.8
                                ]
                            },

                            {
                                $multiply: [
                                    "$popularityScore",
                                    0.2
                                ]
                            }

                        ]
                    }

                }
            },

            {
                $sort: {
                    finalScore: -1,
                    createdAt: -1
                }
            },

            {
                $skip: skip
            },

            {
                $limit: limit
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
                    title: 1,
                    description: 1,
                    tags: 1,
                    aitags: 1,
                    thumbnailUrl: 1,
                    duration: 1,
                    contentType: 1,
                    category: 1,
                    uploader: {
                        _id: "$uploader._id",
                        username: "$uploader.username",
                        name: "$uploader.name",
                        profileImage: "$uploader.profileImage"
                    },
                    stats: 1,
                    videoUrl: 1,
                    hlsUl: 1,
                    createdAt: 1,

                    relevanceScore: 1,
                    popularityScore: 1,
                    finalScore: 1
                }
            }

        ];


        const videos = await Video.aggregate(pipeline);


        return res.status(200).json({

            success: true,

            query: q,

            page,

            limit,

            count: videos.length,

            results: videos

        });

    } catch (error) {

        console.error("getSearchResults error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to search videos"
        });
    }
};

module.exports = { getSearchKeywords, getSearchResults }