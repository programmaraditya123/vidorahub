const mongoose = require("mongoose");

const userProfileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    profilePicUrl: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    platforms: [
      {
        platform: {
          type: String,
          trim: true,
        },
        url: {
          type: String,
          trim: true,
        },
        audience: {
          type: Number,
          default: 0,
        },
      },
    ],
    showCaseContent: [
      {
        thumbnailUrl: {
          type: String,
          trim: true,
        },
        title: {
          type: String,
          trim: true,
        },
        platform: {
          type: String,
          trim: true,
        },
        link: {
          type: String,
          trim: true,
        },
        views: {
          type: Number,
          default: 0,
        },
      },
    ],
    experience: [
      {
        name: {
          type: String,
          trim: true,
        },
        campaign: {
          type: String,
          trim: true,
        },
        status: {
          type: String,
          trim: true,
        },
        deliverables: {
          type: String,
          trim: true,
        },
      },
    ],
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
    },
    address: {
      type: String,
    },
    subscriber: {
      type: Number,
      default: 0,
    },
    creator: {
      type: Boolean,
      default: false,
    },
    channelname: {
      type: String,
    },
    totalviews: {
      type: Number,
      default: 0,
    },
    totalvideos: {
      type: Number,
      default: 0,
    },
    uploads: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    role: {
      type: Number,
      enum: [0, 1, 2, 3], //0 = user, 1 = creator, 2 = admin , 3 = brand
      default: 0,
    },
    userSerialNumber: {
      type: Number,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("userProfile", userProfileSchema);
