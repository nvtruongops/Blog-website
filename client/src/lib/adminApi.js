/**
 * Admin API Functions
 * API calls for admin dashboard functionality
 */

import axios from 'axios';
import Cookies from 'js-cookie';
import { getCSRFToken } from './api';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

/**
 * Get auth headers for admin requests
 */
const getAuthHeaders = async () => {
    const userCookie = Cookies.get('user');
    let token = null;

    if (userCookie) {
        try {
            const userData = JSON.parse(userCookie);
            token = userData?.token || null;
        } catch {
            token = null;
        }
    }

    const csrfToken = await getCSRFToken();

    return {
        Authorization: token ? `Bearer ${token}` : '',
        'X-CSRF-Token': csrfToken || '',
    };
};

/**
 * Create admin axios instance
 */
const createAdminAxios = () => {
    const instance = axios.create({
        baseURL: `${API_URL}/admin`,
        withCredentials: true,
    });

    instance.interceptors.request.use(async (config) => {
        const headers = await getAuthHeaders();
        config.headers = { ...config.headers, ...headers };
        return config;
    });

    return instance;
};

const adminAxios = createAdminAxios();

/**
 * Handle API errors
 */
const handleError = (error, defaultMessage = 'An error occurred') => {
    console.error('Admin API Error:', error);
    return {
        success: false,
        error: error.response?.data?.message || defaultMessage,
        status: error.response?.status || 500,
    };
};

// ============ Dashboard ============

/**
 * Get dashboard statistics
 */
export const getDashboardStats = async () => {
    try {
        const { data } = await adminAxios.get('/stats');
        return { success: true, data };
    } catch (error) {
        return handleError(error, 'Failed to fetch dashboard statistics');
    }
};

/**
 * Get recent activity
 */
export const getRecentActivity = async (limit = 20) => {
    try {
        const { data } = await adminAxios.get(`/recent-activity?limit=${limit}`);
        return { success: true, data };
    } catch (error) {
        return handleError(error, 'Failed to fetch recent activity');
    }
};

/**
 * Get top posts
 */
export const getTopPosts = async (limit = 10, sortBy = 'views') => {
    try {
        const { data } = await adminAxios.get(`/top-posts?limit=${limit}&sortBy=${sortBy}`);
        return { success: true, data };
    } catch (error) {
        return handleError(error, 'Failed to fetch top posts');
    }
};

// ============ User Management ============

/**
 * Get all users with pagination and filters
 */
export const getAllUsers = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams({
            page: params.page || 1,
            limit: params.limit || 10,
            search: params.search || '',
            role: params.role || '',
            verified: params.verified ?? '',
            sortBy: params.sortBy || 'createdAt',
            sortOrder: params.sortOrder || 'desc',
        });

        const { data } = await adminAxios.get(`/users?${queryParams}`);
        return { success: true, data };
    } catch (error) {
        return handleError(error, 'Failed to fetch users');
    }
};

/**
 * Get user by ID
 */
export const getUserById = async (id) => {
    try {
        const { data } = await adminAxios.get(`/users/${id}`);
        return { success: true, data };
    } catch (error) {
        return handleError(error, 'Failed to fetch user details');
    }
};

/**
 * Update user role
 */
export const updateUserRole = async (id, role) => {
    try {
        const { data } = await adminAxios.put(`/users/${id}/role`, { role });
        return { success: true, data };
    } catch (error) {
        return handleError(error, 'Failed to update user role');
    }
};

/**
 * Delete user
 */
export const deleteUser = async (id) => {
    try {
        const { data } = await adminAxios.delete(`/users/${id}`);
        return { success: true, data };
    } catch (error) {
        return handleError(error, 'Failed to delete user');
    }
};

// ============ Post Management ============

/**
 * Get all posts with pagination and filters
 */
export const getAllPosts = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams({
            page: params.page || 1,
            limit: params.limit || 10,
            search: params.search || '',
            category: params.category || '',
            sortBy: params.sortBy || 'createdAt',
            sortOrder: params.sortOrder || 'desc',
        });

        const { data } = await adminAxios.get(`/posts?${queryParams}`);
        return { success: true, data };
    } catch (error) {
        return handleError(error, 'Failed to fetch posts');
    }
};

/**
 * Get post by ID
 */
export const getPostById = async (id) => {
    try {
        const { data } = await adminAxios.get(`/posts/${id}`);
        return { success: true, data };
    } catch (error) {
        return handleError(error, 'Failed to fetch post details');
    }
};

/**
 * Delete post (admin)
 */
export const deletePostAdmin = async (id) => {
    try {
        const { data } = await adminAxios.delete(`/posts/${id}`);
        return { success: true, data };
    } catch (error) {
        return handleError(error, 'Failed to delete post');
    }
};

// ============ Security Logs ============

/**
 * Get security logs with pagination and filters
 */
export const getSecurityLogs = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams({
            page: params.page || 1,
            limit: params.limit || 20,
            eventType: params.eventType || '',
            ip: params.ip || '',
            startDate: params.startDate || '',
            endDate: params.endDate || '',
        });

        const { data } = await adminAxios.get(`/security-logs?${queryParams}`);
        return { success: true, data };
    } catch (error) {
        return handleError(error, 'Failed to fetch security logs');
    }
};

/**
 * Check if current user is admin
 */
export const checkIsAdmin = async () => {
    try {
        // Try to access admin stats - if successful, user is admin
        const { data } = await adminAxios.get('/stats');
        return { isAdmin: true };
    } catch (error) {
        return { isAdmin: false };
    }
};
