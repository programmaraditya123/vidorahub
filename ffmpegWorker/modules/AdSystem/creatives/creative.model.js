// creatives/creative.model.js
const mongoose = require('mongoose');

const { Schema } = mongoose;
const { ObjectId } = Schema.Types;

const CreativeSchema = new Schema(
  {
    campaignId: { type: ObjectId, ref: 'Campaign', required: true },
    title: { type: String, required: true },
    description: String,
    ctaText: String,
    ctaUrl: String,
    mediaType: { type: String, enum: ['image', 'video'] },
    mediaUrl: { type: String, required: true },
    tags: [String],
    stats: {
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

CreativeSchema.index({ campaignId: 1 });

const Creative = mongoose.model('Creative', CreativeSchema);

module.exports = { Creative };
