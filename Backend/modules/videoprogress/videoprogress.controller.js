
const mongoose = require("mongoose");
const videoProgress = require("./videoprogress.model");

const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};


const parseFiniteNumber = (value) => {
    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : null;
};






















const sendVideoProgress = async (req, res) => {

    try {

        if (!req.user || !req.user._id) {

            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });

        }


        const accountId = req.user._id;

        const {
            profileId,
            videoId,
            position,
            duration,
            clientProgressAt,
            playbackSpeed,
            muted
        } = req.body;


        
        
        

        if (!profileId || !isValidObjectId(profileId)) {

            return res.status(400).json({
                success: false,
                message: "Invalid profileId"
            });

        }


        if (!videoId || !isValidObjectId(videoId)) {

            return res.status(400).json({
                success: false,
                message: "Invalid videoId"
            });

        }


        
        
        

        const parsedPosition = parseFiniteNumber(position);

        if (
            parsedPosition === null ||
            parsedPosition < 0
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid video position"
            });

        }


        
        
        

        const parsedDuration =
            duration !== undefined &&
            duration !== null &&
            duration !== ""
                ? parseFiniteNumber(duration)
                : null;


        if (
            parsedDuration !== null &&
            parsedDuration <= 0
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid video duration"
            });

        }


        
        
        

        const parsedClientProgressAt =
            parseFiniteNumber(clientProgressAt);


        if (
            parsedClientProgressAt === null ||
            parsedClientProgressAt <= 0
        ) {

            return res.status(400).json({
                success: false,
                message: "clientProgressAt is required"
            });

        }


        
        
        

        let safePosition = parsedPosition;


        if (parsedDuration !== null) {

            safePosition = Math.min(
                safePosition,
                parsedDuration
            );

        }


        
        
        

        let percent = 0;

        if (parsedDuration !== null && parsedDuration > 0) {

            percent =
                (safePosition / parsedDuration) * 100;

        }


        percent = Math.min(
            100,
            Math.max(0, percent)
        );


        
        
        
        
        
        
        
        
        
        

        const isCompleted =
            parsedDuration !== null &&
            (
                safePosition >= parsedDuration * 0.95
            );


        
        
        

        let safePlaybackSpeed = 1;

        if (
            playbackSpeed !== undefined &&
            playbackSpeed !== null
        ) {

            const parsedSpeed =
                parseFiniteNumber(playbackSpeed);

            if (
                parsedSpeed === null ||
                parsedSpeed < 0.25 ||
                parsedSpeed > 4
            ) {

                return res.status(400).json({
                    success: false,
                    message: "Invalid playbackSpeed"
                });

            }

            safePlaybackSpeed = parsedSpeed;

        }


        let safeMuted = false;

        if (muted !== undefined) {

            if (typeof muted !== "boolean") {

                return res.status(400).json({
                    success: false,
                    message: "muted must be boolean"
                });

            }

            safeMuted = muted;

        }


        
        
        
        
        
        
        
        
        
        
        
        

        const filter = {
            profileId,
            videoId,

            $or: [
                {
                    clientProgressAt: {
                        $lt: parsedClientProgressAt
                    }
                },
                {
                    clientProgressAt: {
                        $exists: false
                    }
                }
            ]
        };


        const update = {

            $set: {

                accountId,

                position: safePosition,

                duration: parsedDuration,

                percent,

                isCompleted,

                clientProgressAt:
                    parsedClientProgressAt,

                lastPlayedAt: new Date(),

                playbackSpeed:
                    safePlaybackSpeed,

                muted:
                    safeMuted

            }

        };


        const updatedProgress =
            await videoProgress.findOneAndUpdate(
                filter,
                update,
                {
                    upsert: true,
                    new: true,
                    setDefaultsOnInsert: true,
                    runValidators: true
                }
            ).lean();


        
        
        

        if (!updatedProgress) {

            const currentProgress =
                await videoProgress
                    .findOne({
                        profileId,
                        videoId
                    })
                    .select(
                        "position duration percent isCompleted lastPlayedAt clientProgressAt"
                    )
                    .lean();


            return res.status(200).json({
                success: true,
                updated: false,
                message: "Older progress ignored",
                data: currentProgress
            });

        }


        
        
        

        return res.status(200).json({

            success: true,

            updated: true,

            message: "Video progress saved successfully",

            data: updatedProgress

        });


    } catch (error) {

        console.error(
            "sendVideoProgress error:",
            error
        );


        
        
        

        if (error.code === 11000) {

            return res.status(409).json({
                success: false,
                message: "Video progress conflict"
            });

        }


        
        
        

        if (error.name === "ValidationError") {

            return res.status(400).json({
                success: false,
                message: "Invalid video progress data"
            });

        }


        return res.status(500).json({
            success: false,
            message: "Failed to save video progress"
        });

    }
};











const getVideoProgress = async (req, res) => {

    try {

        
        
        

        if (!req.user || !req.user._id) {

            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });

        }


        const accountId = req.user._id;


        
        
        

        const {
            profileId,
            videoId
        } = req.query;


        
        
        

        if (!profileId || !isValidObjectId(profileId)) {

            return res.status(400).json({
                success: false,
                message: "Invalid profileId"
            });

        }


        
        
        

        if (!videoId || !isValidObjectId(videoId)) {

            return res.status(400).json({
                success: false,
                message: "Invalid videoId"
            });

        }


        
        
        

        const progress =
            await videoProgress
                .findOne({
                    accountId,
                    profileId,
                    videoId
                })
                .select(
                    "profileId videoId position duration percent isCompleted lastPlayedAt playbackSpeed muted"
                )
                .lean();


        
        
        

        if (!progress) {

            return res.status(200).json({

                success: true,

                exists: false,

                message: "No video progress found",

                data: null

            });

        }


        
        
        

        return res.status(200).json({

            success: true,

            exists: true,

            data: progress

        });


    } catch (error) {

        console.error(
            "getVideoProgress error:",
            error
        );


        return res.status(500).json({

            success: false,

            message: "Failed to get video progress"

        });

    }
};



module.exports = {
    sendVideoProgress,
    getVideoProgress
};

