/**
 * CSRF Protection Module
 * Provides Cross-Site Request Forgery protection
 * Requirements: 6.1, 6.3, 6.4
 */

const crypto = require('crypto');

/**
 * Generate a cryptographically secure CSRF token
 * Requirement 6.4: Generate unique CSRF tokens per session
 * @returns {string} CSRF token (64 character hex string)
 */
const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * CSRF protection middleware
 * Validates CSRF tokens on state-changing requests (POST, PUT, DELETE)
 * Requirement 6.1: Validate CSRF tokens on state-changing requests
 * Requirement 6.3: Reject requests with invalid/missing CSRF tokens with 403
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Next middleware function
 */
const csrfProtection = (req, res, next) => {
  // Skip CSRF validation for safe HTTP methods (GET, HEAD, OPTIONS)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Get CSRF token from request header or body
  const csrfToken = req.headers['x-csrf-token'] || req.body?._csrf;
  
  // Get session CSRF token
  const sessionToken = req.session?.csrfToken;

  // Validate CSRF token
  if (!csrfToken) {
    return res.status(403).json({ message: 'CSRF token missing' });
  }

  if (!sessionToken) {
    return res.status(403).json({ message: 'Session CSRF token not found' });
  }

  // Use timing-safe comparison to prevent timing attacks
  if (!timingSafeEqual(csrfToken, sessionToken)) {
    return res.status(403).json({ message: 'Invalid CSRF token' });
  }

  next();
};

/**
 * Timing-safe string comparison to prevent timing attacks
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {boolean} Whether strings are equal
 */
const timingSafeEqual = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  
  if (a.length !== b.length) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
};

/**
 * Middleware to set CSRF token in session and make it available to response
 * Requirement 6.4: Generate unique CSRF tokens per session
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Next middleware function
 */
const setCSRFToken = (req, res, next) => {
  // Generate new CSRF token if session doesn't have one
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateCSRFToken();
  }

  // Make CSRF token available in res.locals for templates
  res.locals.csrfToken = req.session.csrfToken;

  // Also set it as a response header for SPA clients
  res.setHeader('X-CSRF-Token', req.session.csrfToken);

  next();
};

/**
 * Endpoint to get CSRF token for SPA clients
 * Returns the current session's CSRF token
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getCSRFToken = (req, res) => {
  // Ensure session has a CSRF token
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateCSRFToken();
  }

  res.json({ csrfToken: req.session.csrfToken });
};

module.exports = {
  generateCSRFToken,
  csrfProtection,
  setCSRFToken,
  getCSRFToken,
  timingSafeEqual
};
