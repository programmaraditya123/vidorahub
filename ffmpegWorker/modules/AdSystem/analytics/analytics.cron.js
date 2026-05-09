// analytics/analytics.cron.js
// Background jobs:
//   1. Aggregation (every 5 min): roll up Transaction debits into AdAnalyticsDaily.
//   2. Reset (UTC midnight): zero out spentToday on all campaigns.
const cron = require('node-cron');
const { Transaction } = require('../billing/billing.model');
const AdAnalyticsDaily = require('./analytics.model');
const { Campaign } = require('../campaigns/campaign.model'); // used by resetDailySpend

/**
 * Aggregation: rolls up today's impression/click Transactions into one
 * AdAnalyticsDaily row per (campaign, day). Runs every 5 minutes.
 *
 * Groups by `campaignId` (NOT `brandId`). The previous version grouped by
 * brandId and wrote identical brand-totals onto every campaign of that
 * brand, which 5x-inflated stats for brands with multiple campaigns.
 */
async function runAggregation() {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10); // 'YYYY-MM-DD'
  const dayStart = new Date(todayStr + 'T00:00:00.000Z');

  try {
    const pipeline = [
      {
        $match: {
          type: 'debit',
          refType: { $in: ['impression', 'click'] },
          campaignId: { $ne: null },
          createdAt: { $gte: dayStart, $lt: now },
        },
      },
      {
        $group: {
          _id: { campaignId: '$campaignId', refType: '$refType' },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ];

    const rows = await Transaction.aggregate(pipeline);

    // Fold into per-campaign totals.
    const perCampaign = new Map();
    for (const row of rows) {
      const campaignKey = String(row._id.campaignId);
      const bucket = perCampaign.get(campaignKey) || { impressions: 0, clicks: 0, spend: 0 };
      if (row._id.refType === 'impression') {
        bucket.impressions += row.count;
      } else if (row._id.refType === 'click') {
        bucket.clicks += row.count;
      }
      bucket.spend += row.totalAmount;
      perCampaign.set(campaignKey, bucket);
    }

    // Upsert one row per campaign per day.
    const upserts = [];
    for (const [campaignId, stats] of perCampaign.entries()) {
      const { impressions, clicks, spend } = stats;
      const ctr = impressions > 0 ? clicks / impressions : 0;
      const avgCpc = clicks > 0 ? spend / clicks : 0;
      const avgCpm = impressions > 0 ? (spend / impressions) * 1000 : 0;

      upserts.push(
        AdAnalyticsDaily.findOneAndUpdate(
          { campaignId, date: todayStr },
          { $set: { impressions, clicks, spend, ctr, avgCpc, avgCpm } },
          { upsert: true, new: true }
        )
      );
    }
    await Promise.all(upserts);

    console.log(
      `✅ Ad analytics aggregation complete for ${todayStr} (${perCampaign.size} campaigns) at ${now.toISOString()}`
    );
  } catch (err) {
    console.error('❌ Ad analytics aggregation failed:', err.message);
  }
}

/**
 * UTC-midnight job:
 *   1. Reset spentToday for every campaign.
 *   2. Revive campaigns that were 'exhausted' purely because of yesterday's
 *      daily-budget cap. Lifetime-budget-exhausted campaigns stay exhausted
 *      (they need a topup or a bigger lifetime budget). Insufficient-funds
 *      revival is handled by topup() itself.
 *
 * A campaign is "daily-only exhausted" if:
 *   - status === 'exhausted'
 *   - lifetimeBudget === 0 (no lifetime cap), OR spentTotal < lifetimeBudget
 */
async function resetDailySpend() {
  try {
    await Campaign.updateMany({}, { $set: { spentToday: 0, spentResetAt: new Date() } });

    const reviveResult = await Campaign.updateMany(
      {
        status: 'exhausted',
        $or: [
          { lifetimeBudget: { $lte: 0 } },
          { $expr: { $lt: ['$spentTotal', '$lifetimeBudget'] } },
        ],
      },
      { $set: { status: 'approved' } }
    );

    console.log(
      `✅ Daily spend reset complete. Revived ${reviveResult.modifiedCount || 0} exhausted campaigns.`
    );
  } catch (err) {
    console.error('❌ Daily spend reset failed:', err.message);
  }
}

let aggregationTask = null;
let resetTask = null;

function startCronJobs() {
  aggregationTask = cron.schedule('*/5 * * * *', runAggregation);
  resetTask = cron.schedule('0 0 * * *', resetDailySpend); // midnight UTC
  console.log('✅ Ad analytics cron jobs started (aggregation: 5min, reset: midnight UTC)');
}

function stopCronJobs() {
  if (aggregationTask) aggregationTask.stop();
  if (resetTask) resetTask.stop();
}

module.exports = { runAggregation, resetDailySpend, startCronJobs, stopCronJobs };
