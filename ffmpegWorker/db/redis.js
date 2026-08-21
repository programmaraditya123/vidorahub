const Redis = require('ioredis');
require('dotenv').config();

const redisUrl = process.env.REDIS_URL;
const redis = new Redis(redisUrl, { maxRetriesPerRequest: 3 });

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', (err) => console.error('❌ Redis error:', err.message));

module.exports = redis;
