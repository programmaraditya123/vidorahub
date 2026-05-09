// delivery/delivery.controller.js
const { selectAds } = require("./delivery.helper");

//why req.query.userId (for guest users)  In real life, the frontend application (React, Vue, etc.) might generate a temporary unique ID (a UUID) for a guest,
//store it in the browser's localStorage or a cookie, and append it to the API request like this: GET /api/ads?userId=guest-12345

exports.getAds = async (req, res) => {
  try {
    const resolvedUserId = req.user
      ? req.user._id
      : req.query.userId || "anonymous";
    const parsedAge = Number.parseInt(req.query.age, 10);

    const userContext = {
      userId: String(resolvedUserId),
      country: req.query.country || null,
      age: Number.isNaN(parsedAge) ? null : parsedAge,
      gender: req.query.gender || null,
      device: req.query.device || null,
      tags: req.query.tags
        ? req.query.tags
            .split(",")
            .map((tagValue) => tagValue.trim())
            .filter(Boolean)
        : [],
    };

    const requestedLimit = Number.parseInt(req.query.limit, 10) || 3;
    const limit = Math.min(requestedLimit, 10);
    const ads = await selectAds(userContext, limit);

    return res.status(200).json({ success: true, ads, count: ads.length });
  } catch (deliveryError) {
    return res.status(500).json({ error: deliveryError.message });
  }
};
