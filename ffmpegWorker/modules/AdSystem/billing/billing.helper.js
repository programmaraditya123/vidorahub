// billing/billing.helper.js
const { CreditLedger, Transaction } = require('./billing.model');
const { Campaign } = require('../campaigns/campaign.model');

async function getBalance(brandId) {
  let ledger = await CreditLedger.findOne({ brandId });
  if (!ledger) ledger = await CreditLedger.create({ brandId, balance: 0 });
  return ledger;
}

/**
 * Credit a brand's ledger and (re)activate any campaigns that were paused
 * due to budget exhaustion. Called by admin topup.
 */
async function topup(brandId, amount, refId) {
  if (typeof amount !== 'number' || amount <= 0) throw new Error('amount must be positive number');

  const updatedLedger = await CreditLedger.findOneAndUpdate(
    { brandId },
    { $inc: { balance: amount, totalCredited: amount }, $setOnInsert: { brandId } },
    { new: true, upsert: true }
  );

  const transaction = await Transaction.create({
    brandId,
    type: 'credit',
    amount,
    refType: 'topup',
    refId: refId || null,
    balanceAfter: updatedLedger.balance,
  });

  // Revive any campaigns that were auto-paused on insufficient_funds.
  // They go back to 'approved' so the delivery engine can serve them.
  const revived = await Campaign.updateMany(
    { brandId, status: 'exhausted' },
    { $set: { status: 'approved' } }
  );

  return {
    balance: updatedLedger.balance,
    transactionId: transaction._id,
    revivedCampaigns: revived.modifiedCount || 0,
  };
}

/**
 * Atomically:
 *   1. Reserve `amount` from the brand's ledger (only if balance >= amount).
 *   2. If `campaignId` is provided, increment its spentToday/spentTotal in
 *      the SAME logical step (so spentToday never desyncs from the ledger
 *      when the process crashes).
 *   3. Record an idempotent Transaction.
 *
 * Compensation: if step 3 fails for ANY reason after step 1 has already
 * debited the ledger, we roll the ledger AND spentToday back. Previously
 * only duplicate-key errors were compensated, leaking funds on every other
 * write failure.
 *
 * Returns:
 *   { ok: true, balanceAfter, transactionId }
 *   { ok: false, reason: 'duplicate' | 'insufficient_funds', balanceAfter? }
 */
async function deduct(brandId, amount, refType, refId, idempotencyKey, campaignId = null) {
  if (typeof amount !== 'number' || amount <= 0) throw new Error('amount must be positive number');
  if (!idempotencyKey) throw new Error('idempotencyKey required');

  // Fast-path duplicate check — avoids touching the ledger for replays.
  const existingTransaction = await Transaction.findOne({ idempotencyKey });
  if (existingTransaction) {
    return { ok: false, reason: 'duplicate', balanceAfter: existingTransaction.balanceAfter };
  }

  // Atomic conditional debit: only updates if balance >= amount.
  const updatedLedger = await CreditLedger.findOneAndUpdate(
    { brandId, balance: { $gte: amount } },
    { $inc: { balance: -amount, totalSpent: amount } },
    { new: true }
  );

  if (!updatedLedger) return { ok: false, reason: 'insufficient_funds' };

  // Step 2: bump campaign spend counters BEFORE writing the transaction.
  // If the campaign update fails we still need to compensate the ledger.
  let campaignUpdated = false;
  if (campaignId) {
    try {
      await Campaign.updateOne(
        { _id: campaignId },
        { $inc: { spentToday: amount, spentTotal: amount } }
      );
      campaignUpdated = true;
    } catch (campaignUpdateErr) {
      // Compensate the ledger and propagate.
      await CreditLedger.updateOne(
        { brandId },
        { $inc: { balance: amount, totalSpent: -amount } }
      );
      throw campaignUpdateErr;
    }
  }

  // Step 3: write the immutable transaction record. ANY failure here must
  // roll back BOTH the ledger debit AND the campaign spend bump.
  try {
    const transaction = await Transaction.create({
      brandId,
      campaignId: campaignId || undefined,
      type: 'debit',
      amount,
      refType,
      refId: refId || null,
      idempotencyKey,
      balanceAfter: updatedLedger.balance,
    });

    return { ok: true, balanceAfter: updatedLedger.balance, transactionId: transaction._id };
  } catch (txErr) {
    const compensations = [
      CreditLedger.updateOne({ brandId }, { $inc: { balance: amount, totalSpent: -amount } }),
    ];
    if (campaignUpdated && campaignId) {
      compensations.push(
        Campaign.updateOne({ _id: campaignId }, { $inc: { spentToday: -amount, spentTotal: -amount } })
      );
    }
    // Best-effort compensation. Log if it fails; don't mask the original error.
    try {
      await Promise.all(compensations);
    } catch (compErr) {
      console.error('❌ deduct compensation failed:', compErr.message, '| original:', txErr.message);
    }

    if (txErr && txErr.code === 11000) {
      // Idempotency-key race: another concurrent request beat us to it.
      return { ok: false, reason: 'duplicate' };
    }
    throw txErr;
  }
}

module.exports = { getBalance, topup, deduct };
