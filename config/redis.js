const Redis = require('ioredis');
require('dotenv').config();

let redisClient;

if (process.env.REDIS_URL) {
    // Production configuration
    try {
        // Simple connection without auth command
        redisClient = new Redis({
            host: 'memcached-11491.crce177.me-south-1-1.ec2.redns.redis-cloud.com',
            port: 11491,
            password: '8ENPiyBajG8iatxh8b0KWdmBzjWsIHxp',
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            showFriendlyErrorStack: true,
            lazyConnect: true,
            connectTimeout: 10000,
            username: undefined, // Explicitly set to undefined to prevent auth with username
            db: 0 // Use default database
        });
    } catch (error) {
        console.error('Redis connection error:', error);
        throw error;
    }
} else {
    // Local configuration
    redisClient = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
        },
        maxRetriesPerRequest: 3
    });
}

redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
    if (err.code === 'ECONNREFUSED') {
        console.error('Redis connection refused. Please check if Redis server is running.');
    }
    if (err.message.includes('SSL')) {
        console.error('Redis SSL/TLS connection error. Check your REDIS_URL and SSL configuration.');
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