'use client';

import { useEffect, useState } from 'react';
import { getPostsForModeration, deletePost, banUser } from '@/lib/moderatorApi';
import styles from '../moderator.module.css';

export default function PostModerationPage() {
    const [posts, setPosts] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [deleteReason, setDeleteReason] = useState('');

    useEffect(() => {
        fetchPosts();
    }, [pagination.page, search, category]);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const response = await getPostsForModeration({
                page: pagination.page,
                limit: 10,
                search,
                category
            });

            if (response.success) {
                setPosts(response.data.posts);
                setPagination(prev => ({ ...prev, ...response.data.pagination }));
            }
        } catch (err) {
            console.error('Error fetching posts:', err);
        }
        setLoading(false);
    };

    const handleDelete = async () => {
        try {
            const response = await deletePost(selectedPost._id, deleteReason);
            if (response.success) {
                setShowDeleteModal(false);
                setSelectedPost(null);
                setDeleteReason('');
                fetchPosts();
            } else {
                alert(response.error);
            }
        } catch (err) {
            console.error('Error deleting post:', err);
            alert('Failed to delete post');
        }
    };

    const handleBanAuthor = async (userId) => {
        const reason = prompt('Enter ban reason:');
        if (!reason) return;

        try {
            const response = await banUser(userId, reason);
            if (response.success) {
                alert('User banned successfully');
                fetchPosts();
            } else {
                alert(response.error);
            }
        } catch (err) {
            console.error('Error banning user:', err);
            alert('Failed to ban user');
        }
    };

    return (
        <div>
            {/* Filters */}
            <div className={styles.card}>
                <div className={styles.filterBar}>
                    <div className={styles.searchBox}>
                        <input
                            type="text"
                            placeholder="Search posts..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPagination(p => ({ ...p, page: 1 }));
                            }}
                        />
                    </div>
                    <select
                        className={styles.filterSelect}
                        value={category}
                        onChange={(e) => {
                            setCategory(e.target.value);
                            setPagination(p => ({ ...p, page: 1 }));
                        }}
                    >
                        <option value="">All Categories</option>
                        <option value="food">Food</option>
                        <option value="travelling">Travelling</option>
                        <option value="lifestyle">Lifestyle</option>
                        <option value="tech">Tech</option>
                    </select>
                </div>
            </div>

            {/* Posts Table */}
            <div className={styles.card}>
                {loading ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>Loading posts...</p>
                    </div>
                ) : posts.length > 0 ? (
                    <>
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Post</th>
                                        <th>Author</th>
                                        <th>Category</th>
                                        <th>Stats</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {posts.map((post) => (
                                        <tr key={post._id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    {post.image && (
                                                        <img
                                                            src={post.image}
                                                            alt=""
                                                            style={{ width: 48, height: 36, objectFit: 'cover', borderRadius: 0, border: '1px solid var(--mod-border)' }}
                                                        />
                                                    )}
                                                    <div style={{ maxWidth: 200 }}>
                                                        <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {post.title}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <strong style={{ fontSize: '0.875rem' }}>{post.user?.name || 'Unknown'}</strong>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={styles.badge} style={{
                                                    background: 'transparent',
                                                    color: 'var(--mod-text)',
                                                    border: '1px solid var(--mod-border)'
                                                }}>
                                                    {post.category}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--mod-text-muted)', display: 'flex', flexDirection: 'column' }}>
                                                    <span>Views: {post.views || 0}</span>
                                                    <span>Likes: {post.likes || 0}</span>
                                                </div>
                                            </td>
                                            <td>{new Date(post.createdAt).toLocaleDateString('vi-VN')}</td>
                                            <td>
                                                <div className={styles.actionGroup}>
                                                    <a
                                                        href={`/post/${post._id}`}
                                                        target="_blank"
                                                        className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
                                                    >
                                                        View
                                                    </a>
                                                    <button
                                                        className={`${styles.btn} ${styles.btnDanger} ${styles.btnSmall}`}
                                                        onClick={() => {
                                                            setSelectedPost(post);
                                                            setShowDeleteModal(true);
                                                        }}
                                                    >
                                                        Delete
                                                    </button>
                                                    {post.user && (
                                                        <button
                                                            className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
                                                            onClick={() => handleBanAuthor(post.user._id)}
                                                            title="Ban Author"
                                                        >
                                                            Ban User
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className={styles.pagination}>
                            <div className={styles.paginationInfo}>
                                Showing {posts.length} of {pagination.total} posts
                            </div>
                            <div className={styles.paginationButtons}>
                                <button
                                    className={styles.pageBtn}
                                    disabled={pagination.page <= 1}
                                    onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                                >
                                    Previous
                                </button>
                                <span className={`${styles.pageBtn} ${styles.active}`}>
                                    {pagination.page}
                                </span>
                                <button
                                    className={styles.pageBtn}
                                    disabled={pagination.page >= pagination.pages}
                                    onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className={styles.emptyState}>
                        <h3>No posts found</h3>
                        <p>There are no posts matching your search criteria.</p>
                    </div>
                )}
            </div>

            {/* Delete Modal */}
            {showDeleteModal && selectedPost && (
                <div className={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>Delete Post</h3>
                            <button className={styles.modalClose} onClick={() => setShowDeleteModal(false)}>×</button>
                        </div>
                        <div className={styles.modalBody}>
                            <p>Are you sure you want to delete this post?</p>
                            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--mod-bg)', borderRadius: '8px' }}>
                                <strong>{selectedPost.title}</strong>
                                <p style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: 'var(--mod-text-muted)' }}>
                                    by {selectedPost.user?.name || 'Unknown'}
                                </p>
                            </div>
                            <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
                                <label>Reason for deletion</label>
                                <textarea
                                    value={deleteReason}
                                    onChange={(e) => setDeleteReason(e.target.value)}
                                    placeholder="Explain why this post is being removed..."
                                />
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button
                                className={`${styles.btn} ${styles.btnSecondary}`}
                                onClick={() => setShowDeleteModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className={`${styles.btn} ${styles.btnDanger}`}
                                onClick={handleDelete}
                            >
                                Delete Post
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
