const userProfile = require("../auth/auth.model");

const round2 = (num) => Math.round(num * 100) / 100;

const getEarnings = async (req, res) => {
  try {
    const { id } = req.user;
    if (!id) {
      return res.status(403).json({ message: "You aren't a creator yet " });
    }

    const user = await userProfile
      .findById(id)
      .select("totalviews uploads role")
      .populate({
        path: "uploads",
        options: { sort: { createdAt: -1 } },
        select: "stats",
      });

    if (user?.role !== 1) {
      return res
        .status(400)
        .json({ message: "please upload a video to access earning page" });
    }
    const RATES = {
      perView: 0.01,
      perLike: 0.05,
      perDislike: -0.02,
      perComment: 0.1,
    };

    let totals = {
      views: 0,
      likes: 0,
      dislikes: 0,
      comments: 0,
    };

    // ✅ Aggregate all stats
    user.uploads.forEach((video) => {
      const stats = video.stats || {};

      totals.views += stats.views || 0;
      totals.likes += stats.likes || 0;
      totals.dislikes += stats.dislikes || 0;
      totals.comments += stats.comments || 0;
    });

    //Calculate earnings
    const earnings = {
      viewsEarning: round2(totals.views * RATES.perView),
      likesEarning: round2(totals.likes * RATES.perLike),
      dislikesPenalty: round2(totals.dislikes * RATES.perDislike),
      commentsEarning: round2(totals.comments * RATES.perComment),
    };

    const totalEarning =
      earnings.viewsEarning +
      earnings.likesEarning +
      earnings.dislikesPenalty +
      earnings.commentsEarning;

    const POINT_RATE = 100;

    const totalPoints = totalEarning * POINT_RATE;

    return res.status(200).json({
      totals,
      earnings,
      totalEarning,
      totalPoints
    });
  } catch (error) {
    console.log("error", error);
    return res
      .status(500)
      .json({ message: "internal server error in get creator earning" });
  }
};

module.exports = { getEarnings };
