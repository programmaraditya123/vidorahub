const mongoose = require('mongoose')

const saveVideoSchema = new mongoose.Schema(
    {
        accountId : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "userProfile",
            required : true,
            index : true
        },
        profileId : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "accountprofile",
            required : true,
            index : true
        },
        videoId : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "video",
            required : true,
            index : true
        },
    },
    {
        timestamps : true
    }
)

saveVideoSchema.index(
    {
        accountId: 1,
        videoId: 1,
    },
    {
        unique: true,
        name: "unique_account_saved_video",
    }
);

saveVideoSchema.index(
    {
        accountId: 1,
        createdAt: -1,
        _id: -1,
    },
    {
        name: "account_saved_videos_pagination",
    }
);

module.exports = mongoose.model("saveVideo",saveVideoSchema)