const db = require("../../db/db2");

const UserActivityController = async (req, res) => {
  try {
    const { userId, totalTimeSpent } = req.body || {};

    if (!userId || !totalTimeSpent) {
      return res.status(400).json({
        message: "Invalid payload",
      });
    }

    const collection = db.collection("user_activity");

    const result = await collection.updateOne(
      { user_id: userId },
      {
        $inc: { total_time_spent: totalTimeSpent },
        $set: { event_time: new Date() },
      },
      { upsert: true }
    );

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "unable to post activity",
    });
  }
};

module.exports = { UserActivityController };