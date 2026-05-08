// delivery/frequency.helper.js
// Per-user/per-ad frequency capping using Redis counters with TTL until UTC midnight.
// Degrades gracefully (allow) when Redis is unavailable.
const redis = require('../../../db/redis');

let lastDegradedLog = 0;
function logDegradedOnce(err) {
  const now = Date.now();
  if (now - lastDegradedLog > 60000) {
    console.warn('⚠️  adfrequency degraded (Redis down):', err && err.message);
    lastDegradedLog = now;
  }
}

function todayUTCKey() {
  const d = new Date();
  return d.getUTCFullYear() + String(d.getUTCMonth() + 1).padStart(2, '0') + String(d.getUTCDate()).padStart(2, '0');
}

function secondsUntilUTCMidnight() {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));
  return Math.max(1, Math.ceil((next.getTime() - now.getTime()) / 1000));
}

async function checkAndIncrement(userId, adId, capPerDay) {
  const key = `adfreq:${userId}:${adId}:${todayUTCKey()}`;
  try {
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, secondsUntilUTCMidnight());
    return { allowed: count <= capPerDay, count };
  } catch (err) {
    logDegradedOnce(err);
    return { allowed: true, count: -1, degraded: true };
  }
}

async function peek(userId, adId) {
  const key = `adfreq:${userId}:${adId}:${todayUTCKey()}`;
  try {
    const val = await redis.get(key);
    return val ? Number(val) : 0;
  } catch (err) {
    logDegradedOnce(err);
    return 0;
  }
}

module.exports = { checkAndIncrement, peek };
