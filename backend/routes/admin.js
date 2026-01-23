/**
 * Admin Routes
 * All routes require authentication and admin role
 */

const express = require('express');
const router = express.Router();
const { authUser } = require('../middleware/auth');
const { isAdmin } = require('../middleware/adminAuth');
const {
    getDashboardStats,
    getAllUsers,
    getUserById,
    updateUserRole,
    deleteUser,
    getAllPosts,
    getPostById,
    deletePost,
    getSecurityLogs,
    getTopPosts,
    getRecentActivity
} = require('../controllers/admin');

// Apply auth middleware to all admin routes
router.use(authUser);
router.use(isAdmin);

// Dashboard
router.get('/stats', getDashboardStats);
router.get('/recent-activity', getRecentActivity);
router.get('/top-posts', getTopPosts);

// User management
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

// Post management
router.get('/posts', getAllPosts);
router.get('/posts/:id', getPostById);
router.delete('/posts/:id', deletePost);

// Security logs
router.get('/security-logs', getSecurityLogs);

module.exports = router;
