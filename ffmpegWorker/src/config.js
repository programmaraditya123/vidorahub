// the redis setup for bullmq
const Redis = require('ioredis')
require('dotenv').config()


console.log("00000",process.env.REDIS_PASSWORD)

const connection =new Redis({
    username: 'default',
    password: process.env.REDIS_PASSWORD,
    host: 'redis-16843.crce286.ap-south-1-1.ec2.cloud.redislabs.com',
    port: 16843,
    maxRetriesPerRequest:null,
    retryStrategy: (times) => Math.min(times * 50, 2000),
    
});

connection.on('error', err => console.log('Redis Client Error', err));

module.exports = connection;