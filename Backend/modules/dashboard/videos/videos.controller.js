const Video = require('../../uploadvideo/uploadvideo.model')

const getTagVideos = async (req, res) => {
    try {
        const { tag, sort } = req.params;
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = 20;
        const skip = (page - 1) * limit;

        const validTags = ["tagged", "untagged", "all"];
        const validSort = ["newest", "oldest"];

        if (!validTags.includes(tag)) {
            return res.status(400).json({
                success: false,
                message: "Invalid tag filter. Use tagged, untagged or all."
            });
        }

        if (!validSort.includes(sort)) {
            return res.status(400).json({
                success: false,
                message: "Invalid sort. Use newest or oldest."
            });
        }

        // Base filter
        const baseQuery = {
            $and: [
                {
                    $or: [
                        { isPaused: false },
                        { isPaused: { $exists: false } }
                    ]
                },
                {
                    $or: [
                        { isDeleted: false },
                        { isDeleted: { $exists: false } }
                    ]
                }
            ]
        };

        // Filter according to tag
        let query = { ...baseQuery };

        if (tag === "tagged") {
            query.aitags = {
                $exists: true,
                $ne: []
            };
        } else if (tag === "untagged") {
            query.$or = [
                { aitags: { $exists: false } },
                { aitags: { $size: 0 } }
            ];
        }

        // Sort
        const sortOption =
            sort === "newest"
                ? { createdAt: -1 }
                : { createdAt: 1 };

        const [
            videos,
            filteredVideos,
            totalVideos,
            totalTaggedVideos,
            totalUntaggedVideos
        ] = await Promise.all([
            Video.find(query)
                 .select("-videoSerialNumber -hlsUl -videoUrl -uploader -category -contentType -stats.likes -stats.dislikes -stats.comments -description")
                .sort(sortOption)
                .skip(skip)
                .limit(limit)
                .lean(),

            Video.countDocuments(query),

            Video.countDocuments(baseQuery),

            Video.countDocuments({
                ...baseQuery,
                aitags: {
                    $exists: true,
                    $ne: []
                }
            }),

            Video.countDocuments({
                ...baseQuery,
                $or: [
                    { aitags: { $exists: false } },
                    { aitags: { $size: 0 } }
                ]
            })
        ]);

        return res.status(200).json({
            success: true,

            stats: {
                totalVideos,
                totalTaggedVideos,
                totalUntaggedVideos
            },

            pagination: {
                page,
                limit,
                total: filteredVideos,
                totalPages: Math.ceil(filteredVideos / limit),
                hasNextPage: page * limit < filteredVideos,
                hasPreviousPage: page > 1
            },

            videos
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

const addTags = async (req, res) => {
    try {
        const { id } = req.params;
        const { aitags } = req.body;

        if (!Array.isArray(aitags)) {
            return res.status(400).json({
                success: false,
                message: "aitags must be an array."
            });
        }

        // Remove duplicates and trim whitespace
        const cleanedTags = [
            ...new Set(
                aitags
                    .map(tag => String(tag).trim())
                    .filter(tag => tag.length > 0)
            )
        ];

        const video = await Video.findByIdAndUpdate(
            id,
            {
                $set: {
                    aitags: cleanedTags,
                    aitagsUpdatedAt: new Date()
                },
                $inc: {
                    tagIteration: 1
                }
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!video) {
            return res.status(404).json({
                success: false,
                message: "Video not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "AI tags updated successfully.",
            video
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};



module.exports = { addTags, getTagVideos }