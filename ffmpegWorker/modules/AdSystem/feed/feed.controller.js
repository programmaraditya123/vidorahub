// feed/feed.controller.js
// Public feed: paginated videos with injected ads selected by the delivery engine.
const Video = require('../../../db/videoModel');
const { selectAds } = require('../delivery/delivery.helper');

/**
 * GET /api/v1/feed
 * Returns paginated videos + injected ads.
 * Query params: page, limit, country, device, tags
 */
exports.getFeed = async (req, res) => {
  try {
    const pageNumber = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageLimit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const skippedVideos = (pageNumber - 1) * pageLimit;
    const videoFilter = { visibility: 'public', isDeleted: false, Status: 'ready' };

    const videos = await Video.find(videoFilter)
      .sort({ createdAt: -1 })
      .skip(skippedVideos)
      .limit(pageLimit)
      .lean();

    const totalVideos = await Video.countDocuments(videoFilter);

    const audienceUserId = req.user ? String(req.user._id) : req.query.userId || 'anonymous';
    const audienceTags = req.query.tags
      ? req.query.tags.split(',').map((tagValue) => tagValue.trim()).filter(Boolean)
      : [];

    const audienceContext = {
      userId: audienceUserId,
      country: req.query.country || null,
      device: req.query.device || null,
      tags: audienceTags,
    };

    const adCount = Math.min(3, Math.max(1, Math.floor(pageLimit / 4)));
    const ads = await selectAds(audienceContext, adCount);

    return res.status(200).json({
      success: true,
      data: videos,
      ads,
      pagination: {
        page: pageNumber,
        limit: pageLimit,
        total: totalVideos,
        totalPages: Math.ceil(totalVideos / pageLimit),
        hasNext: skippedVideos + videos.length < totalVideos,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
