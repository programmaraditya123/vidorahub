const db = require("../../db/db2");

const UserActivityController = async (req, res) => {
  try {
    const {
      userId = null,
      profileId = null,
      deviceId,
      sessionId,
      eventId,
      totalTimeSpent,
    } = req.body || {};

    // ---------------------------------------------
    // Validate required fields
    // ---------------------------------------------

    if (
      !deviceId ||
      !sessionId ||
      !eventId ||
      totalTimeSpent === undefined ||
      totalTimeSpent === null
    ) {
      return res.status(400).json({
        success: false,
        message:
          "deviceId, sessionId, eventId and totalTimeSpent are required",
      });
    }

    // ---------------------------------------------
    // Validate time
    // ---------------------------------------------

    const timeSpent = Number(totalTimeSpent);

    if (!Number.isFinite(timeSpent) || timeSpent <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid totalTimeSpent",
      });
    }

    const collection = db.collection("user_activity");

    // ---------------------------------------------
    // Identity
    //
    // One activity document per device + session
    // ---------------------------------------------

    const identityFilter = {
      device_id: deviceId,
      session_id: sessionId,
    };

    // ---------------------------------------------
    // Build $set
    // ---------------------------------------------

    const setData = {
      event_time: new Date(),
      last_event_id: eventId,
    };

    if (userId) {
      setData.user_id = userId;
    }

    if (profileId) {
      setData.profile_id = profileId;
    }

    // ---------------------------------------------
    // Update
    //
    // IMPORTANT:
    // total_time_spent is ONLY handled by $inc.
    // Do NOT put it inside $setOnInsert.
    // ---------------------------------------------

    await collection.updateOne(
      identityFilter,
      {
        $inc: {
          total_time_spent: timeSpent,
        },

        $set: setData,

        $setOnInsert: {
          device_id: deviceId,
          session_id: sessionId,
          created_at: new Date(),
        },
      },
      {
        upsert: true,
      }
    );

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.log(
      "UserActivityController error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to post activity",
    });
  }
};

module.exports = {
  UserActivityController,
};



// const db = require("../../db/db2");

// const UserActivityController = async (req, res) => {
//   try {
//     const { userId, totalTimeSpent } = req.body || {};

//     if (!userId || !totalTimeSpent) {
//       return res.status(400).json({
//         message: "Invalid payload",
//       });
//     }

//     const collection = db.collection("user_activity");

//     const result = await collection.updateOne(
//       { user_id: userId },
//       {
//         $inc: { total_time_spent: totalTimeSpent },
//         $set: { event_time: new Date() },
//       },
//       { upsert: true }
//     );

//     return res.status(200).json({
//       success: true,
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       message: "unable to post activity",
//     });
//   }
// };

// module.exports = { UserActivityController };