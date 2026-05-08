// campaigns/campaign.controller.js
const { Campaign } = require('./campaign.model');

const createCampaign = async (req, res) => {
  try {
    const { name, pricingModel, bid, dailyBudget, lifetimeBudget, targeting, frequencyCapPerDay } = req.body;
    const campaign = await Campaign.create({
      brandId: req.user._id,
      name,
      pricingModel,
      bid,
      dailyBudget,
      lifetimeBudget,
      targeting,
      frequencyCapPerDay,
      status: 'pending',
    });
    return res.status(201).json(campaign);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

const listMyCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ brandId: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json(campaigns);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

const getCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, brandId: req.user._id });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    return res.status(200).json(campaign);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

const updateCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, brandId: req.user._id });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    const editableStatuses = ['pending', 'rejected', 'paused'];
    if (!editableStatuses.includes(campaign.status)) {
      return res.status(400).json({ error: `Cannot edit campaign with status '${campaign.status}'` });
    }

    // Strip protected fields
    const { status, brandId, spentToday, spentTotal, ...safeBody } = req.body;

    const updated = await Campaign.findByIdAndUpdate(
      req.params.id,
      { $set: safeBody },
      { new: true, runValidators: true }
    );
    return res.status(200).json(updated);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

const pauseCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, brandId: req.user._id });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    if (campaign.status !== 'approved') {
      return res.status(400).json({ error: 'Only approved campaigns can be paused' });
    }
    campaign.status = 'paused';
    await campaign.save();
    return res.status(200).json(campaign);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

const resumeCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, brandId: req.user._id });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    if (campaign.status !== 'paused') {
      return res.status(400).json({ error: 'Only paused campaigns can be resumed' });
    }
    campaign.status = 'approved';
    await campaign.save();
    return res.status(200).json(campaign);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

module.exports = {
  createCampaign,
  listMyCampaigns,
  getCampaign,
  updateCampaign,
  pauseCampaign,
  resumeCampaign,
};
