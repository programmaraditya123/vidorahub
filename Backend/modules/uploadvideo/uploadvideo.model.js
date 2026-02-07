// video.model.js
const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 150,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
    },

    tags: {
      type: [String],
      required: true,
      validate: {
        validator: (v) => v.length > 0,
        message: "At least one tag is required",
      },
    },

    thumbnailUrl: {
      type: String,
      default: null,
    },

    duration: {
      type: Number,  
      default: 0,
    },

    visibility: {
      type: String,
      enum: ["public", "private", "unlisted"],
      default: "public",
    },

    category: {
      type: String,
      default: "general",
    },

    // Reference to user who uploaded / created the video
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userProfile",
      required: true,
      index:true
    },
    isDeleted : {
      type : Boolean,
      default : false,
    },

    stats: {
      views: {
        type: Number,
        default: 0,
      },
      likes: {
        type: Number,
        default: 0,
      },
      dislikes: {
        type: Number,
        default: 0,
      },
      comments: {
        type: Number,
        default: 0,
      },
    },

    videoUrl: {
      type: String,
      required: true, 
    },
    videoSerialNumber : {
      type : Number,

    },
  },
  { timestamps: true }
);

videoSchema.index({ tags: 1 });
videoSchema.index({ category: 1, visibility: 1 });

module.exports = mongoose.model("Video", videoSchema);
