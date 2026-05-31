const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userProfile",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
    },

    category: {
      type: String,
      required: true,
    },

    tags: [String],

    brand: {
      type: String,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      enum: ["INR", "USD", "EUR"],
      default: "INR",
    },
    images: [
      {
        type: String,
      },
    ],
    status : {
        type : String,
        enum : ["active","inactive"]
    },
    shippingRequired: {
      type: Boolean,
      default: true,
    },
    analytics: {
      views: {
        type: Number,
        default: 0,
      },

      clicks: {
        type: Number,
        default: 0,
      },

      purchases: {
        type: Number,
        default: 0,
      },
    },

    rating: {
      average: {
        type: Number,
        default: 0,
      },

      count: {
        type: Number,
        default: 0,
      },
    },
   
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);