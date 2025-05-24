const Redis = require('ioredis');
require('dotenv').config();

let redisClient;

if (process.env.REDIS_URL) {
    // Production configuration using Redis URL
    const redisOptions = {
        tls: process.env.REDIS_URL.includes('rediss://') ? {
            rejectUnauthorized: false,
            requestCert: true,
            agent: false
        } : undefined,
        retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        reconnectOnError: function(err) {
            const targetError = 'READONLY';
            if (err.message.includes(targetError)) {
                return true;
            }
            return false;
        }
    };

    try {
        redisClient = new Redis(process.env.REDIS_URL, redisOptions);
    } catch (error) {
        console.error('Redis connection error:', error);
        // Fallback to non-TLS connection if TLS fails
        try {
            const nonTlsUrl = process.env.REDIS_URL.replace('rediss://', 'redis://');
            redisClient = new Redis(nonTlsUrl, { ...redisOptions, tls: undefined });
        } catch (fallbackError) {
            console.error('Redis fallback connection error:', fallbackError);
            throw fallbackError;
        }
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

module.exports = redisClient; 