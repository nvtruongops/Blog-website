/**
 * Admin Controller
 * Handles all admin-related operations
 */

const User = require('../models/User');
const Post = require('../models/Post');
const SecurityLog = require('../models/SecurityLog');
const LoginAttempt = require('../models/LoginAttempt');

/**
 * Get dashboard statistics
 * @route GET /admin/stats
 */
const getDashboardStats = async (req, res) => {
    try {
        // Get counts
        const totalUsers = await User.countDocuments();
        const totalPosts = await Post.countDocuments();
        const verifiedUsers = await User.countDocuments({ verify: true });
        const googleUsers = await User.countDocuments({ googleId: { $exists: true, $ne: null } });

        // Get total views and likes from all posts
        const postStats = await Post.aggregate([
            {
                $group: {
                    _id: null,
                    totalViews: { $sum: '$views' },
                    totalLikes: { $sum: '$likes' },
                    totalComments: { $sum: { $size: '$comments' } }
                }
            }
        ]);

        // Get posts by category
        const postsByCategory = await Post.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // Get new users this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const newUsersThisMonth = await User.countDocuments({
            createdAt: { $gte: startOfMonth }
        });

        // Get new posts this month
        const newPostsThisMonth = await Post.countDocuments({
            createdAt: { $gte: startOfMonth }
        });

        // Get posts per day for last 7 days
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);
        const postsPerDay = await Post.aggregate([
            {
                $match: {
                    createdAt: { $gte: last7Days }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Get users per day for last 7 days
        const usersPerDay = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: last7Days }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Get security events count by type (last 24 hours)
        const last24Hours = new Date();
        last24Hours.setHours(last24Hours.getHours() - 24);
        const securityEvents = await SecurityLog.aggregate([
            {
                $match: {
                    timestamp: { $gte: last24Hours }
                }
            },
            {
                $group: {
                    _id: '$eventType',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            users: {
                total: totalUsers,
                verified: verifiedUsers,
                google: googleUsers,
                newThisMonth: newUsersThisMonth
            },
            posts: {
                total: totalPosts,
                newThisMonth: newPostsThisMonth,
                byCategory: postsByCategory
            },
            engagement: {
                totalViews: postStats[0]?.totalViews || 0,
                totalLikes: postStats[0]?.totalLikes || 0,
                totalComments: postStats[0]?.totalComments || 0
            },
            charts: {
                postsPerDay,
                usersPerDay
            },
            security: {
                events24h: securityEvents
            }
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ message: 'Error fetching dashboard statistics' });
    }
};

/**
 * Get all users with pagination and filters
 * @route GET /admin/users
 */
const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const role = req.query.role || '';
        const verified = req.query.verified;
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

        // Build filter query
        const filter = {};

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        if (role) {
            filter.role = role;
        }

        if (verified !== undefined && verified !== '') {
            filter.verify = verified === 'true';
        }

        const total = await User.countDocuments(filter);
        const users = await User.find(filter)
            .select('-password -tempPassword -likeslist -bookmarkslist')
            .sort({ [sortBy]: sortOrder })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        // Get post count for each user
        const usersWithStats = await Promise.all(users.map(async (user) => {
            const postCount = await Post.countDocuments({ user: user._id });
            return {
                ...user,
                postCount
            };
        }));

        res.json({
            users: usersWithStats,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
};

/**
 * Get user details by ID
 * @route GET /admin/users/:id
 */
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id)
            .select('-password -tempPassword')
            .lean();

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get user's posts
        const posts = await Post.find({ user: id })
            .select('title category views likes createdAt')
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        // Get user's activity stats
        const totalPosts = await Post.countDocuments({ user: id });
        const totalViews = await Post.aggregate([
            { $match: { user: user._id } },
            { $group: { _id: null, total: { $sum: '$views' } } }
        ]);

        res.json({
            user,
            posts,
            stats: {
                totalPosts,
                totalViews: totalViews[0]?.total || 0,
                followers: user.followerscount || 0,
                following: user.followingcount || 0
            }
        });
    } catch (error) {
        console.error('Get user by ID error:', error);
        res.status(500).json({ message: 'Error fetching user details' });
    }
};

/**
 * Update user role
 * @route PUT /admin/users/:id/role
 */
const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        // Only allow user and moderator roles from this endpoint
        if (!['user', 'moderator'].includes(role)) {
            return res.status(400).json({ 
                message: 'Invalid role. Only "user" and "moderator" roles can be assigned from this interface.' 
            });
        }

        // Prevent admin from removing their own admin role
        if (id === req.user.id) {
            return res.status(400).json({
                message: 'Cannot modify your own role'
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent changing admin role
        if (user.role === 'admin') {
            return res.status(403).json({
                message: 'Cannot modify admin role from this interface'
            });
        }

        // Update role
        user.role = role;
        await user.save();

        const updatedUser = await User.findById(id).select('-password -tempPassword');

        res.json({
            message: 'User role updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({ message: 'Error updating user role' });
    }
};

/**
 * Delete user
 * @route DELETE /admin/users/:id
 */
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent admin from deleting themselves
        if (id === req.user.id) {
            return res.status(400).json({
                message: 'Cannot delete your own account'
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent deleting admin users
        if (user.role === 'admin') {
            return res.status(403).json({
                message: 'Cannot delete admin users from this interface'
            });
        }

        // Delete user's posts
        await Post.deleteMany({ user: id });

        // Delete user
        await User.findByIdAndDelete(id);

        res.json({ message: 'User and their posts deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Error deleting user' });
    }
};

/**
 * Get all posts with pagination and filters
 * @route GET /admin/posts
 */
const getAllPosts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const category = req.query.category || '';
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

        // Build filter query
        const filter = {};

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        if (category) {
            filter.category = category;
        }

        const total = await Post.countDocuments(filter);
        const posts = await Post.find(filter)
            .populate('user', 'name email picture')
            .select('-content')
            .sort({ [sortBy]: sortOrder })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        res.json({
            posts,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get posts error:', error);
        res.status(500).json({ message: 'Error fetching posts' });
    }
};

/**
 * Get post details by ID
 * @route GET /admin/posts/:id
 */
const getPostById = async (req, res) => {
    try {
        const { id } = req.params;

        const post = await Post.findById(id)
            .populate('user', 'name email picture')
            .lean();

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.json({ post });
    } catch (error) {
        console.error('Get post by ID error:', error);
        res.status(500).json({ message: 'Error fetching post details' });
    }
};

/**
 * Delete post
 * @route DELETE /admin/posts/:id
 */
const deletePost = async (req, res) => {
    try {
        const { id } = req.params;

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

        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ message: 'Error deleting post' });
    }
};

/**
 * Get security logs with pagination
 * @route GET /admin/security-logs
 */
const getSecurityLogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const eventType = req.query.eventType || '';
        const ip = req.query.ip || '';
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;

        // Build filter query
        const filter = {};

        if (eventType) {
            filter.eventType = eventType;
        }

        if (ip) {
            filter.ip = { $regex: ip, $options: 'i' };
        }

        if (startDate || endDate) {
            filter.timestamp = {};
            if (startDate) {
                filter.timestamp.$gte = new Date(startDate);
            }
            if (endDate) {
                filter.timestamp.$lte = new Date(endDate);
            }
        }

        const total = await SecurityLog.countDocuments(filter);
        const logs = await SecurityLog.find(filter)
            .populate('userId', 'name email')
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        res.json({
            logs,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get security logs error:', error);
        res.status(500).json({ message: 'Error fetching security logs' });
    }
};

/**
 * Get top posts (most viewed/liked)
 * @route GET /admin/top-posts
 */
const getTopPosts = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const sortBy = req.query.sortBy || 'views'; // 'views' or 'likes'

        const posts = await Post.find()
            .populate('user', 'name picture')
            .select('title category views likes image createdAt')
            .sort({ [sortBy]: -1 })
            .limit(limit)
            .lean();

        res.json({ posts });
    } catch (error) {
        console.error('Get top posts error:', error);
        res.status(500).json({ message: 'Error fetching top posts' });
    }
};

/**
 * Get recent activity
 * @route GET /admin/recent-activity
 */
const getRecentActivity = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;

        // Get recent posts
        const recentPosts = await Post.find()
            .populate('user', 'name picture')
            .select('title category createdAt')
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        // Get recent users
        const recentUsers = await User.find()
            .select('name email picture createdAt googleId')
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        // Combine and sort by date
        const activities = [
            ...recentPosts.map(p => ({
                type: 'post',
                title: `New post: ${p.title}`,
                user: p.user,
                category: p.category,
                createdAt: p.createdAt
            })),
            ...recentUsers.map(u => ({
                type: 'user',
                title: `New user: ${u.name || u.email}`,
                user: { name: u.name, picture: u.picture },
                isGoogle: !!u.googleId,
                createdAt: u.createdAt
            }))
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, limit);

        res.json({ activities });
    } catch (error) {
        console.error('Get recent activity error:', error);
        res.status(500).json({ message: 'Error fetching recent activity' });
    }
};

module.exports = {
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
};
