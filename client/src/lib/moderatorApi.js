/**
 * Moderator API Functions
 * API calls for moderator dashboard functionality
 */

import axios from 'axios';
import Cookies from 'js-cookie';
import { getCSRFToken } from './api';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

/**
 * Get auth headers for moderator requests
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
 * Create moderator axios instance
 */
const createModeratorAxios = () => {
    const instance = axios.create({
        baseURL: `${API_URL}/moderator`,
        withCredentials: true,
    });

    instance.interceptors.request.use(async (config) => {
        const headers = await getAuthHeaders();
        config.headers = { ...config.headers, ...headers };
        return config;
    });

    return instance;
};

const moderatorAxios = createModeratorAxios();

/**
 * Handle API errors
 */
const handleError = (error, defaultMessage = 'An error occurred') => {
    console.error('Moderator API Error:', error);
    return {
        success: false,
        error: error.response?.data?.message || defaultMessage,
        status: error.response?.status || 500,
    };
};

// ============ Dashboard ============

/**
 * Get moderator dashboard statistics
 */
export const getModeratorStats = async () => {
    try {
        const { data } = await moderatorAxios.get('/stats');
        return { success: true, data };
    } catch (error) {
        return handleError(error, 'Failed to fetch moderator statistics');
    }
};

// ============ Reports Management ============

/**
 * Get all reports with pagination and filters
 */
export const getReports = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams({
            page: params.page || 1,
            limit: params.limit || 10,
            status: params.status || '',
            targetType: params.targetType || '',
            reason: params.reason || '',
            sortBy: params.sortBy || 'createdAt',
            sortOrder: params.sortOrder || 'desc',
        });

        const { data } = await moderatorAxios.get(`/reports?${queryParams}`);
        return { success: true, data };
    } catch (error) {
        return handleError(error, 'Failed to fetch reports');
    }
};

/**
 * Get report by ID
 */
export const getReportById = async (id) => {
    try {
        const { data } = await moderatorAxios.get(`/reports/${id}`);
        return { success: true, data };
    } catch (error) {
        return handleError(error, 'Failed to fetch report details');
    }
};

/**
 * Update report status
 */
export const updateReport = async (id, updateData) => {
    try {
        const { data } = await moderatorAxios.put(`/reports/${id}`, updateData);
        return { success: true, data };
    } catch (error) {
        return handleError(error, 'Failed to update report');
    }
};

// ============ User Management ============

/**
 * Get banned users
 */
export const getBannedUsers = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams({
            page: params.page || 1,
            limit: params.limit || 10,
        });

        const { data } = await moderatorAxios.get(`/users/banned?${queryParams}`);
        return { success: true, data };
    } catch (error) {
        return handleError(error, 'Failed to fetch banned users');
    }
};

/**
 * Ban user
 */
export const banUser = async (id, reason) => {
    try {
        const { data } = await moderatorAxios.put(`/users/${id}/ban`, { reason });
        return { success: true, data };
    } catch (error) {
        return handleError(error, 'Failed to ban user');
    }
};

/**
 * Unban user
 */
export const unbanUser = async (id) => {
    try {
        const { data } = await moderatorAxios.put(`/users/${id}/unban`);
        return { success: true, data };
    } catch (error) {
        return handleError(error, 'Failed to unban user');
    }
};

// ============ Post Management ============

/**
 * Get posts for moderation
 */
export const getPostsForModeration = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams({
            page: params.page || 1,
            limit: params.limit || 10,
            search: params.search || '',
            category: params.category || '',
        });

        const { data } = await moderatorAxios.get(`/posts?${queryParams}`);
        return { success: true, data };
    } catch (error) {
        return handleError(error, 'Failed to fetch posts');
    }
};

/**
 * Delete post (moderator)
 */
export const deletePost = async (id, reason) => {
    try {
        const { data } = await moderatorAxios.delete(`/posts/${id}`, {
            data: { reason }
        });
        return { success: true, data };
    } catch (error) {
        return handleError(error, 'Failed to delete post');
    }
};

/**
 * Delete comment
 */
export const deleteComment = async (postId, commentIndex) => {
    try {
        const { data } = await moderatorAxios.delete(`/posts/${postId}/comments/${commentIndex}`);
        return { success: true, data };
    } catch (error) {
        return handleError(error, 'Failed to delete comment');
    }
};

/**
 * Check if current user is moderator
 */
export const checkIsModerator = async () => {
    try {
        const { data } = await moderatorAxios.get('/stats');
        return { isModerator: true };
    } catch (error) {
        return { isModerator: false };
    }
};
