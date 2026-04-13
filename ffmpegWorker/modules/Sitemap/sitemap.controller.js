// sitemapController.js
const Video = require("../../db/videoModel");

const getAllVideosSitemap = async (req, res) => {
  try {
    const videos = await Video.find(
      { visibility: "public", isDeleted: false, Status: "ready" },
      { _id: 1, title: 1, description: 1, videoUrl: 1, updatedAt: 1 }
    ).lean();

    res.status(200).json({ videos });
  } catch (error) {
    console.error("Sitemap fetch error:", error);
    res.status(500).json({ error: "Failed to fetch sitemap data" });
  }
};

module.exports = { getAllVideosSitemap };