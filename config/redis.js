const Redis = require('ioredis');
require('dotenv').config();

const options = {
    host: 'redis-14768.crce177.me-south-1-1.ec2.redns.redis-cloud.com',
    port: 14768,
    username: 'default',
    password: 'ZzESjRi4uWKqCRv5Yclv2JwcXKyG83Kh',
    retryStrategy: function(times) {
        const delay = Math.min(times * 100, 3000);
        // console.log(`Retrying connection... Attempt ${times}`);
        return delay;
    },
    maxRetriesPerRequest: 5,
    enableReadyCheck: true,
    showFriendlyErrorStack: true,
    lazyConnect: false,
    connectTimeout: 10000,
    family: 4,
    db: 0
};

let redisClient = null;
let isConnected = false;

function createClient() {
    // console.log('Creating new Redis client...');

    // Try direct URL connection first
    try {
        const client = new Redis('redis://default:ZzESjRi4uWKqCRv5Yclv2JwcXKyG83Kh@redis-14768.crce177.me-south-1-1.ec2.redns.redis-cloud.com:14768');
        setupEventHandlers(client);
        return client;
    } catch (error) {
        // console.log('URL connection failed, trying with options...');
        // Fallback to options-based connection
        const client = new Redis(options);
        setupEventHandlers(client);
        return client;
    }
}

function setupEventHandlers(client) {
    client.on('error', (err) => {
        console.error('Redis Client Error:', {
            message: err.message,
            code: err.code,
            stack: err.stack
        });
        isConnected = false;
    });

    client.on('connect', () => {
        // console.log('Redis client establishing connection...');
    });

    client.on('ready', () => {
        // console.log('Redis client ready and connected');
        isConnected = true;
        
        // // Test the connection
        // client.ping().then(() => {
        //     console.log('Redis PING successful');
        // }).catch(err => {
        //     console.error('Redis PING failed:', err);
        // });
    });

    client.on('reconnecting', (delay) => {
        // console.log(`Redis client reconnecting in ${delay}ms...`);
        isConnected = false;
    });

    client.on('end', () => {
        // console.log('Redis connection ended');
        isConnected = false;
    });

    client.on('close', () => {
        // console.log('Redis connection closed');
        isConnected = false;
    });
}

// Create initial client
redisClient = createClient();

// // Attempt initial connection
// redisClient.ping().then(() => {
//     console.log('Initial Redis connection test successful');
//     isConnected = true;
// }).catch(err => {
//     console.error('Initial Redis connection test failed:', err);
//     isConnected = false;
// });

module.exports = {
    redis: redisClient,
    isConnected: () => isConnected,
    reconnect: () => {
        if (redisClient) {
            redisClient.disconnect();
        }
        redisClient = createClient();
        return redisClient;
    }
};
