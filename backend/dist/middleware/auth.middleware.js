import jwt from 'jsonwebtoken';
const ERROR_CODES = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED'
};
import { ApiError } from '../utils/ApiError.js';
import { prisma } from '../db/prisma.js';
export const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            throw new ApiError(401, ERROR_CODES.UNAUTHORIZED, 'No token provided');
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Verify user still exists and is active
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, isActive: true }
        });
        if (!user || !user.isActive) {
            throw new ApiError(401, ERROR_CODES.UNAUTHORIZED, 'User not found or inactive');
        }
        req.user = decoded;
        next();
    }
    catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            next(new ApiError(401, ERROR_CODES.TOKEN_EXPIRED, 'Token expired'));
        }
        else if (error instanceof jwt.JsonWebTokenError) {
            next(new ApiError(401, ERROR_CODES.UNAUTHORIZED, 'Invalid token'));
        }
        else {
            next(error);
        }
    }
};
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new ApiError(401, ERROR_CODES.UNAUTHORIZED, 'Not authenticated'));
        }
        if (!roles.includes(req.user.role)) {
            return next(new ApiError(403, ERROR_CODES.FORBIDDEN, 'Insufficient permissions'));
        }
        next();
    };
};
