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
    // Logged in:
    //   userId + profileId + deviceId + sessionId
    //
    // Anonymous:
    //   deviceId + sessionId
    // ---------------------------------------------

    const identityFilter = {
      device_id: deviceId,
      session_id: sessionId,
    };

    // ---------------------------------------------
    // Build update
    // ---------------------------------------------

    const update = {
      $inc: {
        total_time_spent: timeSpent,
      },

      $set: {
        event_time: new Date(),
        last_event_id: eventId,
      },

      $setOnInsert: {
        device_id: deviceId,
        session_id: sessionId,
        total_time_spent: 0,
        created_at: new Date(),
      },
    };

    // ---------------------------------------------
    // Add userId when available
    // ---------------------------------------------

    if (userId) {
      update.$set.user_id = userId;
    }

    // ---------------------------------------------
    // Add profileId when available
    // ---------------------------------------------

    if (profileId) {
      update.$set.profile_id = profileId;
    }

    // ---------------------------------------------
    // Update activity
    // ---------------------------------------------

    await collection.updateOne(
      identityFilter,
      update,
      {
        upsert: true,
      }
    );

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error("UserActivityController error:", error);

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