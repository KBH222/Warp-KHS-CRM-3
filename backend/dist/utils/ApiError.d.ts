export declare class ApiError extends Error {
    statusCode: number;
    code: string;
    details?: any | undefined;
    constructor(statusCode: number, code: string, message: string, details?: any | undefined);
}
//# sourceMappingURL=ApiError.d.ts.map