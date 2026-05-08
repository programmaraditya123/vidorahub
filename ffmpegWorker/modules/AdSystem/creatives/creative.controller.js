// creatives/creative.controller.js
const { Campaign } = require('../campaigns/campaign.model');
const { Creative } = require('./creative.model');

const addCreative = async (req, res) => {
  try {
    const { campaignId, title, description, ctaText, ctaUrl, mediaType, mediaUrl, tags } = req.body;

    const campaign = await Campaign.findOne({ _id: campaignId, brandId: req.user._id });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found or not owned by you' });

    const creative = await Creative.create({
      campaignId,
      title,
      description,
      ctaText,
      ctaUrl,
      mediaType,
      mediaUrl,
      tags,
    });
    return res.status(201).json(creative);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

const listCreatives = async (req, res) => {
  try {
    const { campaignId } = req.query;
    if (!campaignId) return res.status(400).json({ error: 'campaignId query param required' });

    const campaign = await Campaign.findOne({ _id: campaignId, brandId: req.user._id });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found or not owned by you' });

    const creatives = await Creative.find({ campaignId }).sort({ createdAt: -1 });
    return res.status(200).json(creatives);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

module.exports = { addCreative, listCreatives };
