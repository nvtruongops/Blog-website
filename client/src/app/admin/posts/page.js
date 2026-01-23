'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { getAllPosts, deletePostAdmin } from '@/lib/adminApi';
import styles from '../admin.module.css';

/**
 * Posts Management Page
 * List, search, filter, and manage posts
 */
export default function PostsPage() {
    const [posts, setPosts] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');

    // Modal states
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        const result = await getAllPosts({
            page: pagination.page,
            limit: pagination.limit,
            search,
            category: categoryFilter,
            sortBy,
            sortOrder
        });

        if (result.success) {
            setPosts(result.data.posts);
            setPagination(prev => ({ ...prev, ...result.data.pagination }));
        }
        setLoading(false);
    }, [pagination.page, pagination.limit, search, categoryFilter, sortBy, sortOrder]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchPosts();
    };

    const handleDelete = async () => {
        if (!selectedPost) return;
        setActionLoading(true);

        const result = await deletePostAdmin(selectedPost._id);

        if (result.success) {
            setPosts(posts.filter(p => p._id !== selectedPost._id));
            setPagination(prev => ({ ...prev, total: prev.total - 1 }));
            setShowDeleteModal(false);
            setSelectedPost(null);
        }
        setActionLoading(false);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatNumber = (num) => {
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num?.toString() || '0';
    };

    return (
        <div>
            {/* Page Header */}
            <div style={{ marginBottom: '1.25rem' }}>
                <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.875rem' }}>
                    View and manage all posts in the system
                </p>
            </div>

            {/* Filter Bar */}
            <form onSubmit={handleSearch} className={styles.filterBar}>
                <div className={styles.searchBox}>
                    <span className={styles.searchIcon}>⌕</span>
                    <input
                        type="text"
                        placeholder="Search by title..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <select
                    className={styles.filterSelect}
                    value={categoryFilter}
                    onChange={(e) => { setCategoryFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                >
                    <option value="">All Categories</option>
                    <option value="food">Food</option>
                    <option value="travelling">Travelling</option>
                    <option value="lifestyle">Lifestyle</option>
                    <option value="tech">Tech</option>
                </select>

                <select
                    className={styles.filterSelect}
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                        const [newSortBy, newSortOrder] = e.target.value.split('-');
                        setSortBy(newSortBy);
                        setSortOrder(newSortOrder);
                    }}
                >
                    <option value="createdAt-desc">Newest First</option>
                    <option value="createdAt-asc">Oldest First</option>
                    <option value="views-desc">Most Views</option>
                    <option value="likes-desc">Most Likes</option>
                    <option value="title-asc">Title A-Z</option>
                </select>
            </form>

            {/* Posts Table */}
            <div className={styles.card}>
                {loading ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>Loading...</p>
                    </div>
                ) : posts.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>P</div>
                        <div className={styles.emptyTitle}>No posts found</div>
                        <div className={styles.emptyText}>Try adjusting your search filters</div>
                    </div>
                ) : (
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Post</th>
                                    <th>Author</th>
                                    <th>Category</th>
                                    <th>Views</th>
                                    <th>Likes</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {posts.map((post) => (
                                    <tr key={post._id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <img
                                                    src={post.image || '/default-post.png'}
                                                    alt={post.title}
                                                    style={{
                                                        width: '56px',
                                                        height: '36px',
                                                        objectFit: 'cover'
                                                    }}
                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                />
                                                <div style={{
                                                    maxWidth: '200px',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    fontWeight: 500
                                                }}>
                                                    {post.title}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.tableUser}>
                                                <img
                                                    src={post.user?.picture || '/default-avatar.svg'}
                                                    alt={post.user?.name}
                                                    className={styles.tableAvatar}
                                                    style={{ width: '28px', height: '28px' }}
                                                    onError={(e) => { e.target.src = '/default-avatar.svg'; }}
                                                />
                                                <div className={styles.tableUserInfo}>
                                                    <div className={styles.tableUserName} style={{ fontSize: '0.8125rem' }}>
                                                        {post.user?.name || 'Anonymous'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`${styles.badge} ${styles[post.category]}`}>
                                                {post.category}
                                            </span>
                                        </td>
                                        <td>{formatNumber(post.views)}</td>
                                        <td>{formatNumber(post.likes)}</td>
                                        <td>{formatDate(post.createdAt)}</td>
                                        <td>
                                            <div className={styles.actionGroup}>
                                                <Link
                                                    href={`/article/${post._id}`}
                                                    className={`${styles.actionBtn} ${styles.view}`}
                                                    title="View post"
                                                    target="_blank"
                                                >
                                                    ↗
                                                </Link>
                                                <button
                                                    className={`${styles.actionBtn} ${styles.delete}`}
                                                    title="Delete post"
                                                    onClick={() => { setSelectedPost(post); setShowDeleteModal(true); }}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {!loading && posts.length > 0 && (
                    <div className={styles.pagination}>
                        <div className={styles.paginationInfo}>
                            Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} posts
                        </div>
                        <div className={styles.paginationButtons}>
                            <button
                                className={styles.pageBtn}
                                disabled={pagination.page <= 1}
                                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                            >
                                Prev
                            </button>
                            {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                                const pageNum = i + 1;
                                return (
                                    <button
                                        key={pageNum}
                                        className={`${styles.pageBtn} ${pagination.page === pageNum ? styles.active : ''}`}
                                        onClick={() => setPagination(p => ({ ...p, page: pageNum }))}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            <button
                                className={styles.pageBtn}
                                disabled={pagination.page >= pagination.pages}
                                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Modal */}
            {showDeleteModal && selectedPost && (
                <div className={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalTitle}>Delete Post</div>
                        <div className={styles.modalText}>
                            Are you sure you want to delete <strong>"{selectedPost.title}"</strong>?
                            This action cannot be undone.
                        </div>
                        <div className={styles.modalActions}>
                            <button
                                className={`${styles.modalBtn} ${styles.cancel}`}
                                onClick={() => setShowDeleteModal(false)}
                                disabled={actionLoading}
                            >
                                Cancel
                            </button>
                            <button
                                className={`${styles.modalBtn} ${styles.danger}`}
                                onClick={handleDelete}
                                disabled={actionLoading}
                            >
                                {actionLoading ? 'Deleting...' : 'Delete Post'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
