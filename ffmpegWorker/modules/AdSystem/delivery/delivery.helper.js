// delivery/delivery.helper.js
// Ad selection engine: filter approved+budgeted+targeted campaigns,
// score creatives, apply frequency cap, return top-N.
const { Campaign } = require('../campaigns/campaign.model');
const { Creative } = require('../creatives/creative.model');
const { peek } = require('./frequency.helper');

function normalizeTextList(rawValues) {
  if (!Array.isArray(rawValues)) return [];
  return rawValues
    .map((rawValue) => String(rawValue).trim().toLowerCase())
    .filter(Boolean);
}

function hasListOverlap(leftValues, rightValues) {
  if (!leftValues.length || !rightValues.length) return false;
  const rightSet = new Set(rightValues);
  return leftValues.some((leftValue) => rightSet.has(leftValue));
}

function isBudgetAvailable(campaignRecord) {
  const hasDailyBudget = Number(campaignRecord.dailyBudget) > 0;
  const hasLifetimeBudget = Number(campaignRecord.lifetimeBudget) > 0;
  const withinDailyBudget = !hasDailyBudget || Number(campaignRecord.spentToday) < Number(campaignRecord.dailyBudget);
  const withinLifetimeBudget = !hasLifetimeBudget || Number(campaignRecord.spentTotal) < Number(campaignRecord.lifetimeBudget);
  return withinDailyBudget && withinLifetimeBudget;
}

function matchesAudience(campaignRecord, audienceContext) {
  const targetedCountries = normalizeTextList(campaignRecord.targeting?.countries);
  const targetedDevices = normalizeTextList(campaignRecord.targeting?.deviceTypes);
  const targetedTags = normalizeTextList(campaignRecord.targeting?.tags);

  const requestCountry = audienceContext.country ? String(audienceContext.country).trim().toLowerCase() : null;
  const requestDevice = audienceContext.device ? String(audienceContext.device).trim().toLowerCase() : null;
  const requestTags = normalizeTextList(audienceContext.tags);

  const countryMatches = !targetedCountries.length || !requestCountry || targetedCountries.includes(requestCountry);
  const deviceMatches = !targetedDevices.length || !requestDevice || targetedDevices.includes(requestDevice);
  const tagMatches = !targetedTags.length || !requestTags.length || hasListOverlap(targetedTags, requestTags);

  return countryMatches && deviceMatches && tagMatches;
}

function calculateCreativeScore(campaignRecord, creativeRecord, audienceContext) {
  const requestTags = normalizeTextList(audienceContext.tags);
  const creativeTags = normalizeTextList(creativeRecord.tags);
  const targetedTags = normalizeTextList(campaignRecord.targeting?.tags);
  const creativeTagMatches = requestTags.filter((tagValue) => creativeTags.includes(tagValue)).length;
  const campaignTagMatches = requestTags.filter((tagValue) => targetedTags.includes(tagValue)).length;

  return Number(campaignRecord.bid || 0) * 1000 + creativeTagMatches * 50 + campaignTagMatches * 25;
}

async function selectAds(audienceContext = {}, requestedAdCount = 1) {
  const approvedCampaigns = await Campaign.find({ status: 'approved' }).lean();
  const eligibleCampaigns = approvedCampaigns.filter((campaignRecord) => {
    return isBudgetAvailable(campaignRecord) && matchesAudience(campaignRecord, audienceContext);
  });

  if (!eligibleCampaigns.length) return [];

  const eligibleCampaignIds = eligibleCampaigns.map((campaignRecord) => campaignRecord._id);
  const creativeRecords = await Creative.find({ campaignId: { $in: eligibleCampaignIds } }).lean();
  if (!creativeRecords.length) return [];

  const campaignById = new Map(
    eligibleCampaigns.map((campaignRecord) => [String(campaignRecord._id), campaignRecord])
  );

  const adSelections = [];
  for (const creativeRecord of creativeRecords) {
    const parentCampaign = campaignById.get(String(creativeRecord.campaignId));
    if (!parentCampaign) continue;

    // Frequency cap key MUST match the increment key used by the impression
    // event handler (analytics.controller.recordImpression) which keys on
    // campaignId. Caps are per-campaign per-user per UTC day.
    const currentFrequencyCount = await peek(
      audienceContext.userId || 'anonymous',
      String(parentCampaign._id)
    );
    if (currentFrequencyCount >= Number(parentCampaign.frequencyCapPerDay || 0)) continue;

    adSelections.push({
      creativeId: creativeRecord._id,
      campaignId: parentCampaign._id,
      title: creativeRecord.title,
      description: creativeRecord.description || '',
      mediaType: creativeRecord.mediaType,
      mediaUrl: creativeRecord.mediaUrl,
      ctaText: creativeRecord.ctaText || null,
      ctaUrl: creativeRecord.ctaUrl || null,
      tags: creativeRecord.tags || [],
      bid: parentCampaign.bid,
      pricingModel: parentCampaign.pricingModel,
      score: calculateCreativeScore(parentCampaign, creativeRecord, audienceContext),
    });
  }

  return adSelections
    .sort((leftSelection, rightSelection) => rightSelection.score - leftSelection.score)
    .slice(0, Math.max(0, requestedAdCount))
    .map(({ score, ...serializableSelection }) => serializableSelection);
}

module.exports = { selectAds };
