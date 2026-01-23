/**
 * Moderator Routes
 * Routes for moderator functionality
 * Moderators can: view reports, delete posts, delete comments, ban users
 */

const express = require('express');
const router = express.Router();
const { authUser } = require('../middleware/auth');
const { isModerator } = require('../middleware/moderatorAuth');
const {
    getModeratorStats,
    getReports,
    getReportById,
    updateReport,
    banUser,
    unbanUser,
    getBannedUsers,
    deletePost,
    deleteComment,
    getPostsForModeration
} = require('../controllers/moderator');

// Apply auth middleware to all moderator routes
router.use(authUser);
router.use(isModerator);

// Dashboard
router.get('/stats', getModeratorStats);

// Reports
router.get('/reports', getReports);
router.get('/reports/:id', getReportById);
router.put('/reports/:id', updateReport);

// User management (ban only, no delete)
router.get('/users/banned', getBannedUsers);
router.put('/users/:id/ban', banUser);
router.put('/users/:id/unban', unbanUser);

// Post management
router.get('/posts', getPostsForModeration);
router.delete('/posts/:id', deletePost);

// Comment management
router.delete('/posts/:postId/comments/:commentIndex', deleteComment);

module.exports = router;
