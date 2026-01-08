/**
 * Axiom Logger Module
 * Centralized logging for Vercel serverless deployment
 * 
 * Datasets:
 * - blog-logs: General application logs
 * - blog-security: Security events (auth, access control)
 * 
 * Setup:
 * 1. Create account at https://axiom.co
 * 2. Create datasets
 * 3. Create API token with ingest permissions
 * 4. Add to Vercel env vars: AXIOM_TOKEN, AXIOM_ORG_ID
 */

const { Axiom } = require('@axiomhq/js');

// Initialize Axiom client (only if credentials are available)
let axiom = null;

// Dataset names
const DATASETS = {
  GENERAL: process.env.AXIOM_DATASET || 'blog-logs',
  SECURITY: process.env.AXIOM_SECURITY_DATASET || 'blog-security',
};

if (process.env.AXIOM_TOKEN) {
  const config = {
    token: process.env.AXIOM_TOKEN,
  };
  
  // Add org ID if using personal token (xapt-...)
  if (process.env.AXIOM_ORG_ID) {
    config.orgId = process.env.AXIOM_ORG_ID;
  }
  
  axiom = new Axiom(config);
}

/**
 * Log levels
 */
const LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
};

/**
 * Send log to Axiom
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} metadata - Additional metadata
 * @param {string} dataset - Target dataset (default: GENERAL)
 */
const log = async (level, message, metadata = {}, dataset = DATASETS.GENERAL) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: 'blog-backend',
    environment: process.env.NODE_ENV || 'development',
    ...metadata,
  };

  // Always log to console (captured by Vercel)
  const consoleMethod = level === 'error' ? console.error :
                        level === 'warn' ? console.warn : console.log;
  consoleMethod(`[${level.toUpperCase()}]`, message, metadata);

  // Send to Axiom if configured
  if (axiom) {
    try {
      axiom.ingest(dataset, [logEntry]);
      // Note: Don't await here to avoid blocking - Axiom batches automatically
    } catch (err) {
      console.error('[AXIOM] Failed to send log:', err.message);
    }
  }
};

/**
 * Flush logs before serverless function ends
 * Call this at the end of request handlers
 */
const flush = async () => {
  if (axiom) {
    try {
      await axiom.flush();
    } catch (err) {
      console.error('[AXIOM] Flush failed:', err.message);
    }
  }
};

/**
 * Convenience methods
 */
const logger = {
  // General logs -> blog-logs dataset
  debug: (message, meta) => log(LogLevel.DEBUG, message, meta, DATASETS.GENERAL),
  info: (message, meta) => log(LogLevel.INFO, message, meta, DATASETS.GENERAL),
  warn: (message, meta) => log(LogLevel.WARN, message, meta, DATASETS.GENERAL),
  error: (message, meta) => log(LogLevel.ERROR, message, meta, DATASETS.GENERAL),
  
  // Security logs -> blog-security dataset
  security: (eventType, details) => log(LogLevel.WARN, `[SECURITY] ${eventType}`, {
    eventType,
    ip: details.ip,
    userId: details.userId,
    endpoint: details.endpoint,
    userAgent: details.userAgent,
    details: details.message,
  }, DATASETS.SECURITY),
  
  flush,
  DATASETS,
};

module.exports = logger;
