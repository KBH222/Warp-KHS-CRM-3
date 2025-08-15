import { createClient } from 'redis';
import { logger } from '../utils/logger.js';
let redisClient = null;
export async function initializeRedis() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = createClient({
        url: redisUrl,
    });
    redisClient.on('error', (err) => {
        logger.error('Redis Client Error:', err);
    });
    redisClient.on('connect', () => {
        logger.info('Redis Client Connected');
    });
    try {
        await redisClient.connect();
    }
    catch (error) {
        logger.error('Failed to connect to Redis:', error);
        // Don't throw - allow app to run without Redis in development
        if (process.env.NODE_ENV === 'production') {
            throw error;
        }
    }
}
export function getRedisClient() {
    return redisClient;
}
export async function closeRedis() {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
    }
}
