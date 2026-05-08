// analytics/analytics.helper.js
// AstraDB collection accessors for ad event mirroring (impressions, clicks, idempotency).
const db = require('../../../db/db2');

const COLLECTIONS = {
  impressions: 'ad_impressions',
  clicks: 'ad_clicks',
  idempotency: 'ad_event_idempotency',
};

/**
 * Bootstrap all ad analytics collections in AstraDB (idempotent).
 * AstraDB Data API createCollection doesn't throw on duplicates.
 */
async function bootstrapAdCollections() {
  for (const collName of Object.values(COLLECTIONS)) {
    try {
      await db.createCollection(collName);
      console.log(`✅ Astra collection ready: ${collName}`);
    } catch (err) {
      const msg = (err && err.message) || '';
      if (msg.toLowerCase().includes('exist') || msg.toLowerCase().includes('already')) {
        console.log(`ℹ️  Astra collection already exists: ${collName}`);
      } else {
        console.error(`❌ Failed to create collection ${collName}:`, msg);
        throw err;
      }
    }
  }
}

function getImpressionsCol() { return db.collection(COLLECTIONS.impressions); }
function getClicksCol() { return db.collection(COLLECTIONS.clicks); }
function getIdempotencyCol() { return db.collection(COLLECTIONS.idempotency); }

module.exports = { COLLECTIONS, bootstrapAdCollections, getImpressionsCol, getClicksCol, getIdempotencyCol };
