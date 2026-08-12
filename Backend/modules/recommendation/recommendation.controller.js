const Video = require("../uploadvideo/uploadvideo.model");

const FASTAPI_URL =
    process.env.FASTAPI_PRO_URL ||
    "http://localhost:8081";

const TOPICS = [
    "Music",
    "Bhajan",
    "Wrestling",
    "Software",
    "Gaming",
    "Comedy",
    "Movies",
    "Education",
    "News",
    "Sports",
    "Tech",
    "Podcasts",
    "Live",
    "Cooking",
    "Travel",
    "Fashion",
    "Fitness",
];

const VIDEO_SELECT =
    "-description -tags -visibility -category -updatedAt -__v -stats.comments -stats.dislikes";

const getIds = (value) => {
    if (!value) return [];

    const values = Array.isArray(value)
        ? value
        : [value];

    return [
        ...new Set(
            values
                .flatMap((item) =>
                    String(item).split(",")
                )
                .map((item) => item.trim())
                .filter(Boolean)
        ),
    ];
};

const fetchRecommendedIds = async ({
    categories,
    tags,
    watchedVideoIds,
    limit,
}) => {
    const url = new URL(
        "/model/recommendations",
        FASTAPI_URL
    );

    url.searchParams.set(
        "content_type",
        "video"
    );

    url.searchParams.set(
        "limit",
        String(limit)
    );

    const mergedTags = [
        ...new Set([
            ...tags,
            ...categories,
        ]),
    ];

    for (const tag of mergedTags) {
        url.searchParams.append(
            "tags",
            tag
        );
    }

    for (const id of watchedVideoIds) {
        url.searchParams.append(
            "watched_video_ids",
            id
        );
    }

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Recommendation service returned ${response.status}`
        );
    }

    const data = await response.json();

    if (Array.isArray(data)) {
        return data.map(String);
    }

    if (Array.isArray(data.items)) {
        return data.items.map(String);
    }

    return [];
};

const fetchVideos = async ({
    ids,
    category,
    watchedIds,
}) => {
    if (!ids.length) {
        return [];
    }

    const filter = {
        _id: {
            $in: ids,
            ...(watchedIds.length
                ? { $nin: watchedIds }
                : {}),
        },
        isDeleted: {
            $ne: true,
        },
        contentType: "video",
    };

    if (category) {
        filter.category = category;
    }

    const videos = await Video.find(filter)
        .select(VIDEO_SELECT)
        .populate({
            path: "uploader",
            select: "name _id profilePicUrl",
        })
        .lean();

    const videoMap = new Map(
        videos.map((video) => [
            String(video._id),
            video,
        ])
    );

    return ids
        .map((id) => videoMap.get(id))
        .filter(Boolean);
};

const getHomeFeed = async (req, res) => {
    try {
        const page = Math.max(
            parseInt(req.query.page, 10) || 1,
            1
        );

        const limit = Math.min(
            Math.max(
                parseInt(req.query.limit, 10) || 20,
                1
            ),
            100
        );

        const requestedCategory =
            String(
                req.query.category || ""
            ).trim();

        const userTags = getIds(
            req.query.tags
        );

        const watchedVideoIds = getIds(
            req.query.watchedVideoIds ||
            req.query.watched_video_ids
        );

        const watchedSet = new Set(
            watchedVideoIds
        );

        const selectedCategories = [];

        if (
            requestedCategory &&
            requestedCategory.toLowerCase() !==
                "all"
        ) {
            selectedCategories.push(
                requestedCategory
            );
        }

        const availableCategories =
            TOPICS.filter(
                (topic) =>
                    topic.toLowerCase() !==
                    requestedCategory.toLowerCase()
            );

        const feed = [];
        const feedIds = new Set();

        let categoryIndex = 0;

        while (
            feed.length <
                page * limit &&
            (
                selectedCategories.length > 0 ||
                categoryIndex <
                    availableCategories.length
            )
        ) {
            if (
                selectedCategories.length === 0
            ) {
                selectedCategories.push(
                    availableCategories[
                        categoryIndex++
                    ]
                );
            }

            const currentCategory =
                selectedCategories[
                    selectedCategories.length - 1
                ];

            const remaining =
                page * limit -
                feed.length;

            const requestLimit = Math.min(
                Math.max(
                    remaining * 2,
                    limit
                ),
                100
            );

            const recommendedIds =
                await fetchRecommendedIds({
                    categories:
                        selectedCategories,
                    tags: userTags,
                    watchedVideoIds,
                    limit: requestLimit,
                });

            const filteredIds = [
                ...new Set(
                    recommendedIds.filter(
                        (id) =>
                            !watchedSet.has(id) &&
                            !feedIds.has(id)
                    )
                ),
            ];

            const videos =
                await fetchVideos({
                    ids: filteredIds,
                    category:
                        currentCategory,
                    watchedIds:
                        watchedVideoIds,
                });

            for (const video of videos) {
                const id = String(
                    video._id
                );

                if (
                    feedIds.has(id) ||
                    watchedSet.has(id)
                ) {
                    continue;
                }

                feedIds.add(id);
                feed.push(video);

                if (
                    feed.length >=
                    page * limit
                ) {
                    break;
                }
            }

            if (
                feed.length <
                    page * limit
            ) {
                const nextCategory =
                    availableCategories[
                        categoryIndex++
                    ];

                if (!nextCategory) {
                    break;
                }

                if (
                    !selectedCategories.includes(
                        nextCategory
                    )
                ) {
                    selectedCategories.push(
                        nextCategory
                    );
                }
            }
        }

        const skip =
            (page - 1) * limit;

        const items = feed.slice(
            skip,
            skip + limit
        );

        res.json({
            ok: true,
            page,
            limit,
            category:
                requestedCategory || null,
            total: items.length,
            hasNextPage:
                feed.length >
                skip + limit,
            hasPrevPage: page > 1,
            items,
        });
    } catch (error) {
        console.error(
            "getHomeFeed error:",
            error
        );

        res.status(500).json({
            ok: false,
            message:
                "Failed to load home feed",
        });
    }
};

module.exports = {
    getHomeFeed,
};