const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userProfile",
      required: true,
    },

    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userProfile",
      required: true,
    },

    userSerialNumber: {
      type: Number,
      required: true,
    },

    creatorSerialNumber: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate subscription
subscriptionSchema.index(
  { userSerialNumber: 1, creatorSerialNumber: 1 },
  { unique: true }
);

module.exports = mongoose.model("Subscription", subscriptionSchema);
