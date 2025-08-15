import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
const prismaClientSingleton = () => {
    return new PrismaClient({
        log: [
            {
                emit: 'event',
                level: 'query',
            },
            {
                emit: 'event',
                level: 'error',
            },
            {
                emit: 'event',
                level: 'info',
            },
            {
                emit: 'event',
                level: 'warn',
            },
        ],
    });
};
export const prisma = globalThis.prisma ?? prismaClientSingleton();
if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = prisma;
}
// Log Prisma events
prisma.$on('query', (e) => {
    if (process.env.LOG_LEVEL === 'debug') {
        logger.debug('Query:', e);
    }
});
prisma.$on('error', (e) => {
    logger.error('Prisma error:', e);
});
prisma.$on('info', (e) => {
    logger.info('Prisma info:', e);
});
prisma.$on('warn', (e) => {
    logger.warn('Prisma warning:', e);
});
