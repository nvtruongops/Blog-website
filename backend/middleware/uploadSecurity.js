/**
 * File Upload Security Module
 * Provides validation and security for file uploads
 * 
 * Requirements: 1.5, 11.1, 11.2, 11.3, 11.4, 11.5
 */

const path = require('path');
const crypto = require('crypto');

/**
 * Allowed file types for upload
 * Maps MIME types to their valid extensions
 */
const ALLOWED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp']
};

/**
 * Maximum file size in bytes (5MB)
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Validate uploaded file
 * Checks file size, MIME type, and extension match
 * 
 * @param {Object} file - Uploaded file object
 * @param {number} file.size - File size in bytes
 * @param {string} file.mimetype - File MIME type
 * @param {string} file.name - Original filename
 * @returns {Object} Validation result with valid boolean and errors array
 */
const validateFile = (file) => {
  const errors = [];

  // Check if file object is valid
  if (!file || typeof file !== 'object') {
    return {
      valid: false,
      errors: ['Invalid file object']
    };
  }

  // Check file size
  if (typeof file.size !== 'number' || file.size > MAX_FILE_SIZE) {
    errors.push('File size exceeds 5MB limit');
  }

  // Check MIME type
  if (!file.mimetype || !ALLOWED_TYPES[file.mimetype]) {
    errors.push('File type not allowed. Allowed types: JPEG, PNG, GIF, WebP');
  }

  // Check extension matches MIME type
  if (file.name) {
    const ext = path.extname(file.name).toLowerCase();
    const allowedExts = ALLOWED_TYPES[file.mimetype] || [];
    if (!allowedExts.includes(ext)) {
      errors.push('File extension does not match file type');
    }
  } else {
    errors.push('File name is required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Generate secure filename
 * Creates a randomized filename that is not predictable from the original
 * 
 * @param {string} originalName - Original filename
 * @returns {string} Secure filename with timestamp and random hex string
 */
const generateSecureFilename = (originalName) => {
  if (!originalName || typeof originalName !== 'string') {
    // Generate a completely random name if no original provided
    const randomName = crypto.randomBytes(16).toString('hex');
    return `${Date.now()}-${randomName}`;
  }

  // path.extname returns empty string for filenames like ".jpg" (starting with dot)
  // In such cases, treat the entire filename as the extension
  let ext = path.extname(originalName).toLowerCase();
  if (!ext && originalName.startsWith('.')) {
    ext = originalName.toLowerCase();
  }
  
  const randomName = crypto.randomBytes(16).toString('hex');
  return `${Date.now()}-${randomName}${ext}`;
};

/**
 * File upload validation middleware
 * Validates uploaded files before processing
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Next middleware function
 */
const validateUpload = (req, res, next) => {
  // Check if files exist in request
  if (!req.files || !req.files.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const file = req.files.file;
  const validation = validateFile(file);

  if (!validation.valid) {
    return res.status(400).json({
      message: 'File validation failed',
      errors: validation.errors
    });
  }

  // Attach secure filename to request for later use
  req.secureFilename = generateSecureFilename(file.name);

  next();
};

module.exports = {
  ALLOWED_TYPES,
  MAX_FILE_SIZE,
  validateFile,
  generateSecureFilename,
  validateUpload
};
