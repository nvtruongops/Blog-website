const fs = require('fs');
const path = require('path');

/**
 * Security event types
 */
const SecurityEventType = {
  AUTH_SUCCESS: 'AUTH_SUCCESS',
  AUTH_FAILURE: 'AUTH_FAILURE',
  AUTH_LOCKOUT: 'AUTH_LOCKOUT',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INVALID_INPUT: 'INVALID_INPUT',
  FILE_UPLOAD_BLOCKED: 'FILE_UPLOAD_BLOCKED',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY'
};

/**
 * Sanitize log entry to prevent log injection
 * @param {string} value - Value to sanitize
 * @returns {string} Sanitized value
 */
const sanitizeLogEntry = (value) => {
  if (typeof value !== 'string') return value;
  return value.replace(/[\n\r\t]/g, ' ').substring(0, 500);
};

/**
 * Log security event
 * @param {string} eventType - Type of security event
 * @param {Object} details - Event details
 */
const logSecurityEvent = (eventType, details) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    eventType,
    ip: sanitizeLogEntry(details.ip),
    userId: details.userId !== undefined ? sanitizeLogEntry(details.userId) : null,
    endpoint: sanitizeLogEntry(details.endpoint),
    userAgent: sanitizeLogEntry(details.userAgent),
    details: sanitizeLogEntry(details.message)
  };

  // In production, send to logging service
  // For now, log to console and file
  console.log('[SECURITY]', JSON.stringify(logEntry));

  // Optionally write to file
  const logDir = path.join(__dirname, '../logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logFile = path.join(logDir, `security-${new Date().toISOString().split('T')[0]}.log`);
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
};

/**
 * Middleware to log requests
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    if (res.statusCode >= 400) {
      logSecurityEvent(
        res.statusCode === 401 ? SecurityEventType.AUTH_FAILURE :
        res.statusCode === 403 ? SecurityEventType.UNAUTHORIZED_ACCESS :
        res.statusCode === 429 ? SecurityEventType.RATE_LIMIT_EXCEEDED :
        SecurityEventType.INVALID_INPUT,
        {
          ip: req.ip,
          userId: req.user?.id,
          endpoint: `${req.method} ${req.originalUrl}`,
          userAgent: req.get('User-Agent'),
          message: `Status: ${res.statusCode}, Duration: ${Date.now() - startTime}ms`
        }
      );
    }
  });

  next();
};

module.exports = {
  SecurityEventType,
  logSecurityEvent,
  requestLogger,
  sanitizeLogEntry
};
