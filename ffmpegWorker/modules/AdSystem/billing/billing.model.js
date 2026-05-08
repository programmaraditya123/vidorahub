// billing/billing.model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const CreditLedgerSchema = new Schema(
  {
    brandId: { type: ObjectId, ref: 'userProfile', unique: true, required: true },
    balance: { type: Number, default: 0, min: 0 },
    totalSpent: { type: Number, default: 0 },
    totalCredited: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const TransactionSchema = new Schema(
  {
    brandId: { type: ObjectId, required: true },
    campaignId: { type: ObjectId, ref: 'Campaign' }, // populated for impression/click debits
    type: { type: String, enum: ['credit', 'debit'], required: true },
    amount: { type: Number, required: true, min: 0 },
    reason: String,
    refType: { type: String, enum: ['topup', 'impression', 'click', 'adjustment'] },
    refId: String, // creativeId for impression/click; arbitrary for topup/adjustment
    idempotencyKey: { type: String, unique: true, sparse: true },
    balanceAfter: Number,
  },
  { timestamps: true }
);

TransactionSchema.index({ brandId: 1, createdAt: -1 });
TransactionSchema.index({ campaignId: 1, refType: 1, createdAt: -1 }); // analytics rollups

const CreditLedger = mongoose.model('CreditLedger', CreditLedgerSchema);
const Transaction = mongoose.model('Transaction', TransactionSchema);

module.exports = { CreditLedger, Transaction };
