'use client';

import { useEffect, useState, useCallback } from 'react';
import { getAllUsers, updateUserRole, deleteUser } from '@/lib/adminApi';
import styles from '../admin.module.css';

/**
 * Users Management Page
 * List, search, filter, and manage users
 */
export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [verifiedFilter, setVerifiedFilter] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');

    // Modal states
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedRole, setSelectedRole] = useState('user');
    const [actionLoading, setActionLoading] = useState(false);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        const result = await getAllUsers({
            page: pagination.page,
            limit: pagination.limit,
            search,
            role: roleFilter,
            verified: verifiedFilter,
            sortBy,
            sortOrder
        });

        if (result.success) {
            setUsers(result.data.users);
            setPagination(prev => ({ ...prev, ...result.data.pagination }));
        }
        setLoading(false);
    }, [pagination.page, pagination.limit, search, roleFilter, verifiedFilter, sortBy, sortOrder]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchUsers();
    };

    const handleRoleChange = async () => {
        if (!selectedUser || !selectedRole) return;
        
        // Prevent changing admin role
        if (selectedUser.role === 'admin') {
            alert('Không thể thay đổi quyền của Admin');
            return;
        }
        
        // Prevent setting to admin
        if (selectedRole === 'admin') {
            alert('Không thể cấp quyền Admin từ giao diện này');
            return;
        }
        
        setActionLoading(true);

        const result = await updateUserRole(selectedUser._id, selectedRole);

        if (result.success) {
            setUsers(users.map(u =>
                u._id === selectedUser._id ? { ...u, role: selectedRole } : u
            ));
            setShowRoleModal(false);
            setSelectedUser(null);
            setSelectedRole('user');
        }
        setActionLoading(false);
    };

    const handleDelete = async () => {
        if (!selectedUser) return;
        setActionLoading(true);

        const result = await deleteUser(selectedUser._id);

        if (result.success) {
            setUsers(users.filter(u => u._id !== selectedUser._id));
            setPagination(prev => ({ ...prev, total: prev.total - 1 }));
            setShowDeleteModal(false);
            setSelectedUser(null);
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

    return (
        <div>
            {/* Page Header */}
            <div style={{ marginBottom: '1.25rem' }}>
                <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.875rem' }}>
                    View and manage all users in the system
                </p>
            </div>

            {/* Filter Bar */}
            <form onSubmit={handleSearch} className={styles.filterBar}>
                <div className={styles.searchBox}>
                    <span className={styles.searchIcon}>⌕</span>
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <select
                    className={styles.filterSelect}
                    value={roleFilter}
                    onChange={(e) => { setRoleFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                >
                    <option value="">All Roles</option>
                    <option value="user">User</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                </select>

                <select
                    className={styles.filterSelect}
                    value={verifiedFilter}
                    onChange={(e) => { setVerifiedFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                >
                    <option value="">All Status</option>
                    <option value="true">Verified</option>
                    <option value="false">Unverified</option>
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
                    <option value="name-asc">Name A-Z</option>
                    <option value="name-desc">Name Z-A</option>
                </select>
            </form>

            {/* Users Table */}
            <div className={styles.card}>
                {loading ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>Loading...</p>
                    </div>
                ) : users.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>U</div>
                        <div className={styles.emptyTitle}>No users found</div>
                        <div className={styles.emptyText}>Try adjusting your search filters</div>
                    </div>
                ) : (
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Posts</th>
                                    <th>Joined</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user._id}>
                                        <td>
                                            <div className={styles.tableUser}>
                                                <img
                                                    src={user.picture || '/default-avatar.svg'}
                                                    alt={user.name}
                                                    className={styles.tableAvatar}
                                                    onError={(e) => { e.target.src = '/default-avatar.svg'; }}
                                                />
                                                <div className={styles.tableUserInfo}>
                                                    <div className={styles.tableUserName}>{user.name || 'No name'}</div>
                                                    <div className={styles.tableUserEmail}>{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`${styles.badge} ${styles[user.role]}`}>
                                                {user.role === 'admin' ? 'Admin' : user.role === 'moderator' ? 'Moderator' : 'User'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`${styles.badge} ${user.verify ? styles.verified : styles.unverified}`}>
                                                {user.verify ? 'Verified' : 'Unverified'}
                                            </span>
                                        </td>
                                        <td>{user.postCount || 0}</td>
                                        <td>{formatDate(user.createdAt)}</td>
                                        <td>
                                            <div className={styles.actionGroup}>
                                                <button
                                                    className={`${styles.actionBtn} ${styles.edit}`}
                                                    title="Change role"
                                                    onClick={() => { 
                                                        setSelectedUser(user); 
                                                        setSelectedRole(user.role === 'admin' ? 'admin' : user.role);
                                                        setShowRoleModal(true); 
                                                    }}
                                                    disabled={user.role === 'admin'}
                                                >
                                                    ⚙
                                                </button>
                                                <button
                                                    className={`${styles.actionBtn} ${styles.delete}`}
                                                    title="Delete user"
                                                    onClick={() => { setSelectedUser(user); setShowDeleteModal(true); }}
                                                    disabled={user.role === 'admin'}
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
                {!loading && users.length > 0 && (
                    <div className={styles.pagination}>
                        <div className={styles.paginationInfo}>
                            Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
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

            {/* Role Modal */}
            {showRoleModal && selectedUser && (
                <div className={styles.modalOverlay} onClick={() => setShowRoleModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalTitle}>Thay đổi quyền người dùng</div>
                        {selectedUser.role === 'admin' ? (
                            <div className={styles.modalText} style={{ color: 'var(--text-muted)' }}>
                                Không thể thay đổi quyền của Admin từ giao diện này.
                            </div>
                        ) : (
                            <>
                                <div className={styles.modalText}>
                                    Chọn quyền mới cho <strong>{selectedUser.name || selectedUser.email}</strong>:
                                </div>
                                <div style={{ margin: '1.5rem 0' }}>
                                    <select 
                                        className={styles.roleSelect}
                                        value={selectedRole}
                                        onChange={(e) => setSelectedRole(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            border: '2px solid var(--border-color)',
                                            borderRadius: 'var(--radius-md)',
                                            fontSize: '0.9375rem',
                                            background: 'var(--bg-input)',
                                            color: 'var(--text-primary)'
                                        }}
                                    >
                                        <option value="user">User - Người dùng thường</option>
                                        <option value="moderator">Moderator - Quản lý nội dung</option>
                                    </select>
                                    <div style={{ 
                                        marginTop: '0.75rem', 
                                        fontSize: '0.8125rem', 
                                        color: 'var(--text-muted)',
                                        lineHeight: '1.5'
                                    }}>
                                        {selectedRole === 'user' && '• Có thể tạo và quản lý bài viết của mình'}
                                        {selectedRole === 'moderator' && '• Có thể quản lý bài viết của người dùng khác'}
                                    </div>
                                </div>
                            </>
                        )}
                        <div className={styles.modalActions}>
                            <button
                                className={`${styles.modalBtn} ${styles.cancel}`}
                                onClick={() => {
                                    setShowRoleModal(false);
                                    setSelectedRole('user');
                                }}
                                disabled={actionLoading}
                            >
                                Hủy
                            </button>
                            {selectedUser.role !== 'admin' && (
                                <button
                                    className="btn-primary"
                                    onClick={handleRoleChange}
                                    disabled={actionLoading || selectedRole === selectedUser.role}
                                    style={{ padding: '0.625rem 1.25rem' }}
                                >
                                    {actionLoading ? 'Đang xử lý...' : 'Xác nhận'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && selectedUser && (
                <div className={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalTitle}>Xóa người dùng</div>
                        {selectedUser.role === 'admin' ? (
                            <div className={styles.modalText} style={{ color: 'var(--text-muted)' }}>
                                Không thể xóa tài khoản Admin.
                            </div>
                        ) : (
                            <div className={styles.modalText}>
                                Bạn có chắc chắn muốn xóa <strong>{selectedUser.name || selectedUser.email}</strong>?
                                Tất cả bài viết của người dùng này cũng sẽ bị xóa. Hành động này không thể hoàn tác.
                            </div>
                        )}
                        <div className={styles.modalActions}>
                            <button
                                className={`${styles.modalBtn} ${styles.cancel}`}
                                onClick={() => setShowDeleteModal(false)}
                                disabled={actionLoading}
                            >
                                Hủy
                            </button>
                            {selectedUser.role !== 'admin' && (
                                <button
                                    className={`${styles.modalBtn} ${styles.danger}`}
                                    onClick={handleDelete}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? 'Đang xóa...' : 'Xóa người dùng'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
