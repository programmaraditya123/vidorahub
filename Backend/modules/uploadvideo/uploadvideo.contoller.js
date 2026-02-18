const mongoose = require("mongoose");
const Video = require('./uploadvideo.model')
const userProfile = require('../auth/auth.model')
const { Storage } = require("@google-cloud/storage");
const { getNextNumber } = require("../counter/counter.controller");
const storage = new Storage({
  projectId: process.env.GOOGLE_PROJECT_ID,
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  },
});

const bucket = storage.bucket("vidorahub");

const getUploadUrlController = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }

    const { fileName, contentType, type, contentCategory } = req.body;

    if (!fileName || !contentType || !type || !contentCategory) {
      return res.status(400).json({
        ok: false,
        message: "fileName, contentType, contentCategory and type are required",
      });
    }

    if (!["video", "vibe"].includes(contentCategory)) {
      return res.status(400).json({
        ok: false,
        message: "Invalid contentCategory",
      });
    }

    if (!["video", "thumbnail"].includes(type)) {
      return res.status(400).json({
        ok: false,
        message: "Invalid type",
      });
    }

    const userId = req.user._id.toString();
    const uniqueFileName = `${Date.now()}-${userId}-${fileName}`;

    let filePath;

    if (type === "thumbnail") {
      filePath = `thumbnails/${contentCategory}s/${uniqueFileName}`;
    } else {
      filePath = `${contentCategory}s/${uniqueFileName}`;
    }

    const file = bucket.file(filePath);

    const [uploadUrl] = await file.getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 15 * 60 * 1000,
      contentType,
    });

    return res.json({
      ok: true,
      uploadUrl,
      publicUrl: `https://storage.googleapis.com/${bucket.name}/${filePath}`,
      filePath,
    });

  } catch (err) {
    console.error("Signed URL error:", err);
    return res.status(500).json({
      ok: false,
      message: "Failed to create upload URL",
    });
  }
};


const UploadVideoController = async (req, res) => {
  let session;
  try {
    if (!req.user?._id) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }

    const {
      title,
      description,
      tags,
      category = "general",
      visibility = "public",
      duration,
      videoUrl,
      thumbnailUrl = null,
      contentType = "video"
    } = req.body;

    if (!title || !description || !tags || !videoUrl || !duration) {
      return res.status(400).json({
        ok: false,
        message: "Missing required fields",
      });
    }

    const normalizeTags = Array.isArray(tags)
      ? tags
      : tags.split(",").map(t => t.trim()).filter(Boolean);

    if (!normalizeTags.length) {
      return res.status(400).json({
        ok: false,
        message: "At least one tag is required",
      });
    }

    session = await mongoose.startSession();
    await session.withTransaction(async () => {
      const [videoDoc] = await Video.create(
        [{
          title: title.trim(),
          description: description.trim(),
          tags: normalizeTags,
          visibility,
          category,
          duration,
          thumbnailUrl,
          uploader: req.user._id,
          videoUrl,
          contentType,
          videoSerialNumber : await getNextNumber("video")
        }],
        { session }
      );

      await userProfile.findByIdAndUpdate(
        req.user._id,
        {
          $push: { uploads: videoDoc._id },
          $inc: { totalvideos: 1 },
          $set: { role: 1, creator: true },
        },
        { session }
      );
    });

    return res.status(201).json({
      ok: true,
      message: "Video uploaded successfully",
    });

  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({
      ok: false,
      message: "Upload failed",
    });
  } finally {
    if (session) session.endSession();
  }
};


const getAllVideosController = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const filter = {
      isDeleted: { $ne: true },
      contentType: "video",
    };

    const [items, total] = await Promise.all([
      Video.find(filter)
        .select("-description -tags -visibility -category -updatedAt -__v -stats.comments -stats.dislikes")
        .populate({ path: "uploader", select: "name _id" })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Video.countDocuments(filter),
    ]);

    const totalPages = Math.max(Math.ceil(total / limit), 1);

    res.json({
      ok: true,
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      items,
    });
  } catch (err) {
    console.error("getAllVideos error:", err);
    res.status(500).json({ ok: false, message: "Failed to load videos" });
  }
};

const getVibesController = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const filter = {
      isDeleted: { $ne: true },
      contentType: "vibe",
    };

    const [items, total] = await Promise.all([
      Video.find(filter)
        .select("-description -tags -visibility -category -updatedAt -__v -stats.comments -stats.dislikes")
        .populate({ path: "uploader", select: "name _id" })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Video.countDocuments(filter),
    ]);

    const totalPages = Math.max(Math.ceil(total / limit), 1);

    res.json({
      ok: true,
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      items,
    });
  } catch (err) {
    console.error("getVibes error:", err);
    res.status(500).json({ ok: false, message: "Failed to load vibes" });
  }
};


module.exports = { UploadVideoController,getAllVideosController,getUploadUrlController,getVibesController}