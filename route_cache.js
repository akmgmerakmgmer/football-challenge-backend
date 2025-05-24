const { redis, isConnected } = require('./config/redis')

module.exports = duration => (req, res, next) => {
    if (req.method !== 'GET') {
        return next()
    }

    if (!isConnected()) {
        console.log('Redis not connected, skipping cache')
        return next()
    }

    const key = req.originalUrl

    redis.get(key).then(cachedResponse => {
        if (cachedResponse) {
            console.log(`Cache hit for ${key}`)
            return res.send(JSON.parse(cachedResponse))
        } else {
            res.originalSend = res.send
            res.send = body => {
                res.originalSend(body)
                
                if (isConnected()) {
                    redis.set(key, JSON.stringify(body))
                        .then(() => redis.expire(key, duration))
                        .then(() => {
                            console.log(`Cached ${key} for ${duration} seconds`)
                        })
                        .catch(error => {
                            console.error('Redis caching error:', error)
                        })
                }
            }
            next()
        }
    }).catch(error => {
        console.error('Redis cache error:', error)
        next()
    })
}