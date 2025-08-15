import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';
// Inline constants to avoid @khs-crm imports
const ERROR_CODES = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
};
export const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorDetails = errors.array().map(error => ({
            field: error.type === 'field' ? error.path : undefined,
            message: error.msg,
        }));
        throw new ApiError(400, ERROR_CODES.VALIDATION_ERROR, 'Validation failed', errorDetails);
    }
    next();
};
