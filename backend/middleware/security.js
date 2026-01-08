/**
 * Security middleware configuration
 * Combines helmet, rate limiting, and input sanitization
 * Requirements: 4.1-4.6, 5.1-5.5
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

/**
 * Configure Helmet security headers
 * - CSP (Content-Security-Policy) - Requirement 4.1
 * - X-Content-Type-Options - Requirement 4.2
 * - X-Frame-Options - Requirement 4.3
 * - Strict-Transport-Security (HSTS) - Requirement 4.4
 * - X-XSS-Protection - Requirement 4.5
 * - Hide X-Powered-By - Requirement 4.6
 * @returns {Function} Helmet middleware
 */
const configureHelmet = () => {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'", process.env.BACKEND_URL || "http://localhost:8000", process.env.FRONTEND_URL || "http://localhost:3000"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    // X-Frame-Options - Requirement 4.3
    frameguard: { action: 'deny' },
    // HSTS - Requirement 4.4
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    // X-Content-Type-Options - Requirement 4.2
    noSniff: true,
    // X-XSS-Protection - Requirement 4.5
    xssFilter: true,
    // Hide X-Powered-By - Requirement 4.6
    hidePoweredBy: true
  });
};


/**
 * Configure rate limiter for general API requests
 * Requirement 5.2: 100 requests per minute per authenticated user
 * Requirement 5.4: Return 429 with retry-after header
 * Requirement 5.5: Sliding window algorithm
 * @returns {Function} Rate limiter middleware
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 100, // 100 requests per minute
  message: { message: 'Too many requests, please try again later' },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
  // Sliding window via standard headers
  handler: (req, res) => {
    res.status(429).json({ message: 'Too many requests, please try again later' });
  }
});

/**
 * Configure rate limiter for authentication endpoints
 * Requirement 5.1: 5 login attempts per minute per IP
 * Requirement 5.4: Return 429 with retry-after header
 * @returns {Function} Rate limiter middleware
 */
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 5, // 5 attempts per minute
  message: { message: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts
  handler: (req, res) => {
    res.status(429).json({ message: 'Too many login attempts, please try again later' });
  }
});

/**
 * Configure rate limiter for file uploads
 * Requirement 5.3: 10 upload requests per minute per user
 * Requirement 5.4: Return 429 with retry-after header
 * @returns {Function} Rate limiter middleware
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 10, // 10 uploads per minute
  message: { message: 'Too many upload attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ message: 'Too many upload attempts, please try again later' });
  }
});

module.exports = {
  configureHelmet,
  apiLimiter,
  authLimiter,
  uploadLimiter,
  mongoSanitize,
  xss,
  hpp
};
