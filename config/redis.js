const Redis = require('ioredis');
require('dotenv').config();

const options = {
    host: 'redis-14768.crce177.me-south-1-1.ec2.redns.redis-cloud.com',
    port: 14768,
    username: 'default',
    password: 'ZzESjRi4uWKqCRv5Yclv2JwcXKyG83Kh',
    tls: {
        rejectUnauthorized: false,
        requestCert: true,
        secureProtocol: 'TLSv1_2_method'
    },
    retryStrategy: function(times) {
        const delay = Math.min(times * 100, 3000);
        console.log(`Retrying connection... Attempt ${times}`);
        return delay;
    },
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    showFriendlyErrorStack: true,
    lazyConnect: false,
    connectTimeout: 30000,
    family: 4,
    db: 0,
    reconnectOnError: function(err) {
        console.log('Reconnect on error:', err);
        return true;
    },
    autoResubscribe: true,
    autoResendUnfulfilledCommands: true,
    keepAlive: 30000,
    noDelay: true
};

let redisClient = null;
let isConnected = false;

function createClient() {
    console.log('Creating new Redis client with options:', {
        host: options.host,
        port: options.port,
        tls: !!options.tls
    });

    const client = new Redis(options);

    client.on('error', (err) => {
        console.error('Redis Client Error:', {
            message: err.message,
            code: err.code,
            stack: err.stack
        });
        isConnected = false;
    });

    client.on('connect', () => {
        console.log('Redis client establishing connection...');
    });

    client.on('ready', () => {
        console.log('Redis client ready and connected');
        isConnected = true;
        
        client.ping().then(() => {
            console.log('Redis PING successful');
        }).catch(err => {
            console.error('Redis PING failed:', err);
        });
    });

    client.on('reconnecting', (delay) => {
        console.log(`Redis client reconnecting in ${delay}ms...`);
        isConnected = false;
    });

    client.on('end', () => {
        console.log('Redis connection ended');
        isConnected = false;
    });

    client.on('close', () => {
        console.log('Redis connection closed');
        isConnected = false;
    });

    return client;
}

redisClient = createClient();

redisClient.ping().then(() => {
    console.log('Initial Redis connection test successful');
    isConnected = true;
}).catch(err => {
    console.error('Initial Redis connection test failed:', err);
    isConnected = false;
});

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
