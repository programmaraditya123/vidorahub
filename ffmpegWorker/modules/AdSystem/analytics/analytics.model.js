// analytics/analytics.model.js
const mongoose = require('mongoose');

const adAnalyticsDailySchema = new mongoose.Schema({
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  date: { type: String, required: true }, // 'YYYY-MM-DD'
  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  spend: { type: Number, default: 0 },
  ctr: { type: Number, default: 0 }, // clicks / impressions
  avgCpc: { type: Number, default: 0 }, // spend / clicks (for CPC)
  avgCpm: { type: Number, default: 0 }, // (spend / impressions) * 1000 (for CPM)
}, { timestamps: true });

adAnalyticsDailySchema.index({ campaignId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('AdAnalyticsDaily', adAnalyticsDailySchema);
