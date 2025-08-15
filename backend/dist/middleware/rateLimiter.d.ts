interface RateLimiterOptions {
    windowMs?: number;
    max?: number;
    message?: string;
}
export declare const rateLimiter: (options?: RateLimiterOptions) => import("express-rate-limit").RateLimitRequestHandler;
export declare const authLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const apiLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const strictLimiter: import("express-rate-limit").RateLimitRequestHandler;
export {};
//# sourceMappingURL=rateLimiter.d.ts.map