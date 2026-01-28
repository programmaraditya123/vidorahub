const mongoose = require("mongoose");
const { uploadToGCS } = require("./uploadvideo.helper");
const Video = require('./uploadvideo.model')
const userProfile = require('../auth/auth.model')
const { getVideoDurationInSeconds } = require("get-video-duration");
const fs = require("fs");


const UploadVideoController = async (req, res) => {
    let session;
    try {
        if (!req.user?._id) {
            return res.status(401).json({ ok: false, message: "Unauthorized" });
        }

        if (!req.files?.video?.[0]) {
            return res.status(400).json({ ok: false, message: "No video uploaded" });
        }

        const videoFile = req.files.video[0];
        const thumbnailFile = req.files.thumbnail?.[0]; // optional

        const {
            title,
            description,
            tags,
            category = "general",
            visibility = "public",
        } = req.body;

        if (!title || !description || !tags) {
            return res.status(400).json({
                ok: false,
                message: "Title, Description & Tags are required",
            });
        }

        // Normalize tags
        const normalizeTags = Array.isArray(tags)
            ? tags
            : tags.split(",").map(t => t.trim()).filter(Boolean);

        if (normalizeTags.length === 0) {
            return res.status(400).json({
                ok: false,
                message: "At least one tag is required",
            });
        }

        // VIDEO DURATION
        // const tempStream = bufferToStream(videoFile.buffer);
        const tempStream = fs.createReadStream(videoFile.path)
        const duration = await getVideoDurationInSeconds(tempStream);

        // UPLOAD VIDEO TO GCS
        const videoUrl = await uploadToGCS(videoFile, {
            prefix: `users/${req.user._id}/videos/`,
            makePublic: true,
        });

        // UPLOAD THUMBNAIL (if provided)
        let thumbnailUrl = null;
        if (thumbnailFile) {
            thumbnailUrl = await uploadToGCS(thumbnailFile, {
                prefix: `users/${req.user._id}/thumbnails/`,
                makePublic: true,
            });
        }

        // SAVE IN DATABASE
        session = await mongoose.startSession();
        await session.withTransaction(async () => {
            const [videoDoc] = await Video.create(
                [
                    {
                        title: title.trim(),
                        description: description.trim(),
                        tags: normalizeTags,
                        visibility,
                        category,
                        duration,
                        thumbnailUrl,
                        uploader: req.user._id,
                        videoUrl,
                    },
                ],
                { session }
            );

            await userProfile.findByIdAndUpdate(
                req.user._id,
                {
                    $push: { uploads: videoDoc._id },
                    $inc: { totalvideos: 1 },
                    $set : {role : 1 , creator : true}
                },
                { session }
            );

            
        });
        return res.status(201).json({
                ok: true,
                message: "Video uploaded successfully",
                // video: videoDoc,
            });

    } catch (error) {
        console.error("Upload error:", error);
        return res.status(500).json({
            ok: false,
            message: error || "Upload failed",
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

module.exports = { UploadVideoController,getAllVideosController}