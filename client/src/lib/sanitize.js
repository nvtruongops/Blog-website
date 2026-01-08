/**
 * XSS Prevention Utilities for Frontend
 * Provides sanitization functions for user-generated content
 * Requirements: 9.1, 9.4
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Allowed HTML tags for rich content (posts, comments)
 */
const ALLOWED_TAGS = [
  'b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 
  'a', 'img', 'h1', 'h2', 'h3', 'h4', 'blockquote', 'code', 'pre',
  'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'span', 'div',
  'font', 'u', 's', 'strike'
];

/**
 * Allowed HTML attributes
 */
const ALLOWED_ATTR = [
  'href', 'src', 'alt', 'class', 'style', 'target', 'rel',
  'width', 'height', 'align', 'color', 'size', 'face'
];

/**
 * Sanitize HTML content to prevent XSS attacks
 * Use this for rich text content like post bodies
 * @param {string} dirty - Potentially unsafe HTML content
 * @returns {string} Sanitized HTML safe for rendering
 */
export const sanitizeHTML = (dirty) => {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }
  
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    // Remove javascript: URLs
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
    // Force all links to open in new tab with noopener
    ADD_ATTR: ['target', 'rel'],
    FORCE_BODY: true
  });
};

/**
 * Escape HTML entities in plain text
 * Use this for user names, comments, and other plain text content
 * @param {string} text - Plain text that may contain HTML characters
 * @returns {string} Text with HTML entities escaped
 */
export const escapeHTML = (text) => {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  const htmlEntities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };
  
  return text.replace(/[&<>"'`=/]/g, (char) => htmlEntities[char]);
};

/**
 * Sanitize text for safe display (strips all HTML)
 * Use this when you want to display plain text only
 * @param {string} dirty - Text that may contain HTML
 * @returns {string} Plain text with all HTML removed
 */
export const stripHTML = (dirty) => {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }
  
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
};

/**
 * Sanitize URL to prevent javascript: and data: URLs
 * @param {string} url - URL to sanitize
 * @returns {string} Safe URL or empty string if unsafe
 */
export const sanitizeURL = (url) => {
  if (!url || typeof url !== 'string') {
    return '';
  }
  
  const trimmedUrl = url.trim().toLowerCase();
  
  // Block dangerous protocols
  if (
    trimmedUrl.startsWith('javascript:') ||
    trimmedUrl.startsWith('data:') ||
    trimmedUrl.startsWith('vbscript:')
  ) {
    return '';
  }
  
  return url;
};

/**
 * Create safe props for dangerouslySetInnerHTML
 * @param {string} html - HTML content to sanitize
 * @returns {object} Props object for dangerouslySetInnerHTML
 */
export const createSafeHTML = (html) => {
  return {
    __html: sanitizeHTML(html)
  };
};

export default {
  sanitizeHTML,
  escapeHTML,
  stripHTML,
  sanitizeURL,
  createSafeHTML
};
