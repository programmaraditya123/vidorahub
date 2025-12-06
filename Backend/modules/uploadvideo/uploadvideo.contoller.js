const mongoose = require("mongoose");
const { uploadToGCS } = require("./uploadvideo.helper");
const Video = require('./uploadvideo.model')
const userProfile = require('../auth/auth.model')


const UploadVideoController = async (req, res) => {
    try {
        if (!req.user._id) {
            return res.status(401).json({ ok: false, message: "unauthorized" })

        }

        console.log('content-type:', req.headers['content-type']);
        console.log('req.body keys:', Object.keys(req.body || {}));
        console.log('req.file present?:', !!req.file);

        if (!req.file) {
            return res.status(400).json({ ok: false, message: "No video file uploaded" })
        }
        const { title, description, tags, category = 'general', visibilty = 'public' } = req.body;
        if (!title || !description || !tags) {
            return res.status(400).json({
                success: false,
                message: "Title,Descrition,Tags are required"
            })
        }

        const normalizeTags = Array.isArray(tags)
            ? tags
            : String(tags)
                .split(',')
                .map(s => s.trim())
                .filter(Boolean)

        if (normalizeTags.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Atleast on tag is required"
            })
        }

        const videoUrl = await uploadToGCS(req.file, {
            prefix: `users/${req.user._id}/videos/`,
            makePublic: true,
            resumable: true
        })

        let videoDoc;

        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            videoDoc = await Video.create([{
                title: String(title).trim(),
                description: String(description).trim(),
                tags: normalizeTags,
                // duration: duration ? Number(duration) : 0,
                visibilty,
                category,
                uploader: req.user._id,
                videoUrl,
            }], { session });

            videoDoc = videoDoc[0]

            await userProfile.findByIdAndUpdate(
                req.user._id,
                {
                    $push: { uploads: videoDoc._id },
                    $inc: { totalvideos: 1 }
                },
                { session }
            )
        })
        session.endSession()
        console.log("Video uploaded successfully")

        return res.status(201).json({
            ok: true,
            message: 'Video uploaded successfully',
            video: videoDoc,
        });


    } catch (error) {
        console.error('Upload error:', error);
        // Multer errors typically come as err.message
        return res.status(500).json({
            ok: false,
            message: error?.message || 'Failed to upload video',
        });

    }
}

const getAllVideosController = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            Video.find({})
                .sort({ createdAt: -1 })   // newest first
                .skip(skip)
                .limit(limit)
                .lean(),
            Video.countDocuments({})
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