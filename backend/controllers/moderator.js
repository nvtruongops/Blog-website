/**
 * Moderator Controller
 * Handles operations available to moderators
 * Moderators can: view reports, delete posts, delete comments, ban users (not delete)
 */

const User = require('../models/User');
const Post = require('../models/Post');
const Report = require('../models/Report');

/**
 * Get moderator dashboard stats
 * @route GET /moderator/stats
 */
const getModeratorStats = async (req, res) => {
    try {
        const pendingReports = await Report.countDocuments({ status: 'pending' });
        const reviewingReports = await Report.countDocuments({ status: 'reviewing' });
        const resolvedToday = await Report.countDocuments({
            status: 'resolved',
            reviewedAt: { $gte: new Date().setHours(0, 0, 0, 0) }
        });
        const bannedUsers = await User.countDocuments({ isBanned: true });

        // Reports by type
        const reportsByType = await Report.aggregate([
            { $match: { status: 'pending' } },
            { $group: { _id: '$reason', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        res.json({
            reports: {
                pending: pendingReports,
                reviewing: reviewingReports,
                resolvedToday
            },
            bannedUsers,
            reportsByType
        });
    } catch (error) {
        console.error('Moderator stats error:', error);
        res.status(500).json({ message: 'Error fetching moderator statistics' });
    }
};

/**
 * Get all reports with pagination and filters
 * @route GET /moderator/reports
 */
const getReports = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status || '';
        const targetType = req.query.targetType || '';
        const reason = req.query.reason || '';
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

        const filter = {};
        if (status) filter.status = status;
        if (targetType) filter.targetType = targetType;
        if (reason) filter.reason = reason;

        const total = await Report.countDocuments(filter);
        const reports = await Report.find(filter)
            .populate('reporter', 'name email picture')
            .populate('reviewedBy', 'name email')
            .sort({ [sortBy]: sortOrder })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        // Populate target content details
        const populatedReports = await Promise.all(reports.map(async (report) => {
            let targetContent = null;
            if (report.targetType === 'post') {
                targetContent = await Post.findById(report.targetId)
                    .select('title category user')
                    .populate('user', 'name email')
                    .lean();
            } else if (report.targetType === 'user') {
                targetContent = await User.findById(report.targetId)
                    .select('name email picture role isBanned')
                    .lean();
            }
            return { ...report, targetContent };
        }));

        res.json({
            reports: populatedReports,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({ message: 'Error fetching reports' });
    }
};

/**
 * Get single report details
 * @route GET /moderator/reports/:id
 */
const getReportById = async (req, res) => {
    try {
        const { id } = req.params;
        const report = await Report.findById(id)
            .populate('reporter', 'name email picture')
            .populate('reviewedBy', 'name email')
            .lean();

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        // Get target content
        let targetContent = null;
        if (report.targetType === 'post') {
            targetContent = await Post.findById(report.targetId)
                .populate('user', 'name email picture')
                .lean();
        } else if (report.targetType === 'user') {
            targetContent = await User.findById(report.targetId)
                .select('-password -tempPassword')
                .lean();
        }

        res.json({ report, targetContent });
    } catch (error) {
        console.error('Get report by ID error:', error);
        res.status(500).json({ message: 'Error fetching report details' });
    }
};

/**
 * Update report status and take action
 * @route PUT /moderator/reports/:id
 */
const updateReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, actionTaken, reviewNotes } = req.body;

        const report = await Report.findById(id);
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        // Update report
        report.status = status || report.status;
        report.actionTaken = actionTaken || report.actionTaken;
        report.reviewNotes = reviewNotes || report.reviewNotes;
        report.reviewedBy = req.user.id;
        report.reviewedAt = new Date();

        await report.save();

        res.json({ message: 'Report updated successfully', report });
    } catch (error) {
        console.error('Update report error:', error);
        res.status(500).json({ message: 'Error updating report' });
    }
};

/**
 * Ban a user (moderator action)
 * @route PUT /moderator/users/:id/ban
 */
const banUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        // Cannot ban yourself
        if (id === req.user.id) {
            return res.status(400).json({ message: 'Cannot ban yourself' });
        }

        const targetUser = await User.findById(id);
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Cannot ban admin users (moderators can't ban admins)
        if (targetUser.role === 'admin') {
            return res.status(403).json({ message: 'Cannot ban admin users' });
        }

        // Only admins can ban moderators
        if (targetUser.role === 'moderator' && req.userRole !== 'admin') {
            return res.status(403).json({ message: 'Only admins can ban moderators' });
        }

        targetUser.isBanned = true;
        targetUser.bannedAt = new Date();
        targetUser.bannedBy = req.user.id;
        targetUser.banReason = reason || 'Violation of community guidelines';
        await targetUser.save();

        res.json({ message: 'User banned successfully', user: targetUser });
    } catch (error) {
        console.error('Ban user error:', error);
        res.status(500).json({ message: 'Error banning user' });
    }
};

/**
 * Unban a user
 * @route PUT /moderator/users/:id/unban
 */
const unbanUser = async (req, res) => {
    try {
        const { id } = req.params;

        const targetUser = await User.findById(id);
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!targetUser.isBanned) {
            return res.status(400).json({ message: 'User is not banned' });
        }

        targetUser.isBanned = false;
        targetUser.bannedAt = null;
        targetUser.bannedBy = null;
        targetUser.banReason = null;
        await targetUser.save();

        res.json({ message: 'User unbanned successfully', user: targetUser });
    } catch (error) {
        console.error('Unban user error:', error);
        res.status(500).json({ message: 'Error unbanning user' });
    }
};

/**
 * Get banned users list
 * @route GET /moderator/users/banned
 */
const getBannedUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const filter = { isBanned: true };
        const total = await User.countDocuments(filter);
        const users = await User.find(filter)
            .select('name email picture role isBanned bannedAt bannedBy banReason createdAt')
            .populate('bannedBy', 'name email')
            .sort({ bannedAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        res.json({
            users,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        console.error('Get banned users error:', error);
        res.status(500).json({ message: 'Error fetching banned users' });
    }
};

/**
 * Delete post (moderator action)
 * @route DELETE /moderator/posts/:id
 */
const deletePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Remove post from user's posts array
        await User.findByIdAndUpdate(post.user, {
            $pull: { posts: id }
        });

        // Delete post
        await Post.findByIdAndDelete(id);

        // Update any related reports
        await Report.updateMany(
            { targetType: 'post', targetId: id },
            {
                status: 'resolved',
                actionTaken: 'content_removed',
                reviewedBy: req.user.id,
                reviewedAt: new Date(),
                reviewNotes: reason || 'Content removed by moderator'
            }
        );

        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Moderator delete post error:', error);
        res.status(500).json({ message: 'Error deleting post' });
    }
};

/**
 * Delete comment from a post
 * @route DELETE /moderator/posts/:postId/comments/:commentIndex
 */
const deleteComment = async (req, res) => {
    try {
        const { postId, commentIndex } = req.params;
        const index = parseInt(commentIndex);

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (index < 0 || index >= post.comments.length) {
            return res.status(400).json({ message: 'Invalid comment index' });
        }

        // Remove comment at index
        post.comments.splice(index, 1);
        await post.save();

        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ message: 'Error deleting comment' });
    }
};

/**
 * Get all posts for moderation
 * @route GET /moderator/posts
 */
const getPostsForModeration = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const category = req.query.category || '';

        const filter = {};
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        if (category) filter.category = category;

        const total = await Post.countDocuments(filter);
        const posts = await Post.find(filter)
            .populate('user', 'name email picture')
            .select('-content')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        res.json({
            posts,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        console.error('Get posts for moderation error:', error);
        res.status(500).json({ message: 'Error fetching posts' });
    }
};

/**
 * Create a new report (for users)
 * @route POST /reports
 */
const createReport = async (req, res) => {
    try {
        const { targetType, targetId, reason, description } = req.body;

        // Validate target exists
        let targetExists = false;
        let targetModel = '';

        if (targetType === 'post' || targetType === 'comment') {
            targetExists = await Post.exists({ _id: targetId });
            targetModel = 'Post';
        } else if (targetType === 'user') {
            targetExists = await User.exists({ _id: targetId });
            targetModel = 'User';
        }

        if (!targetExists) {
            return res.status(404).json({ message: 'Target content not found' });
        }

        // Check for duplicate reports
        const existingReport = await Report.findOne({
            reporter: req.user.id,
            targetType,
            targetId,
            status: { $in: ['pending', 'reviewing'] }
        });

        if (existingReport) {
            return res.status(400).json({ message: 'You have already reported this content' });
        }

        const report = new Report({
            reporter: req.user.id,
            targetType,
            targetId,
            targetModel,
            reason,
            description
        });

        await report.save();
        res.status(201).json({ message: 'Report submitted successfully', report });
    } catch (error) {
        console.error('Create report error:', error);
        res.status(500).json({ message: 'Error submitting report' });
    }
};

module.exports = {
    getModeratorStats,
    getReports,
    getReportById,
    updateReport,
    banUser,
    unbanUser,
    getBannedUsers,
    deletePost,
    deleteComment,
    getPostsForModeration,
    createReport
};
