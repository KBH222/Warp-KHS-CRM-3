import { createClient } from 'redis';
export type RedisClient = ReturnType<typeof createClient>;
export declare function initializeRedis(): Promise<void>;
export declare function getRedisClient(): RedisClient | null;
export declare function closeRedis(): Promise<void>;
//# sourceMappingURL=redis.service.d.ts.map