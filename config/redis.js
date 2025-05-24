const Redis = require('ioredis');
require('dotenv').config();

let redisClient;

try {
    // Simple direct connection string format
    redisClient = new Redis('redis://:8ENPiyBajG8iatxh8b0KWdmBzjWsIHxp@memcached-11491.crce177.me-south-1-1.ec2.redns.redis-cloud.com:11491', {
        retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        showFriendlyErrorStack: true,
        lazyConnect: true,
        connectTimeout: 10000,
        family: 4, // Force IPv4
        db: 0
    });
} catch (error) {
    console.error('Redis connection error:', error);
    throw error;
}

redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
    if (err.code === 'ECONNREFUSED') {
        console.error('Redis connection refused. Please check if Redis server is running.');
    }
});

redisClient.on('connect', () => {
    console.log('Connected to Redis');
});

redisClient.on('ready', () => {
    console.log('Redis client ready and connected');
});

redisClient.on('reconnecting', () => {
    console.log('Redis client reconnecting...');
});

// Test the connection
redisClient.ping().then(() => {
    console.log('Redis connection test successful');
}).catch(err => {
    console.error('Redis connection test failed:', err);
});

module.exports = redisClient; 