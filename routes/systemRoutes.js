const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController.min.js');
const cache = require('../route_cache.js');
const TWELVE_HOURS = 60 * 60 * 12;
const { redis, isConnected, reconnect } = require('../config/redis');

router.get('/initial-fetch', cache(TWELVE_HOURS), systemController.inital_fetch);

// Health check
router.get('/health/redis', async (req, res) => {
    try {
        if (!isConnected()) {
            console.log('Redis not connected, attempting reconnection...');
            reconnect();
            return res.status(503).json({ 
                status: 'error', 
                message: 'Redis not connected, attempting reconnection' 
            });
        }

        await redis.ping();
        res.json({ 
            status: 'ok', 
            message: 'Redis connected and responding',
            isConnected: isConnected()
        });
    } catch (error) {
        console.error('Redis health check failed:', error);
        res.status(503).json({ 
            status: 'error', 
            message: 'Redis health check failed',
            error: error.message
        });
    }
});

module.exports = router; 