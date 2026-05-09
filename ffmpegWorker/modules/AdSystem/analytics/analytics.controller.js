// analytics/analytics.controller.js
// Records ad events (impressions/clicks) with idempotency + atomic billing deduction
// + Astra mirroring for analytics warehouse.
const mongoose = require('mongoose');

const { getImpressionsCol, getClicksCol, getIdempotencyCol } = require('./analytics.helper');
const { deduct } = require('../billing/billing.helper');
const { Transaction } = require('../billing/billing.model');
const { checkAndIncrement } = require('../delivery/frequency.helper');
const { Campaign } = require('../campaigns/campaign.model');
const { Creative } = require('../creatives/creative.model');

function isDuplicateKeyError(error) {
  return Boolean(error && error.code === 11000);
}

function buildMinuteBucket(timestampMs) {
  return Math.floor(timestampMs / 60000);
}

function buildImpressionIdempotencyKey(userId, adId, minuteBucket) {
  return `${userId}:${adId}:${minuteBucket}`;
}

function buildClickIdempotencyKey(userId, adId, minuteBucket) {
  return `click_${userId}:${adId}:${minuteBucket}`;
}

async function findEligibleCampaign(adId) {
  if (!mongoose.Types.ObjectId.isValid(adId)) {
    return null;
  }

  return Campaign.findById(adId).lean();
}

async function findCreativeForCampaign(creativeId, campaignId) {
  if (!mongoose.Types.ObjectId.isValid(creativeId)) {
    return null;
  }

  return Creative.findOne({ _id: creativeId, campaignId }).lean();
}

async function claimFreeEventIdempotency(brandId, campaignId, eventType, creativeId, idempotencyKey) {
  try {
    await Transaction.create({
      brandId,
      campaignId,
      type: 'debit',
      amount: 0,
      refType: eventType,
      refId: String(creativeId),
      idempotencyKey,
      balanceAfter: null,
      reason: 'free_event_marker',
    });

    return { ok: true };
  } catch (createMarkerError) {
    if (isDuplicateKeyError(createMarkerError)) {
      return { ok: false, reason: 'duplicate' };
    }

    throw createMarkerError;
  }
}

async function claimBillingOrIdempotency({ brandId, amount, eventType, creativeId, campaignId, idempotencyKey }) {
  if (amount > 0) {
    // Pass campaignId so deduct() atomically bumps spentToday/spentTotal
    // alongside the ledger debit. This prevents desync if the process
    // crashes between billing and the campaign update.
    return deduct(brandId, amount, eventType, String(creativeId), idempotencyKey, campaignId);
  }

  return claimFreeEventIdempotency(brandId, campaignId, eventType, creativeId, idempotencyKey);
}

async function mirrorEventToAstra(collectionFactory, eventDocument) {
  try {
    const idempotencyCollection = getIdempotencyCol();
    const eventCollection = collectionFactory();

    await idempotencyCollection.insertOne({
      _id: eventDocument._id,
      expireAt: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(),
      eventType: eventDocument.eventType,
    });

    await eventCollection.insertOne(eventDocument);
  } catch (astraError) {
    console.warn(`⚠️  AstraDB ${eventDocument.eventType} write failed (non-critical):`, astraError.message);
  }
}

function validateEventBody(req, res) {
  const { adId, creativeId, userId } = req.body || {};

  if (!adId || !creativeId || !userId) {
    res.status(400).json({ error: 'adId, creativeId, userId required' });
    return null;
  }

  return { adId, creativeId, userId };
}

/**
 * POST /api/v1/ads/event/impression
 * Body: { adId, creativeId, userId, country?, device? }
 */
exports.recordImpression = async (req, res) => {
  try {
    const validatedBody = validateEventBody(req, res);
    if (!validatedBody) {
      return undefined;
    }

    const { adId, creativeId, userId } = validatedBody;
    const eventTimestampMs = Date.now();
    const minuteBucket = buildMinuteBucket(eventTimestampMs);
    const idempotencyKey = buildImpressionIdempotencyKey(userId, adId, minuteBucket);

    const campaign = await findEligibleCampaign(adId);
    if (!campaign || campaign.status !== 'approved') {
      return res.status(404).json({ error: 'campaign not found or not active' });
    }

    const creative = await findCreativeForCampaign(creativeId, campaign._id);
    if (!creative) {
      return res.status(404).json({ error: 'creative not found for campaign' });
    }

    const impressionCost = campaign.pricingModel === 'CPM' ? campaign.bid / 1000 : 0;
    const billingResult = await claimBillingOrIdempotency({
      brandId: campaign.brandId,
      amount: impressionCost,
      eventType: 'impression',
      creativeId: creative._id,
      campaignId: campaign._id,
      idempotencyKey: `imp_${idempotencyKey}`,
    });

    if (!billingResult.ok) {
      if (billingResult.reason === 'duplicate') {
        return res.status(200).json({ success: true, duplicate: true, message: 'already recorded' });
      }

      if (billingResult.reason === 'insufficient_funds') {
        await Campaign.updateOne({ _id: campaign._id }, { $set: { status: 'exhausted' } });
        return res.status(402).json({ error: 'campaign budget exhausted' });
      }
    }

    const frequencyStatus = await checkAndIncrement(userId, String(campaign._id), campaign.frequencyCapPerDay || 3);

    // spentToday/spentTotal already incremented atomically inside deduct().
    // Only the per-creative impression counter remains.
    await Creative.updateOne({ _id: creative._id }, { $inc: { 'stats.impressions': 1 } });

    void mirrorEventToAstra(getImpressionsCol, {
      _id: idempotencyKey,
      eventType: 'impression',
      adId: String(campaign._id),
      campaignId: String(campaign._id),
      creativeId: String(creative._id),
      userId,
      ts: eventTimestampMs,
      minuteBucket,
      country: req.body.country || null,
      device: req.body.device || null,
    });

    return res.status(200).json({
      success: true,
      duplicate: false,
      frequencyCapReached: frequencyStatus.allowed === false,
    });
  } catch (recordImpressionError) {
    return res.status(500).json({ error: recordImpressionError.message });
  }
};

/**
 * POST /api/v1/ads/event/click
 * Body: { adId, creativeId, userId, impressionId? }
 */
exports.recordClick = async (req, res) => {
  try {
    const validatedBody = validateEventBody(req, res);
    if (!validatedBody) {
      return undefined;
    }

    const { adId, creativeId, userId } = validatedBody;
    const eventTimestampMs = Date.now();
    const minuteBucket = buildMinuteBucket(eventTimestampMs);
    const idempotencyKey = buildClickIdempotencyKey(userId, adId, minuteBucket);

    const campaign = await findEligibleCampaign(adId);
    if (!campaign || campaign.status !== 'approved') {
      return res.status(404).json({ error: 'campaign not found or not active' });
    }

    const creative = await findCreativeForCampaign(creativeId, campaign._id);
    if (!creative) {
      return res.status(404).json({ error: 'creative not found for campaign' });
    }

    const clickCost = campaign.pricingModel === 'CPC' ? campaign.bid : 0;
    const billingResult = await claimBillingOrIdempotency({
      brandId: campaign.brandId,
      amount: clickCost,
      eventType: 'click',
      creativeId: creative._id,
      campaignId: campaign._id,
      idempotencyKey,
    });

    if (!billingResult.ok) {
      if (billingResult.reason === 'duplicate') {
        return res.status(200).json({ success: true, duplicate: true, message: 'already recorded' });
      }

      if (billingResult.reason === 'insufficient_funds') {
        await Campaign.updateOne({ _id: campaign._id }, { $set: { status: 'exhausted' } });
        return res.status(402).json({ error: 'campaign budget exhausted' });
      }
    }

    // spentToday/spentTotal already incremented atomically inside deduct().
    await Creative.updateOne({ _id: creative._id }, { $inc: { 'stats.clicks': 1 } });

    void mirrorEventToAstra(getClicksCol, {
      _id: idempotencyKey,
      eventType: 'click',
      adId: String(campaign._id),
      campaignId: String(campaign._id),
      creativeId: String(creative._id),
      userId,
      impressionId: req.body.impressionId || null,
      ts: eventTimestampMs,
      minuteBucket,
    });

    return res.status(200).json({ success: true, duplicate: false });
  } catch (recordClickError) {
    return res.status(500).json({ error: recordClickError.message });
  }
};
