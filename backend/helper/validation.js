/**
 * Validate email address using RFC 5322 compliant regex
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if valid, false otherwise
 */
exports.validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Trim whitespace
  email = email.trim();

  // Check length
  if (email.length > 254) {
    return false;
  }

  // RFC 5322 compliant regex (simplified but secure)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(email)) {
    return false;
  }

  // Additional checks
  const parts = email.split('@');
  if (parts.length !== 2) {
    return false;
  }

  const [localPart, domain] = parts;

  // Local part checks
  if (localPart.length > 64) {
    return false;
  }

  // No consecutive dots
  if (localPart.includes('..') || domain.includes('..')) {
    return false;
  }

  // No leading/trailing dots
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return false;
  }

  if (domain.startsWith('.') || domain.endsWith('.')) {
    return false;
  }

  // Domain must have at least one dot
  if (!domain.includes('.')) {
    return false;
  }

  return true;
};


/**
 * Validate text length with proper type checking
 * @param {string} text - Text to validate
 * @param {number} min - Minimum length
 * @param {number} max - Maximum length
 * @returns {boolean} - True if valid, false otherwise
 */
exports.validateLength = (text, min, max) => {
  if (!text || typeof text !== 'string') {
    return false;
  }

  const trimmed = text.trim();

  if (trimmed.length > max || trimmed.length < min) {
    return false;
  }
  return true;
};

