const jwt = require("jsonwebtoken");
const keys = require("../config/keys");

/**
 * Verify JWT token and attach user to request
 * Enhanced with detailed error handling for different token issues
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Next middleware
 */
const authUser = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const token = authHeader.slice(7);

    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    jwt.verify(token, keys.TOKEN_SECRET, (err, decoded) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          return res.status(401).json({ message: "Token expired" });
        }
        if (err.name === "JsonWebTokenError") {
          return res.status(401).json({ message: "Invalid token" });
        }
        if (err.name === "NotBeforeError") {
          return res.status(401).json({ message: "Token not yet valid" });
        }
        return res.status(401).json({ message: "Invalid token" });
      }

      // Validate token payload has required claims
      if (!decoded.id) {
        return res.status(401).json({ message: "Invalid token payload" });
      }

      req.user = decoded;
      next();
    });
  } catch (error) {
    return res.status(500).json({ message: "Authentication error" });
  }
};

/**
 * Verify resource ownership
 * Compares the resource's user ID with the requesting user's ID
 * @param {string} resourceUserId - User ID from the resource (e.g., post owner)
 * @param {string} requestUserId - User ID from the authenticated request
 * @returns {boolean} Whether the user owns the resource
 */
const verifyOwnership = (resourceUserId, requestUserId) => {
  if (!resourceUserId || !requestUserId) {
    return false;
  }
  return resourceUserId.toString() === requestUserId.toString();
};

/**
 * Optional authentication middleware
 * Attaches user to request if valid token exists, but doesn't fail if no token
 * Useful for endpoints that behave differently for authenticated vs anonymous users
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Next middleware
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.slice(7);

    if (!token) {
      return next();
    }

    jwt.verify(token, keys.TOKEN_SECRET, (err, decoded) => {
      if (!err && decoded && decoded.id) {
        req.user = decoded;
      }
      next();
    });
  } catch (error) {
    // Don't fail on errors, just continue without user
    next();
  }
};

module.exports = {
  authUser,
  verifyOwnership,
  optionalAuth
};
