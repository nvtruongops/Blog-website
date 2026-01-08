/**
 * Input Validation Module
 * Provides validation and sanitization for user inputs
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

const { body, param, query, validationResult } = require('express-validator');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

// Initialize DOMPurify with JSDOM
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 * Sanitize HTML content to prevent XSS
 * Requirement 1.2: Sanitize content to prevent XSS attacks
 * @param {string} dirty - Potentially unsafe HTML
 * @returns {string} Sanitized HTML
 */
const sanitizeHTML = (dirty) => {
  if (typeof dirty !== 'string') {
    return '';
  }
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a', 'img', 'h1', 'h2', 'h3', 'blockquote', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'class']
  });
};

/**
 * Validation rules for user registration
 * Requirement 1.1: Validate all fields against defined schemas
 */
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Name must be between 1 and 50 characters')
    .escape(),
  body('temail')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6, max: 50 })
    .withMessage('Password must be between 6 and 50 characters')
];

/**
 * Validation rules for login
 * Requirement 1.1: Validate all fields against defined schemas
 */
const loginValidation = [
  body('temail')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

/**
 * Validation rules for post creation/editing
 * Requirement 1.1, 1.2: Validate and sanitize post content
 */
const postValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Description must be between 1 and 500 characters'),
  body('category')
    .isIn(['food', 'travelling', 'lifestyle', 'tech'])
    .withMessage('Invalid category'),
  body('content')
    .customSanitizer(value => sanitizeHTML(value))
];

/**
 * Validation rules for comments
 * Requirement 1.1, 1.2: Validate and sanitize comment content
 */
const commentValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters')
    .customSanitizer(value => sanitizeHTML(value)),
  body('postId')
    .isMongoId()
    .withMessage('Invalid post ID')
];

/**
 * Validation rules for MongoDB ObjectId parameters
 * Requirement 1.3: Prevent NoSQL injection via parameterized queries
 * @param {string} fieldName - Name of the field to validate
 * @returns {Array} Validation chain
 */
const mongoIdValidation = (fieldName) => [
  param(fieldName)
    .isMongoId()
    .withMessage(`Invalid ${fieldName}`)
];

/**
 * Validation rules for MongoDB ObjectId in request body
 * @param {string} fieldName - Name of the field to validate
 * @returns {Array} Validation chain
 */
const mongoIdBodyValidation = (fieldName) => [
  body(fieldName)
    .isMongoId()
    .withMessage(`Invalid ${fieldName}`)
];

/**
 * Middleware to handle validation errors
 * Requirement 1.4: Return descriptive error message without exposing system details
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

module.exports = {
  sanitizeHTML,
  registerValidation,
  loginValidation,
  postValidation,
  commentValidation,
  mongoIdValidation,
  mongoIdBodyValidation,
  handleValidationErrors
};
