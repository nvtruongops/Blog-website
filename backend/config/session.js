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
    expires: 15 * 24 * 60 * 60 * 1000, // 15 days
    connectionOptions: {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    }
  });

  store.on('error', (error) => {
    // Don't crash on session store errors - log and continue
    console.error('Session store error:', error.message);
  });

  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

  return session({
    store,
    secret: keys.COOKIE_KEY,
    name: 'sessionId', // Custom name instead of default 'connect.sid'
    resave: false,
    saveUninitialized: false,
    rolling: true, // Reset expiration on each request
    proxy: true, // Always trust proxy on Vercel
    cookie: {
      maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days (Requirement 7.4)
      httpOnly: true, // Prevent JavaScript access (Requirement 7.1)
      secure: isProduction, // HTTPS only in production (Requirement 7.2)
      sameSite: isProduction ? 'none' : 'lax', // CSRF protection (Requirement 7.3)
      // Don't set domain for cross-origin cookies
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
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  
  res.clearCookie('sessionId', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/'
  });
};

module.exports = {
  configureSession,
  clearSessionCookies
};
