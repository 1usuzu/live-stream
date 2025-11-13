const Redis = require('ioredis')
const logger = require('../utils/logger')

let redis;

// Check if using Upstash REST API (recommended for production)
const useRestAPI = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

if (useRestAPI) {
  // Use Upstash REST API (works better on Render free tier)
  try {
    const { Redis: UpstashRedis } = require('@upstash/redis');

    redis = new UpstashRedis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    logger.info('✅ Using Upstash Redis REST API');

    // Add ioredis-compatible methods
    redis.setex = async (key, seconds, value) => {
      return await redis.set(key, value, { ex: seconds });
    };

    redis.status = 'ready';

  } catch (error) {
    logger.error('❌ Failed to initialize Upstash REST API:', error.message);
    logger.warn('⚠️  Falling back to standard Redis protocol');
    useRestAPI = false;
  }
}

if (!useRestAPI) {
  // Use standard Redis protocol
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  // Configure Redis options
  const redisOptions = {
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
  };

  // Disable TLS/SSL for local development
  if (process.env.NODE_ENV === 'development') {
    redisOptions.tls = undefined;
    redisOptions.enableTLSForSentinelMode = false;
  }

  // For production with TLS (e.g., Render, Railway)
  if (process.env.NODE_ENV === 'production' && redisUrl.includes('rediss://')) {
    redisOptions.tls = {
      rejectUnauthorized: false
    };
  }

  redis = new Redis(redisUrl, redisOptions);
}

// Event handlers (only for standard Redis, not REST API)
if (!useRestAPI && redis.on) {
  redis.on('connect', () => {
    logger.info('🔄 Redis connecting...')
  })

  redis.on('ready', () => {
    logger.info('✅ Redis ready')
  })

  redis.on('error', (err) => {
    // Only log error once, not on every retry
    if (!redis.retrying) {
      logger.error('❌ Redis error:', err.message)

      if (err.code === 'ECONNREFUSED') {
        logger.warn('   Redis not running. Start with:')
        logger.warn('   Docker: docker run -d --name redis -p 6379:6379 redis:7-alpine')
        logger.warn('   Or: npm run docker:up')
      }

      if (err.code === 'ERR_SSL_PACKET_LENGTH_TOO_LONG') {
        logger.warn('   SSL error detected. Make sure REDIS_URL does not use rediss:// for local')
        logger.warn('   Correct: redis://localhost:6379')
        logger.warn('   Wrong: rediss://localhost:6379')
      }

      if (err.message && err.message.includes('max retries')) {
        logger.error('   ⚠️  Consider using Upstash REST API instead:')
        logger.error('   Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN')
        logger.error('   See: TROUBLESHOOT_REDIS.md')
      }
    }
  })

  redis.on('close', () => {
    logger.warn('⚠️  Redis connection closed')
  })

  redis.on('reconnecting', (delay) => {
    redis.retrying = true
    logger.info(`🔄 Redis reconnecting in ${delay}ms...`)
  })

  redis.on('end', () => {
    logger.info('Redis connection ended')
  })
}

// Helper functions
const redisHelpers = {
  // Set with expiration
  setex: async (key, seconds, value) => {
    try {
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : value
      return await redis.setex(key, seconds, stringValue)
    } catch (error) {
      logger.error('Redis setex error:', error.message)
      throw error
    }
  },

  // Get and parse JSON
  getJSON: async (key) => {
    try {
      const value = await redis.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      logger.error('Redis getJSON error:', error.message)
      return null
    }
  },

  // Increment with expiration
  incrWithExpire: async (key, expireSeconds = 60) => {
    const count = await redis.incr(key)
    if (count === 1) {
      await redis.expire(key, expireSeconds)
    }
    return count
  },

  // Hash operations
  hsetJSON: async (key, field, value) => {
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : value
    return await redis.hset(key, field, stringValue)
  },

  hgetJSON: async (key, field) => {
    const value = await redis.hget(key, field)
    return value ? JSON.parse(value) : null
  },

  // Check if connected
  isConnected: () => {
    return redis.status === 'ready'
  },

  // Graceful disconnect
  disconnect: async () => {
    try {
      await redis.quit()
      logger.info('Redis disconnected gracefully')
    } catch (error) {
      logger.error('Redis disconnect error:', error.message)
    }
  }
}

module.exports = { redis, ...redisHelpers }