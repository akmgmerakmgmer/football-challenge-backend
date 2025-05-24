const Redis = require('ioredis');
require('dotenv').config();

const options = {
    tls: {
        rejectUnauthorized: false,
        requestCert: true,
        secureProtocol: 'TLSv1_2_method',
        minVersion: 'TLSv1.2',
        maxVersion: 'TLSv1.3'
    },
    retryStrategy: function(times) {
        const delay = Math.min(times * 100, 3000);
        console.log(`Retrying connection... Attempt ${times}`);
        return delay;
    },
    maxRetriesPerRequest: null, // Retry forever
    enableReadyCheck: true,
    showFriendlyErrorStack: true,
    lazyConnect: true,
    connectTimeout: 20000,
    family: 4,
    db: 0,
    reconnectOnError: function(err) {
        console.log('Reconnect on error:', err);
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
            return true; // Reconnect for READONLY error
        }
        return false;
    },
    autoResubscribe: true,
    autoResendUnfulfilledCommands: true,
    keepAlive: 30000,
    noDelay: true
};

let redisClient = null;
let isConnected = false;

function createClient() {
    const client = new Redis('rediss://default:ZzESjRi4uWKqCRv5Yclv2JwcXKyG83Kh@redis-14768.crce177.me-south-1-1.ec2.redns.redis-cloud.com:14768', options);

    client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        isConnected = false;
    });

    client.on('connect', () => {
        console.log('Connected to Redis');
        isConnected = true;
    });

    client.on('ready', () => {
        console.log('Redis client ready and connected');
        isConnected = true;
    });

    client.on('reconnecting', () => {
        console.log('Redis client reconnecting...');
        isConnected = false;
    });

    client.on('end', () => {
        console.log('Redis connection ended');
        isConnected = false;
    });

    return client;
}

// Create initial client
redisClient = createClient();

// Export both the client and connection status
module.exports = {
    redis: redisClient,
    isConnected: () => isConnected
};
