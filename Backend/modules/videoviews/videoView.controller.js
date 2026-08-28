const db = require("../../config/db2");

const validateSchema = require("./utils/validateSchema");
const videoViewSchema = require("./videoView.schema");

const Profile = require("../auth/auth.model");
const Video = require("../uploadvideo/uploadvideo.model");

const accountProfile = require('../accountprofiles/accountprofiles.model')

const UAParser = require("ua-parser-js");
const geoip = require("geoip-lite");






const ALLOWED_PLATFORMS = new Set([
  "android",
  "web",
  "apple"
]);






const isValidNumber = (value) => {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
};


const getClientIp = (req) => {

  const forwarded =
    req.headers["x-forwarded-for"];

  if (forwarded) {

    return forwarded
      .split(",")[0]
      .trim();

  }

  return (
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    "unknown"
  );
};


const normalizePlatform = (platform) => {

  if (
    typeof platform !== "string"
  ) {
    return null;
  }

  const normalized =
    platform
      .trim()
      .toLowerCase();

  return ALLOWED_PLATFORMS.has(normalized)
    ? normalized
    : null;
};
























const postView = async (req, res) => {

  try {





    if (
      !req.user ||
      !req.user._id
    ) {

      return res.status(401).json({
        success: false,
        error: "Authentication required"
      });

    }


    const accountId =
      req.user._id.toString();






    const {
      profileId,
      videoId,
      sessionId,
      deviceId,
      watchTime,
      platform
    } = req.body;






    if (!profileId) {

      return res.status(400).json({
        success: false,
        error: "profileId is required"
      });

    }


    if (!videoId) {

      return res.status(400).json({
        success: false,
        error: "videoId is required"
      });

    }


    if (!sessionId) {

      return res.status(400).json({
        success: false,
        error: "sessionId is required"
      });

    }


    if (!deviceId) {

      return res.status(400).json({
        success: false,
        error: "deviceId is required"
      });

    }






    if (
      typeof profileId !== "string" ||
      typeof videoId !== "string" ||
      typeof sessionId !== "string" ||
      typeof deviceId !== "string"
    ) {

      return res.status(400).json({
        success: false,
        error: "Invalid request fields"
      });

    }






    if (!isValidNumber(watchTime)) {

      return res.status(400).json({
        success: false,
        error: "watchTime must be a valid number"
      });

    }


    if (watchTime < 0) {

      return res.status(400).json({
        success: false,
        error: "watchTime cannot be negative"
      });

    }



    if (watchTime > 86400) {

      return res.status(400).json({
        success: false,
        error: "Invalid watchTime"
      });

    }






    const normalizedPlatform =
      normalizePlatform(platform);


    if (!normalizedPlatform) {

      return res.status(400).json({
        success: false,
        error:
          "platform must be one of: android, web, apple"
      });

    }






    const video =
      await Video
        .findById(videoId)
        .select("_id duration uploader")
        .lean();


    if (!video) {

      return res.status(404).json({
        success: false,
        error: "Video not found"
      });

    }






    const videoDuration =
      Number(video.duration || 0);


    if (
      !Number.isFinite(videoDuration) ||
      videoDuration <= 0
    ) {

      return res.status(400).json({
        success: false,
        error: "Video duration is invalid"
      });

    }






    const safeWatchTime =
      Math.min(
        Math.max(watchTime, 0),
        videoDuration
      );






    let completionRate =
      safeWatchTime / videoDuration;


    completionRate =
      Math.min(
        1,
        Math.max(
          0,
          completionRate
        )
      );

















    const profile =
      await accountProfile
        .findOne({
          _id: profileId,
          accountId: accountId,
          isActive: true
        })
        .select("_id")
        .lean();


    if (!profile) {

      return res.status(403).json({
        success: false,
        error:
          "Profile does not belong to this account"
      });

    }






    const parser =
      new UAParser(
        req.headers["user-agent"] || ""
      );


    const ua =
      parser.getResult();


    const device =
      ua.device.type ||
      "desktop";


    const os =
      ua.os.name ||
      "unknown";


    const browser =
      ua.browser.name ||
      "unknown";






    const ip =
      getClientIp(req);


    const geo =
      geoip.lookup(ip);


    const country =
      geo?.country ||
      "unknown";


    const city =
      geo?.city ||
      "unknown";






    const referrer =
      req.headers["referer"] ||
      "direct";













    const networkType =
      typeof req.body.networkType === "string"
        ? req.body.networkType
        : "unknown";






    const data = {

      accountId,

      profileId,

      videoId,

      sessionId,

      deviceId,

      watchTime:
        safeWatchTime,

      videoDuration,

      completionRate,

      platform:
        normalizedPlatform,

      device,

      os,

      browser,

      country,

      city,

      referrer,

      networkType,

      createdAt:
        new Date()

    };






    const validationError =
      validateSchema(
        videoViewSchema,
        data
      );


    if (validationError) {

      return res.status(400).json({
        success: false,
        error: validationError
      });

    }






    const views =
      db.collection(
        "video_views_collection"
      );
















    const existingView =
      await views.findOne({
        videoId,
        accountId,
        profileId,
        sessionId
      });


    if (existingView) {

      return res.status(200).json({

        success: true,

        counted: false,

        message:
          "View already counted for this session"

      });

    }






    try {

      await views.insertOne(data);

    } catch (insertError) {











      if (
        insertError.code === 11000
      ) {

        return res.status(200).json({

          success: true,

          counted: false,

          message:
            "View already counted"

        });

      }

      throw insertError;

    }






    await Video.findByIdAndUpdate(
      videoId,
      {
        $inc: {
          "stats.views": 1
        }
      }
    );






    if (video.uploader) {

      await Profile.findByIdAndUpdate(
        video.uploader,
        {
          $inc: {
            totalviews: 1
          }
        }
      );

    }






    return res.status(201).json({

      success: true,

      counted: true,

      message:
        "View stored successfully",



    });


  } catch (error) {

    console.error(
      "postView error:",
      error
    );


    return res.status(500).json({

      success: false,

      error:
        "Failed to store video view"

    });

  }
};


module.exports = {
  postView
};

