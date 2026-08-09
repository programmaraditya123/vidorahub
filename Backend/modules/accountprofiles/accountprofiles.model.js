const mongoose = require("mongoose");

const accountProfileSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userProfile",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },

    profilePicUrl: {
      type: String,
      trim: true,
    },

    
    profileType: {
      type: String,
      enum: [
        "adult",
        "kids",
        "teen",
        "custom",
      ],
      default: "adult",
      index: true,
    },
    dateOfBirth: {
      type: Date,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    isKidsProfile: {
      type: Boolean,
      default: false,
    },
    languages: [
      {
        type: String,
        trim: true,
      },
    ],
    preferredCategories: [
      {
        type: String,
        trim: true,
      },
    ], 
    preferredTags: [
      {
        type: String,
        trim: true,
      },
    ],

    
    contentPreferences: {
      allowMatureContent: {
        type: Boolean,
        default: false,
      },

      allowShortVideos: {
        type: Boolean,
        default: true,
      },

      allowLongVideos: {
        type: Boolean,
        default: true,
      },
    },

    
    recommendationSettings: {
      personalizedRecommendations: {
        type: Boolean,
        default: true,
      },

      useWatchHistory: {
        type: Boolean,
        default: true,
      },

      useSearchHistory: {
        type: Boolean,
        default: true,
      },
    },
    recommendation: {
      embeddingVersion: {
        type: String,
      },

      featureVersion: {
        type: String,
      },

      lastFeatureUpdateAt: {
        type: Date,
      },

      lastEmbeddingUpdateAt: {
        type: Date,
      },
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    pinHash: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("accountProfile",accountProfileSchema)