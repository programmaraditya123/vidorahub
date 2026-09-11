const Video = require("../uploadvideo/uploadvideo.model");

// Older uploads may predate these flags. Mongoose defaults do not backfill
// stored documents during aggregation; only explicit true should exclude them.
const PUBLIC_VIDEOS = { isDeleted: { $ne: true }, isPaused: { $ne: true }, visibility: "public" };
const SEARCH_FIELDS = { title: 8, description: 6, tags: 5, aitags: 3, category: 2 };
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const queryText = (value) => typeof value === "string" ? value.trim() : "";
const positiveInteger = (value, fallback, maximum) => {
    const number = typeof value === "string" && /^\d+$/.test(value) ? Number(value) : NaN;
    return Number.isSafeInteger(number) && number > 0 ? Math.min(number, maximum) : fallback;
};
const safeArray = (field) => ({ $cond: [{ $isArray: field }, field, []] });
const safeString = (field) => ({ $cond: [{ $eq: [{ $type: field }, "string"] }, field, ""] });
const safeCount = (field) => ({ $max: [0, { $convert: { input: field, to: "double", onError: 0, onNull: 0 } }] });

const videoDetails = [
    { $lookup: { from: "userprofiles", localField: "uploader", foreignField: "_id", as: "uploader" } },
    { $unwind: { path: "$uploader", preserveNullAndEmptyArrays: true } },
    { $project: {
        title: 1, description: 1, tags: 1, aitags: 1, thumbnailUrl: 1,
        duration: 1, contentType: 1, category: 1,
        uploader: { _id: "$uploader._id", username: "$uploader.username", name: "$uploader.name", profileImage: "$uploader.profilePicUrl" },
        stats: 1, videoUrl: 1, hlsUl: 1, createdAt: 1,
        relevanceScore: 1, popularityScore: 1, finalScore: 1, matchedKeywords: 1, isRelated: 1,
        keywordMatches: 1
    } }
];

const getSearchKeywords = async (req, res) => {
    try {
        const q = queryText(req.query.q).toLowerCase();
        if (q.length > 200) {
            return res.status(400).json({ success: false, message: "Search query must not exceed 200 characters" });
        }
        const results = await Video.aggregate([
            { $match: PUBLIC_VIDEOS },
            { $project: {
                candidates: { $concatArrays: [safeArray("$tags"), safeArray("$aitags"), [safeString("$category"), safeString("$title")]] },
                views: safeCount("$stats.views")
            } },
            { $unwind: "$candidates" },
            { $set: { keyword: { $toLower: { $trim: { input: safeString("$candidates") } } } } },
            { $match: { keyword: { $ne: "", ...(q ? { $regex: new RegExp(escapeRegex(q), "i") } : {}) } } },
            // Count a keyword once per video, even when tags and AI tags overlap.
            { $group: { _id: { video: "$_id", keyword: "$keyword" }, views: { $first: "$views" } } },
            { $group: { _id: "$_id.keyword", frequency: { $sum: 1 }, views: { $sum: "$views" } } },
            { $set: { prefixMatch: { $cond: [{ $regexMatch: { input: "$_id", regex: new RegExp(`^${escapeRegex(q)}`, "i") } }, 1, 0] } } },
            { $sort: { prefixMatch: -1, frequency: -1, views: -1, _id: 1 } },
            { $limit: 10 },
            { $project: { _id: 0, keyword: "$_id" } }
        ]);
        return res.status(200).json({ success: true, keywords: results.map(item => item.keyword) });
    } catch (error) {
        console.error("getSearchKeywords error:", error);
        return res.status(500).json({ success: false, message: "Failed to get search keywords" });
    }
};

// Relationships are deliberately one hop: unrelated categories never become filler.
const CATEGORY_RELATIONS = {
    music: ["bhajan", "spiritual", "movies"],
    bhajan: ["spiritual", "music"],
    spiritual: ["bhajan", "music", "podcasts"],
    wrestling: ["sports", "fitness"],
    software: ["tech", "education", "gaming"],
    gaming: ["tech", "software"],
    "food vlogs": ["cooking", "travel"],
    comedy: ["meme", "movies", "podcasts"],
    movies: ["comedy", "music"],
    education: ["software", "tech", "podcasts"],
    news: ["podcasts", "tech", "sports"],
    sports: ["wrestling", "fitness"],
    tech: ["software", "gaming", "education"],
    podcasts: ["education", "news", "comedy", "spiritual"],
    live: ["news", "sports", "gaming", "music"],
    cooking: ["food vlogs", "travel"],
    travel: ["food vlogs", "cooking", "fashion"],
    fashion: ["travel", "fitness"],
    fitness: ["sports", "wrestling"],
    meme: ["comedy"]
};
const CATEGORY_ALIASES = { "food vlog": "food vlogs", memes: "meme", technology: "tech", devotional: "bhajan" };
const normalizeCategory = (value) => {
    if (typeof value !== "string") return "";
    const category = value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
    return CATEGORY_ALIASES[category] || category;
};

const rankedResults = (page, limit) => [
    { $set: { popularityScore: { $add: Object.entries({ views: 1, likes: 2, comments: 1.5 }).map(([field, weight]) => ({
        $multiply: [{ $ln: { $add: [safeCount(`$stats.${field}`), 1] } }, weight]
    })) } } },
    { $set: { finalScore: { $add: [{ $multiply: ["$relevanceScore", 0.8] }, { $multiply: ["$popularityScore", 0.2] }] } } },
    { $facet: {
        metadata: [{ $count: "total" }],
        categories: [{ $group: { _id: "$category" } }],
        // Lexicographic field priority: lower-priority matches and popularity
        // can never overtake a video with more title (then description, etc.) matches.
        results: [{ $sort: {
            isRelated: 1,
            "keywordMatches.title": -1,
            "keywordMatches.description": -1,
            "keywordMatches.tags": -1,
            "keywordMatches.aitags": -1,
            "keywordMatches.category": -1,
            matchedKeywords: -1, popularityScore: -1, createdAt: -1, _id: -1
        } }, { $skip: (page - 1) * limit }, { $limit: limit }, ...videoDetails]
    } }
];

const searchTerms = (q) => [...new Set(q.toLowerCase().split(/\s+/u).filter(Boolean))];
const matchesField = (field, regex) => ["tags", "aitags"].includes(field)
    ? { $anyElementTrue: [{ $map: {
        input: { $cond: [{ $isArray: `$${field}` }, `$${field}`, [safeString(`$${field}`)]] },
        as: "tag", in: { $regexMatch: { input: safeString("$$tag"), regex } }
    } }] }
    : { $regexMatch: { input: safeString(`$${field}`), regex } };

const databaseSearch = (q, relatedCategories = []) => {
    const regexes = searchTerms(q).map(term => new RegExp(escapeRegex(term), "i"));
    const directFilters = regexes.flatMap(regex => Object.keys(SEARCH_FIELDS).map(field => ({ [field]: regex })));
    const termMatches = regexes.map(regex => ({ $or: Object.keys(SEARCH_FIELDS).map(field => matchesField(field, regex)) }));
    const relatedFilters = relatedCategories.map(category => ({
        category: new RegExp(`^\\s*${category.split(" ").map(escapeRegex).join("[\\s_-]+")}\\s*$`, "i")
    }));
    return [
        { $match: { ...PUBLIC_VIDEOS, $or: [...directFilters, ...relatedFilters] } },
        { $set: {
            keywordMatches: Object.fromEntries(Object.keys(SEARCH_FIELDS).map(field => [
                field, { $add: regexes.map(regex => ({ $cond: [matchesField(field, regex), 1, 0] })) }
            ])),
            matchedKeywords: { $add: termMatches.map(match => ({ $cond: [match, 1, 0] })) },
            isRelated: { $not: [{ $or: termMatches }] },
            relevanceScore: { $add: [
                ...regexes.flatMap(regex => Object.entries(SEARCH_FIELDS).map(([field, weight]) => ({ $cond: [matchesField(field, regex), weight, 0] }))),
                { $cond: [matchesField("title", new RegExp(escapeRegex(q), "i")), 10, 0] }
            ] }
        } }
    ];
};

const getRelatedCategories = (q, categories) => {
    const seeds = new Set(categories.map(item => normalizeCategory(item._id)).filter(category => CATEGORY_RELATIONS[category]));
    const normalizedQuery = normalizeCategory(q);
    for (const category of Object.keys(CATEGORY_RELATIONS)) {
        if (` ${normalizedQuery} `.includes(` ${category} `)) seeds.add(category);
    }
    const related = new Set();
    for (const category of seeds) {
        related.add(category);
        CATEGORY_RELATIONS[category].forEach(item => related.add(item));
    }
    for (const [alias, category] of Object.entries(CATEGORY_ALIASES)) {
        if (related.has(category)) related.add(alias);
    }
    return [...related];
};

const getSearchResults = async (req, res) => {
    try {
        const q = queryText(req.query.q);
        const page = positiveInteger(req.query.page, 1, 1000000);
        const limit = positiveInteger(req.query.limit, 20, 50);
        if (q.length > 200) {
            return res.status(400).json({ success: false, message: "Search query must not exceed 200 characters" });
        }

        let search;
        let directTotal = 0;
        let relatedCategories = [];
        // "All" is a browse request, not a keyword or a related category.
        const isBrowse = !q || q.toLowerCase() === "all";
        if (!isBrowse) {
            [search] = await Video.aggregate([...databaseSearch(q), ...rankedResults(page, limit)]);
            directTotal = search?.metadata?.[0]?.total || 0;
            // Use a fixed threshold so the result set stays consistent across pages/limits.
            if (directTotal < 20) {
                relatedCategories = getRelatedCategories(q, search?.categories || []);
                if (relatedCategories.length) {
                    [search] = await Video.aggregate([...databaseSearch(q, relatedCategories), ...rankedResults(page, limit)]);
                }
            }
        } else {
            [search] = await Video.aggregate([
                { $match: PUBLIC_VIDEOS },
                { $set: { relevanceScore: 0, matchedKeywords: 0, isRelated: false } },
                ...rankedResults(page, limit)
            ]);
            directTotal = search?.metadata?.[0]?.total || 0;
        }

        const total = search?.metadata?.[0]?.total || 0;
        const isFallback = !isBrowse && total === 0;
        const results = isFallback
            ? await Video.aggregate([{ $match: PUBLIC_VIDEOS }, { $sort: { createdAt: -1, _id: -1 } }, { $limit: 20 }, ...videoDetails])
            : search?.results || [];

        return res.status(200).json({
            success: true, query: q, page: isFallback ? 1 : page, limit: isFallback ? 20 : limit,
            count: results.length, total, directTotal, relatedTotal: total - directTotal, relatedCategories, hasMore: !isFallback && page * limit < total,
            isFallback, ...(isFallback ? { message: "No video for this search" } : {}), results
        });
    } catch (error) {
        console.error("getSearchResults error:", error);
        return res.status(500).json({ success: false, message: "Failed to search videos" });
    }
};

module.exports = { getSearchKeywords, getSearchResults };
