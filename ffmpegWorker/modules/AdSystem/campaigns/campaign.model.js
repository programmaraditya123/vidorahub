// campaigns/campaign.model.js
const mongoose = require('mongoose');

const { Schema } = mongoose;
const { ObjectId } = Schema.Types;

const CampaignSchema = new Schema(
  {
    brandId: { type: ObjectId, ref: 'userProfile', required: true },
    name: { type: String, required: true },
    pricingModel: { type: String, enum: ['CPC', 'CPM'], required: true },
    bid: { type: Number, min: 0, required: true },
    dailyBudget: { type: Number, default: 0 },
    lifetimeBudget: { type: Number, default: 0 },
    spentToday: { type: Number, default: 0 },
    spentTotal: { type: Number, default: 0 },
    spentResetAt: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'paused', 'exhausted'],
      default: 'pending',
    },
    targeting: {
      countries: [String],
      minAge: Number,
      maxAge: Number,
      genders: [String],
      deviceTypes: [String],
      tags: [String],
    },
    frequencyCapPerDay: { type: Number, default: 3 },
    rejectReason: { type: String },
  },
  { timestamps: true }
);

CampaignSchema.index({ status: 1, brandId: 1 });
CampaignSchema.index({ status: 1, 'targeting.countries': 1 });

const Campaign = mongoose.model('Campaign', CampaignSchema);

module.exports = { Campaign };
