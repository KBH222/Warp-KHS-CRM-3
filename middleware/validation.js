const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation middleware for KHS CRM API endpoints
 * Provides comprehensive input validation and sanitization
 */

// Helper function to handle validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('Validation errors:', errors.array());
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// Authentication validation rules
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail()
    .isLength({ min: 1, max: 255 })
    .withMessage('Email must be between 1 and 255 characters'),
    
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be between 6 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    
  handleValidationErrors
];

const validateRegistration = [
  body('email')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail()
    .isLength({ min: 1, max: 255 })
    .withMessage('Email must be between 1 and 255 characters'),
    
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
    
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z\s\-'\.]+$/)
    .withMessage('Name can only contain letters, spaces, hyphens, apostrophes, and periods')
    .trim(),
    
  handleValidationErrors
];

const validateRefreshToken = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
    .isJWT()
    .withMessage('Invalid refresh token format'),
    
  handleValidationErrors
];

// Customer validation rules
const validateCustomer = [
  body('name')
    .isLength({ min: 1, max: 255 })
    .withMessage('Customer name must be between 1 and 255 characters')
    .trim()
    .escape(),
    
  body('email')
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
    
  body('phone')
    .optional({ checkFalsy: true })
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Phone number must be valid (E.164 format)')
    .trim(),
    
  body('address')
    .isLength({ min: 1, max: 500 })
    .withMessage('Address must be between 1 and 500 characters')
    .trim()
    .escape(),
    
  body('notes')
    .optional({ checkFalsy: true })
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
    .trim()
    .escape(),
    
  body('customerType')
    .optional()
    .isIn(['CURRENT', 'LEADS'])
    .withMessage('Customer type must be either CURRENT or LEADS'),
    
  body('reference')
    .optional({ checkFalsy: true })
    .matches(/^[A-Z][0-9]+$/)
    .withMessage('Reference must be a letter followed by numbers (e.g., A1, B123)'),
    
  handleValidationErrors
];

// Job validation rules
const validateJob = [
  body('title')
    .isLength({ min: 1, max: 255 })
    .withMessage('Job title must be between 1 and 255 characters')
    .trim()
    .escape(),
    
  body('description')
    .optional({ checkFalsy: true })
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters')
    .trim()
    .escape(),
    
  body('customerId')
    .notEmpty()
    .withMessage('Customer ID is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Invalid customer ID format'),
    
  body('status')
    .optional()
    .isIn(['NOT_STARTED', 'IN_PROGRESS', 'WAITING_ON_MATERIALS', 'COMPLETED', 'ON_HOLD', 'QUOTED', 'APPROVED', 'CANCELLED'])
    .withMessage('Invalid job status'),
    
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
    
  body('startDate')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
    
  body('endDate')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
    
  body('notes')
    .optional({ checkFalsy: true })
    .isLength({ max: 2000 })
    .withMessage('Notes cannot exceed 2000 characters')
    .trim()
    .escape(),
    
  // Validate that endDate is after startDate if both are provided
  body('endDate').custom((value, { req }) => {
    if (value && req.body.startDate) {
      const startDate = new Date(req.body.startDate);
      const endDate = new Date(value);
      if (endDate <= startDate) {
        throw new Error('End date must be after start date');
      }
    }
    return true;
  }),
    
  handleValidationErrors
];

// Material validation rules
const validateMaterial = [
  body('jobId')
    .notEmpty()
    .withMessage('Job ID is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Invalid job ID format'),
    
  body('itemName')
    .isLength({ min: 1, max: 255 })
    .withMessage('Item name must be between 1 and 255 characters')
    .trim()
    .escape(),
    
  body('quantity')
    .isFloat({ min: 0 })
    .withMessage('Quantity must be a positive number'),
    
  body('unit')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Unit must be between 1 and 50 characters')
    .trim()
    .escape(),
    
  body('notes')
    .optional({ checkFalsy: true })
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
    .trim()
    .escape(),
    
  handleValidationErrors
];

// ID parameter validation
const validateId = [
  param('id')
    .notEmpty()
    .withMessage('ID is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Invalid ID format'),
    
  handleValidationErrors
];

// Query parameter validation for pagination
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
    
  query('sortBy')
    .optional()
    .isAlpha()
    .withMessage('Sort field must contain only letters'),
    
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
    
  handleValidationErrors
];

// Search query validation
const validateSearch = [
  query('q')
    .optional({ checkFalsy: true })
    .isLength({ min: 1, max: 255 })
    .withMessage('Search query must be between 1 and 255 characters')
    .trim()
    .escape(),
    
  handleValidationErrors
];

// File upload validation (for photos/plans)
const validateFileUpload = [
  body('filename')
    .optional({ checkFalsy: true })
    .matches(/^[a-zA-Z0-9_\-\.]+\.(jpg|jpeg|png|gif|pdf)$/)
    .withMessage('Filename must be valid and have allowed extension (.jpg, .jpeg, .png, .gif, .pdf)'),
    
  body('fileSize')
    .optional()
    .isInt({ min: 1, max: 10485760 }) // 10MB max
    .withMessage('File size must be between 1 byte and 10MB'),
    
  handleValidationErrors
];

// Rate limiting validation helper
const createRateLimitMessage = (windowMs, max) => {
  return `Too many requests. Limit: ${max} requests per ${windowMs / 1000} seconds.`;
};

module.exports = {
  // Auth validators
  validateLogin,
  validateRegistration,
  validateRefreshToken,
  
  // Entity validators
  validateCustomer,
  validateJob,
  validateMaterial,
  
  // Common validators
  validateId,
  validatePagination,
  validateSearch,
  validateFileUpload,
  
  // Helper functions
  handleValidationErrors,
  createRateLimitMessage,
};
