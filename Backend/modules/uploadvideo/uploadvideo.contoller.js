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

    const { fileName, contentType, type } = req.body;

    if (!fileName || !contentType || !type) {
      return res.status(400).json({
        ok: false,
        message: "fileName, contentType and type are required",
      });
    }

    const folder = type === "thumbnail" ? "thumbnails" : "videos";
    const filePath = `users/${req.user._id}/-${fileName}`;

    const file = bucket.file(filePath);

    const [uploadUrl] = await file.getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType,
    });

    return res.json({
      uploadUrl,
      publicUrl: `https://storage.googleapis.com/${bucket.name}/${filePath}`,
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

        const filter = { isDeleted: { $ne: true } };


        const [items, total] = await Promise.all([
            Video.find(filter)
                .select("-description -tags -visibility -category -updatedAt -__v -stats.comments -stats.dislikes")
                .populate({path : "uploader" , select : "name _id"})
                .sort({ createdAt: -1 })    
                .skip(skip)
                .limit(limit)
                .lean(),
            Video.countDocuments(filter)
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
        console.error('getAllVideos error:', err);
        res.status(500).json({ ok: false, message: 'Failed to load videos' });

    }
}

module.exports = { UploadVideoController,getAllVideosController,getUploadUrlController}