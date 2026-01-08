/**
 * Security Logger Module
 * Uses Axiom for cloud logging in all environments
 * Console output is also captured by Vercel/serverless platforms
 */

const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
const isProduction = process.env.NODE_ENV === 'production';

// Lazy load Axiom logger to avoid circular dependencies
let axiomLogger = null;
const getAxiomLogger = () => {
  if (!axiomLogger && process.env.AXIOM_TOKEN) {
    try {
      axiomLogger = require('./axiomLogger');
    } catch (err) {
      // Axiom not available, continue without it
    }
  }
  return axiomLogger;
};

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
 * Log levels for filtering
 */
const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

// Current log level (can be set via environment variable)
const currentLogLevel = LogLevel[process.env.LOG_LEVEL?.toUpperCase()] || LogLevel.INFO;

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
 * Get log level for event type
 */
const getLogLevel = (eventType) => {
  switch (eventType) {
    case SecurityEventType.AUTH_SUCCESS:
      return LogLevel.INFO;
    case SecurityEventType.AUTH_FAILURE:
    case SecurityEventType.RATE_LIMIT_EXCEEDED:
      return LogLevel.WARN;
    case SecurityEventType.AUTH_LOCKOUT:
    case SecurityEventType.UNAUTHORIZED_ACCESS:
    case SecurityEventType.FILE_UPLOAD_BLOCKED:
    case SecurityEventType.SUSPICIOUS_ACTIVITY:
      return LogLevel.ERROR;
    default:
      return LogLevel.INFO;
  }
};

/**
 * Log security event
 * @param {string} eventType - Type of security event
 * @param {Object} details - Event details
 */
const logSecurityEvent = (eventType, details) => {
  const level = getLogLevel(eventType);
  
  // Skip if below current log level
  if (level < currentLogLevel) return;

  const logEntry = {
    timestamp: new Date().toISOString(),
    level: Object.keys(LogLevel).find(k => LogLevel[k] === level),
    eventType,
    ip: sanitizeLogEntry(details.ip),
    userId: details.userId !== undefined ? sanitizeLogEntry(String(details.userId)) : null,
    endpoint: sanitizeLogEntry(details.endpoint),
    userAgent: sanitizeLogEntry(details.userAgent),
    details: sanitizeLogEntry(details.message)
  };

  // Always log to console (captured by Vercel/serverless platforms)
  const logMethod = level >= LogLevel.ERROR ? console.error : 
                    level >= LogLevel.WARN ? console.warn : console.log;
  logMethod('[SECURITY]', JSON.stringify(logEntry));

  // Send to Axiom if configured
  const axiom = getAxiomLogger();
  if (axiom) {
    axiom.security(eventType, details);
  }

  // File logging disabled - using Axiom for all environments
  // Local files are not needed when using cloud logging service
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
  LogLevel,
  logSecurityEvent,
  requestLogger,
  sanitizeLogEntry
};
