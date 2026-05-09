// moderation/moderation.controller.js
const mongoose = require('mongoose');
const { Campaign } = require('../campaigns/campaign.model');

exports.listPending = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const pendingCampaigns = await Campaign.find({ status: 'pending' }).sort({ createdAt: 1 }).limit(limit);
    return res.status(200).json({ success: true, count: pendingCampaigns.length, campaigns: pendingCampaigns });
  } catch (err) { return res.status(500).json({ error: err.message }); }
};

exports.approveCampaign = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'invalid id' });
    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, status: 'pending' },
      { $set: { status: 'approved', rejectReason: null } },
      { new: true }
    );
    if (!campaign) return res.status(404).json({ error: 'campaign not found or not pending' });
    return res.status(200).json({ success: true, campaign });
  } catch (err) { return res.status(500).json({ error: err.message }); }
};

exports.rejectCampaign = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'invalid id' });
    const reason = req.body && req.body.reason;
    if (!reason || typeof reason !== 'string') return res.status(400).json({ error: 'reason required' });
    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, status: 'pending' },
      { $set: { status: 'rejected', rejectReason: reason } },
      { new: true }
    );
    if (!campaign) return res.status(404).json({ error: 'campaign not found or not pending' });
    return res.status(200).json({ success: true, campaign });
  } catch (err) { return res.status(500).json({ error: err.message }); }
};
