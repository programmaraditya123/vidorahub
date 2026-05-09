// billing/billing.controller.js
const mongoose = require('mongoose');
const { Transaction } = require('./billing.model');
const { getBalance, topup } = require('./billing.helper');

exports.getMyBalance = async (req, res) => {
  try {
    const ledger = await getBalance(req.user._id);
    return res.status(200).json({ success: true, ledger });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.listMyTransactions = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const transactionQuery = { brandId: req.user._id };

    if (req.query.before) {
      transactionQuery.createdAt = { $lt: new Date(req.query.before) };
    }

    const transactions = await Transaction.find(transactionQuery)
      .sort({ createdAt: -1 })
      .limit(limit);

    const nextCursor =
      transactions.length === limit ? transactions[transactions.length - 1].createdAt : null;

    return res.status(200).json({ success: true, transactions, nextCursor });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.adminTopup = async (req, res) => {
  try {
    const { brandId, amount, note } = req.body;

    if (!brandId || !mongoose.Types.ObjectId.isValid(brandId)) {
      return res.status(400).json({ error: 'valid brandId required' });
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'positive amount required' });
    }

    const result = await topup(brandId, amount, note || null);
    return res.status(200).json({
      success: true,
      balance: result.balance,
      transactionId: result.transactionId,
      revivedCampaigns: result.revivedCampaigns,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
