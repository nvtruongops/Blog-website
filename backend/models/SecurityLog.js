const { model, Schema } = require("mongoose");

/**
 * Security Log Schema
 * Stores security-related events for auditing and incident investigation
 * Requirements: 8.2, 8.3
 */
const securityLogSchema = new Schema({
  eventType: {
    type: String,
    required: true,
    enum: [
      'AUTH_SUCCESS',
      'AUTH_FAILURE',
      'AUTH_LOCKOUT',
      'UNAUTHORIZED_ACCESS',
      'RATE_LIMIT_EXCEEDED',
      'INVALID_INPUT',
      'FILE_UPLOAD_BLOCKED',
      'SUSPICIOUS_ACTIVITY'
    ]
  },
  ip: {
    type: String,
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  endpoint: {
    type: String,
    required: true
  },
  userAgent: {
    type: String
  },
  details: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Index for efficient querying by event type and time
securityLogSchema.index({ eventType: 1, timestamp: -1 });

// Index for querying by IP address
securityLogSchema.index({ ip: 1, timestamp: -1 });

// Index for querying by user
securityLogSchema.index({ userId: 1, timestamp: -1 });

// TTL index - auto-delete logs older than 90 days
securityLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = model("SecurityLog", securityLogSchema);
