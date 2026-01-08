/**
 * Session Configuration Module
 * Implements secure session management with MongoDB store
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const keys = require('./keys');

/**
 * Configure secure session middleware
 * @returns {Function} Session middleware
 * 
 * Security features:
 * - HttpOnly cookies (Requirement 7.1)
 * - Secure flag in production (Requirement 7.2)
 * - SameSite attribute (Requirement 7.3)
 * - Appropriate expiration times (Requirement 7.4)
 */
const configureSession = () => {
  const store = new MongoDBStore({
    uri: keys.MONGO_URI,
    collection: 'sessions',
    expires: 15 * 24 * 60 * 60 * 1000 // 15 days
  });

  store.on('error', (error) => {
    console.error('Session store error:', error);
  });

  const isProduction = process.env.NODE_ENV === 'production';

  return session({
    store,
    secret: keys.COOKIE_KEY,
    name: 'sessionId', // Custom name instead of default 'connect.sid'
    resave: false,
    saveUninitialized: false,
    rolling: true, // Reset expiration on each request
    proxy: isProduction, // Trust first proxy in production
    cookie: {
      maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days (Requirement 7.4)
      httpOnly: true, // Prevent JavaScript access (Requirement 7.1)
      secure: isProduction, // HTTPS only in production (Requirement 7.2)
      sameSite: isProduction ? 'none' : 'lax', // CSRF protection (Requirement 7.3)
      domain: isProduction ? process.env.COOKIE_DOMAIN : undefined
    }
  });
};

/**
 * Clear session cookies securely
 * @param {Response} res - Express response object
 * 
 * Requirement 7.5: Clear all session cookies with proper domain and path settings
 */
const clearSessionCookies = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.clearCookie('sessionId', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
    domain: isProduction ? process.env.COOKIE_DOMAIN : undefined
  });
};

module.exports = {
  configureSession,
  clearSessionCookies
};
