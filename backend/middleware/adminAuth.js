/**
 * Admin Authentication Middleware
 * Checks if user is authenticated and has admin role
 */

const User = require('../models/User');

/**
 * Middleware to check if user is an admin
 * Must be used after authUser middleware
 */
const isAdmin = async (req, res, next) => {
    try {
        // Check if user is authenticated
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                message: 'Authentication required'
            });
        }

        // Fetch user from database to get role and banned status
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

        // Check if user has admin role
        if (user.role !== 'admin') {
            return res.status(403).json({
                message: 'Access denied. Admin privileges required.'
            });
        }

        // Add admin flag to request
        req.isAdmin = true;
        req.userRole = 'admin';
        next();
    } catch (error) {
        console.error('Admin auth error:', error);
        return res.status(500).json({
            message: 'Server error during authorization'
        });
    }
};

module.exports = { isAdmin };
