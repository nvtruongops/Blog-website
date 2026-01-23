'use client';

import { useEffect, useState } from 'react';
import { getBannedUsers, unbanUser } from '@/lib/moderatorApi';
import styles from '../moderator.module.css';

export default function BannedUsersPage() {
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [showUnbanModal, setShowUnbanModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        fetchBannedUsers();
    }, [pagination.page]);

    const fetchBannedUsers = async () => {
        setLoading(true);
        try {
            const response = await getBannedUsers({
                page: pagination.page,
                limit: 10
            });

            if (response.success) {
                setUsers(response.data.users);
                setPagination(prev => ({ ...prev, ...response.data.pagination }));
            }
        } catch (err) {
            console.error('Error fetching banned users:', err);
        }
        setLoading(false);
    };

    const handleUnban = async () => {
        try {
            const response = await unbanUser(selectedUser._id);
            if (response.success) {
                setShowUnbanModal(false);
                setSelectedUser(null);
                fetchBannedUsers();
            } else {
                alert(response.error);
            }
        } catch (err) {
            console.error('Error unbanning user:', err);
            alert('Failed to unban user');
        }
    };

    return (
        <div>
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>🚫 Banned Users ({pagination.total})</h3>
                </div>

                {loading ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>Loading banned users...</p>
                    </div>
                ) : users.length > 0 ? (
                    <>
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Role</th>
                                        <th>Banned At</th>
                                        <th>Banned By</th>
                                        <th>Reason</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user._id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <img
                                                        src={user.picture || '/default-avatar.svg'}
                                                        alt=""
                                                        style={{ width: 36, height: 36, borderRadius: '50%' }}
                                                    />
                                                    <div>
                                                        <div style={{ fontWeight: 500 }}>{user.name || 'Unknown'}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--mod-text-muted)' }}>
                                                            {user.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`${styles.badge}`} style={{
                                                    background: user.role === 'moderator' ? '#e0e7ff' : 'var(--mod-slate-pale)',
                                                    color: user.role === 'moderator' ? '#3730a3' : 'var(--mod-slate)'
                                                }}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td>
                                                {user.bannedAt
                                                    ? new Date(user.bannedAt).toLocaleString('vi-VN')
                                                    : 'N/A'}
                                            </td>
                                            <td>{user.bannedBy?.name || 'System'}</td>
                                            <td>
                                                <span style={{
                                                    maxWidth: 200,
                                                    display: 'inline-block',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {user.banReason || 'No reason provided'}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setShowUnbanModal(true);
                                                    }}
                                                >
                                                    Unban
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className={styles.pagination}>
                            <div className={styles.paginationInfo}>
                                Showing {users.length} of {pagination.total} users
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
                        <h3>No banned users</h3>
                        <p>There are currently no banned users in the system.</p>
                    </div>
                )}
            </div>

            {/* Unban Modal */}
            {showUnbanModal && selectedUser && (
                <div className={styles.modalOverlay} onClick={() => setShowUnbanModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>Unban User</h3>
                            <button className={styles.modalClose} onClick={() => setShowUnbanModal(false)}>×</button>
                        </div>
                        <div className={styles.modalBody}>
                            <p>Are you sure you want to unban <strong>{selectedUser.name}</strong>?</p>
                            <p style={{ marginTop: '0.5rem', color: 'var(--mod-text-muted)', fontSize: '0.875rem' }}>
                                This will restore their access to the platform.
                            </p>
                            {selectedUser.banReason && (
                                <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--mod-bg)', borderRadius: '8px' }}>
                                    <strong>Original ban reason:</strong>
                                    <p style={{ marginTop: '0.25rem' }}>{selectedUser.banReason}</p>
                                </div>
                            )}
                        </div>
                        <div className={styles.modalFooter}>
                            <button
                                className={`${styles.btn} ${styles.btnSecondary}`}
                                onClick={() => setShowUnbanModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className={`${styles.btn} ${styles.btnPrimary}`}
                                onClick={handleUnban}
                            >
                                Confirm Unban
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
