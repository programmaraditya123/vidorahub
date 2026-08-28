const mongoose = require("mongoose");

const videoProgressSchema = new mongoose.Schema(
    {


        accountId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "userProfile",
            required: true,
        },

        profileId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "accountprofile",
            required: true,
        },


        videoId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "video",
            required: true,
        },


        
        position: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },

        
        duration: {
            type: Number,
            min: 0,
            default: null,
        },

        
        percent: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },



        isCompleted: {
            type: Boolean,
            default: false,
        },

        
        lastPlayedAt: {
            type: Date,
            default: Date.now,
            index: true,
        },



        playbackSpeed: {
            type: Number,
            min: 0.25,
            max: 4,
            default: 1,
        },

        muted: {
            type: Boolean,
            default: false,
        },


        progressVersion: {
            type: Number,
            default: 1,
        },
        clientProgressAt: {
            type: Number,
            required: true,
            default: 0
        }
    },
    {
        timestamps: true,

        
        strict: true,

        
        versionKey: false,
    }
);


videoProgressSchema.index(
    {
        profileId: 1,
        videoId: 1,
    },
    {
        unique: true,
        name: "unique_profile_video_progress",
    }
);


videoProgressSchema.index(
    {
        profileId: 1,
        lastPlayedAt: -1,
    },
    {
        name: "profile_continue_watching",
    }
);


videoProgressSchema.index(
    {
        profileId: 1,
        isCompleted: 1,
        lastPlayedAt: -1,
    },
    {
        name: "profile_completed_videos",
    }
);


module.exports = mongoose.model(
    "videoProgress",
    videoProgressSchema
);