/**
 * Moderator Authentication Middleware
 * Checks if user is authenticated and has moderator or admin role
 */

const User = require('../models/User');

/**
 * Middleware to check if user is a moderator or admin
 * Must be used after authUser middleware
 */
const isModerator = async (req, res, next) => {
    try {
        // Check if user is authenticated
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                message: 'Authentication required'
            });
        }

        // Fetch user from database to get role
        const user = await User.findById(req.user.id).select('role isBanned');

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        // Check if user is banned
        if (user.isBanned) {
            return res.status(403).json({
                message: 'Your account has been banned'
            });
        }

        // Check if user has moderator or admin role
        if (!['moderator', 'admin'].includes(user.role)) {
            return res.status(403).json({
                message: 'Access denied. Moderator privileges required.'
            });
        }

        // Add role flags to request
        req.isModerator = true;
        req.isAdmin = user.role === 'admin';
        req.userRole = user.role;
        next();
    } catch (error) {
        console.error('Moderator auth error:', error);
        return res.status(500).json({
            message: 'Server error during authorization'
        });
    }
};

/**
 * Middleware to check if user is admin only (not moderator)
 * Must be used after authUser middleware
 */
const isAdminOnly = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                message: 'Authentication required'
            });
        }

        const user = await User.findById(req.user.id).select('role');

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({
                message: 'Access denied. Admin privileges required.'
            });
        }

        req.isAdmin = true;
        req.userRole = 'admin';
        next();
    } catch (error) {
        console.error('Admin only auth error:', error);
        return res.status(500).json({
            message: 'Server error during authorization'
        });
    }
};

module.exports = { isModerator, isAdminOnly };
