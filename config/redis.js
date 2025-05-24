const Redis = require('ioredis');
require('dotenv').config();

let redisClient;

try {
    redisClient = new Redis('redis://default:ZzESjRi4uWKqCRv5Yclv2JwcXKyG83Kh@redis-14768.crce177.me-south-1-1.ec2.redns.redis-cloud.com:14768', {
        retryStrategy: (times) => Math.min(times * 50, 2000),
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        showFriendlyErrorStack: true,
        lazyConnect: true,
        connectTimeout: 10000,
        family: 4, // IPv4
        db: 0
    });
} catch (error) {
    console.error('Redis connection error:', error);
    throw error;
}

redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
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

// Optional: test ping
redisClient.ping().then(() => {
    console.log('Redis connection test successful');
}).catch(err => {
    console.error('Redis connection test failed:', err);
});

module.exports = redisClient;
