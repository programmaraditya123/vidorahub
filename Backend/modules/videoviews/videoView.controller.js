const db = require("../../config/db2");
const validateSchema = require("./utils/validateSchema");
const videoViewSchema = require("./videoView.schema");

const Profile = require("../auth/auth.model");
const Video = require("../uploadvideo/uploadvideo.model");

const UAParser = require("ua-parser-js");
const geoip = require("geoip-lite");

const postView = async (req, res) => {
  try {
    const { videoId, watchTime, sessionId } = req.body;

    if (!videoId || !watchTime || !sessionId) {
      return res.status(400).json({ error: "videoId, watchTime, sessionId required" });
    }

    // 1️⃣ Find video
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ error: "Video Not Found" });
    }

    const views = db.collection("video_views_collection");

    // 2️⃣ Prevent duplicate view
    const existingView = await views.findOne({ videoId, sessionId });
    if (existingView) {
      return res.json({ message: "View already counted for this session" });
    }

    // 3️⃣ Auto detect device/os/browser
    const parser = new UAParser(req.headers["user-agent"]);
    const ua = parser.getResult();

    const device = ua.device.type || "desktop";
    const os = ua.os.name || "unknown";
    const browser = ua.browser.name || "unknown";

    // 4️⃣ IP → country/city
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress;

    const geo = geoip.lookup(ip);
    const country = geo?.country || "unknown";
    const city = geo?.city || "unknown";

    // 5️⃣ Calculate completion rate
    const videoDuration = video.duration || 0;
    const completionRate =
      videoDuration > 0 ? watchTime / videoDuration : 0;

    // 6️⃣ Referrer
    const referrer = req.headers["referer"] || "direct";

    // 7️⃣ Build FULL data object
    const data = {
      videoId,
      userId: req.user?._id ? req.user._id.toString() : undefined,
      sessionId,

      watchTime,
      videoDuration,
      completionRate,

      device,
      os,
      browser,

      country,
      city,

      referrer,
      networkType: "unknown"
    };

    // ✅ VALIDATE FINAL OBJECT (not req.body)
    const error = validateSchema(videoViewSchema, data);
    if (error) {
      return res.status(400).json({ error });
    }

    // 8️⃣ Store view event
    await views.insertOne(data);

    // 9️⃣ Update counters
    await Video.findByIdAndUpdate(videoId, {
      $inc: { "stats.views": 1 }
    });

    await Profile.findByIdAndUpdate(video.uploader, {
      $inc: { totalviews: 1 }
    });

    res.json({ message: "View stored successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { postView };






// const db = require("../../config/db2")
// const validateSchema = require("./utils/validateSchema")
// const videoViewSchema = require("./videoView.schema")
// const Profile = require('../auth/auth.model')
// const Video = require('../uploadvideo/uploadvideo.model')


// const postView = async (req,res) => {
//     try {
//         const error = validateSchema(videoViewSchema,req.body)
//         if(error){
//             return res.status(400).json({error})
//         }

//         const {videoId} = req.body;

//         const video = await Video.findById(videoId)
//         if(!video){
//             return res.status(404).json({error : "Video Not Found"})
//         }

//         const views = db.collection("video_views_collection")

//         const data = {
//             ...req.body,
//             // timestamp : new Date(req.body.timestamp || Date.now())
//             timestamp: new Date()
//         }

//         await views.insertOne(data);

//         await Video.findByIdAndUpdate(videoId,{$inc: {"stats.views" : 1}})

//         await Profile.findByIdAndUpdate(video.uploader,{$inc : {totalviews : 1}})

//         res.json({message : 'video view stored & counters updated successfully'})
        
//     } catch (error) {
//         res.status(500).json({error : error.message})
        
//     }
// }

// module.exports = {postView}