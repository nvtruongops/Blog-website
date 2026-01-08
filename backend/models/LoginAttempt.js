const { model, Schema } = require("mongoose");

/**
 * Login Attempt Schema
 * Tracks login attempts for rate limiting and brute force protection
 * Requirements: 2.1, 2.6
 */
const loginAttemptSchema = new Schema({
  ip: {
    type: String,
    required: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    index: true
  },
  success: {
    type: Boolean,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// TTL index - auto-delete attempts after 1 hour
loginAttemptSchema.index({ timestamp: 1 }, { expireAfterSeconds: 3600 });

// Compound index for efficient querying of attempts by IP and email
loginAttemptSchema.index({ ip: 1, email: 1, timestamp: -1 });

module.exports = model("LoginAttempt", loginAttemptSchema);
