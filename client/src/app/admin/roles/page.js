'use client';

import { useEffect, useState } from 'react';
import { getAllUsers, updateUserRole } from '@/lib/adminApi';
import styles from '../admin.module.css';

export default function RoleManagementPage() {
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newRole, setNewRole] = useState('user');
    const [actionLoading, setActionLoading] = useState(false);
    const [stats, setStats] = useState({ admins: 0, moderators: 0, users: 0 });

    useEffect(() => {
        fetchUsers();
    }, [pagination.page, search, roleFilter]);

    const fetchUsers = async () => {
        setLoading(true);
        const result = await getAllUsers({
            page: pagination.page,
            limit: 10,
            search,
            role: roleFilter,
            sortBy: 'createdAt',
            sortOrder: 'desc'
        });

        if (result.success) {
            setUsers(result.data.users);
            setPagination(result.data.pagination);
            
            // Calculate stats from current data
            const allUsers = result.data.users;
            setStats({
                admins: allUsers.filter(u => u.role === 'admin').length,
                moderators: allUsers.filter(u => u.role === 'moderator').length,
                users: allUsers.filter(u => u.role === 'user').length
            });
        }
        setLoading(false);
    };

    const handleUpdateRole = async () => {
        if (!selectedUser || !newRole) return;
        
        // Prevent changing admin role
        if (selectedUser.role === 'admin') {
            alert('Không thể thay đổi quyền của Admin');
            return;
        }
        
        // Prevent setting to admin
        if (newRole === 'admin') {
            alert('Không thể cấp quyền Admin từ giao diện này. Chỉ có thể cấp User hoặc Moderator.');
            return;
        }
        
        setActionLoading(true);
        const result = await updateUserRole(selectedUser._id, newRole);

        if (result.success) {
            setUsers(users.map(u =>
                u._id === selectedUser._id ? { ...u, role: newRole } : u
            ));
            setShowRoleModal(false);
            setSelectedUser(null);
            fetchUsers(); // Refresh to update stats
        } else {
            alert(result.error || 'Không thể cập nhật quyền');
        }
        setActionLoading(false);
    };

    const getRoleBadgeStyle = (role) => {
        switch (role) {
            case 'admin':
                return { background: 'var(--admin-primary-pale)', color: 'var(--admin-primary)' };
            case 'moderator':
                return { background: '#e0e7ff', color: '#3730a3' };
            default:
                return { background: 'var(--admin-bg)', color: 'var(--admin-text-secondary)' };
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'admin': return '👑';
            case 'moderator': return '🛡️';
            default: return '👤';
        }
    };

    return (
        <div>
            {/* Stats */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <div className={styles.statIcon}>👑</div>
                    </div>
                    <div className={styles.statValue}>{stats.admins}</div>
                    <div className={styles.statLabel}>Quản trị viên</div>
                </div>
                <div className={`${styles.statCard} ${styles.blue}`}>
                    <div className={styles.statHeader}>
                        <div className={styles.statIcon}>🛡️</div>
                    </div>
                    <div className={styles.statValue}>{stats.moderators}</div>
                    <div className={styles.statLabel}>Người kiểm duyệt</div>
                </div>
                <div className={`${styles.statCard} ${styles.purple}`}>
                    <div className={styles.statHeader}>
                        <div className={styles.statIcon}>👤</div>
                    </div>
                    <div className={styles.statValue}>{stats.users}</div>
                    <div className={styles.statLabel}>Người dùng thường</div>
                </div>
            </div>

            {/* Role Explanation */}
            <div className={styles.card} style={{ marginBottom: '1.5rem' }}>
                <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>📋 Phân quyền hệ thống</h3>
                </div>
                <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                    <div style={{ padding: '1rem', background: 'var(--admin-primary-pale)', borderRadius: '8px' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            👑 Admin
                        </h4>
                        <ul style={{ fontSize: '0.875rem', paddingLeft: '1.25rem', color: 'var(--admin-text-secondary)' }}>
                            <li>Toàn quyền truy cập admin panel</li>
                            <li>Quản lý tất cả người dùng</li>
                            <li>Cấp/thu hồi quyền user và moderator</li>
                            <li>Xem nhật ký bảo mật</li>
                            <li>Tất cả quyền của moderator</li>
                        </ul>
                    </div>
                    <div style={{ padding: '1rem', background: '#e8f0f5', borderRadius: '8px' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            🛡️ Moderator
                        </h4>
                        <ul style={{ fontSize: '0.875rem', paddingLeft: '1.25rem', color: 'var(--admin-info)' }}>
                            <li>Truy cập bảng điều khiển kiểm duyệt</li>
                            <li>Xem và xử lý báo cáo</li>
                            <li>Xóa bài viết và bình luận</li>
                            <li>Cấm người dùng (không xóa)</li>
                            <li>Không truy cập admin panel</li>
                        </ul>
                    </div>
                    <div style={{ padding: '1rem', background: 'var(--admin-bg)', borderRadius: '8px' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            👤 User
                        </h4>
                        <ul style={{ fontSize: '0.875rem', paddingLeft: '1.25rem', color: 'var(--admin-text-secondary)' }}>
                            <li>Quyền người dùng tiêu chuẩn</li>
                            <li>Tạo bài viết và bình luận</li>
                            <li>Thích và lưu nội dung</li>
                            <li>Theo dõi người dùng khác</li>
                            <li>Gửi báo cáo</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className={styles.card}>
                <div className={styles.filterBar}>
                    <div className={styles.searchBox}>
                        <span className={styles.searchIcon}>🔍</span>
                        <input
                            type="text"
                            placeholder="Search users by name or email..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPagination(p => ({ ...p, page: 1 }));
                            }}
                        />
                    </div>
                    <select
                        className={styles.filterSelect}
                        value={roleFilter}
                        onChange={(e) => {
                            setRoleFilter(e.target.value);
                            setPagination(p => ({ ...p, page: 1 }));
                        }}
                    >
                        <option value="">Tất cả quyền</option>
                        <option value="admin">Admin</option>
                        <option value="moderator">Moderator</option>
                        <option value="user">User</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>👥 Quản lý phân quyền</h3>
                </div>

                {loading ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>Đang tải...</p>
                    </div>
                ) : users.length > 0 ? (
                    <>
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Người dùng</th>
                                        <th>Email</th>
                                        <th>Quyền hiện tại</th>
                                        <th>Trạng thái</th>
                                        <th>Tham gia</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user._id}>
                                            <td>
                                                <div className={styles.tableUser}>
                                                    <img
                                                        src={user.picture || '/default-avatar.svg'}
                                                        alt=""
                                                        className={styles.tableAvatar}
                                                    />
                                                    <div className={styles.tableUserInfo}>
                                                        <div className={styles.tableUserName}>{user.name || 'No Name'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ fontSize: '0.875rem' }}>{user.email}</td>
                                            <td>
                                                <span
                                                    className={styles.badge}
                                                    style={getRoleBadgeStyle(user.role)}
                                                >
                                                    {getRoleIcon(user.role)} {user.role}
                                                </span>
                                            </td>
                                            <td>
                                                {user.isBanned ? (
                                                    <span className={styles.badge} style={{ background: '#fee2e2', color: '#dc2626' }}>
                                                        🚫 Banned
                                                    </span>
                                                ) : user.verify ? (
                                                    <span className={`${styles.badge} ${styles.verified}`}>✓ Verified</span>
                                                ) : (
                                                    <span className={`${styles.badge} ${styles.unverified}`}>Unverified</span>
                                                )}
                                            </td>
                                            <td>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
                                            <td>
                                                <div className={styles.actionGroup}>
                                                    <button
                                                        className={`${styles.actionBtn} ${styles.edit}`}
                                                        title="Thay đổi quyền"
                                                        onClick={() => {
                                                            setSelectedUser(user);
                                                            setNewRole(user.role === 'admin' ? 'admin' : user.role);
                                                            setShowRoleModal(true);
                                                        }}
                                                        disabled={user.role === 'admin'}
                                                    >
                                                        ⚙
                                                    </button>
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
                                Hiển thị {users.length} trong tổng số {pagination.total} người dùng
                            </div>
                            <div className={styles.paginationButtons}>
                                <button
                                    className={styles.pageBtn}
                                    disabled={pagination.page <= 1}
                                    onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                                >
                                    ← Trước
                                </button>
                                <span className={`${styles.pageBtn} ${styles.active}`}>
                                    {pagination.page} / {pagination.pages}
                                </span>
                                <button
                                    className={styles.pageBtn}
                                    disabled={pagination.page >= pagination.pages}
                                    onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                >
                                    Sau →
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>👥</div>
                        <div className={styles.emptyTitle}>Không tìm thấy người dùng</div>
                        <div className={styles.emptyText}>Thử điều chỉnh bộ lọc tìm kiếm</div>
                    </div>
                )}
            </div>

            {/* Role Update Modal */}
            {showRoleModal && selectedUser && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}
                    onClick={() => setShowRoleModal(false)}
                >
                    <div
                        style={{
                            background: 'var(--admin-card)',
                            borderRadius: '8px',
                            padding: '1.5rem',
                            width: '90%',
                            maxWidth: '450px'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '1.5rem',
                            paddingBottom: '1rem',
                            borderBottom: '1px solid var(--admin-border)'
                        }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Thay đổi quyền người dùng</h3>
                            <button
                                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
                                onClick={() => setShowRoleModal(false)}
                            >
                                ×
                            </button>
                        </div>

                        {selectedUser.role === 'admin' ? (
                            <div style={{
                                padding: '1rem',
                                background: '#fef3c7',
                                borderRadius: '8px',
                                fontSize: '0.875rem',
                                color: '#92400e',
                                marginBottom: '1rem'
                            }}>
                                ⚠️ Không thể thay đổi quyền của Admin từ giao diện này.
                            </div>
                        ) : (
                            <>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        marginBottom: '1rem',
                                        padding: '0.75rem',
                                        background: 'var(--admin-bg)',
                                        borderRadius: '8px'
                                    }}>
                                        <img
                                            src={selectedUser.picture || '/default-avatar.svg'}
                                            alt=""
                                            style={{ width: 40, height: 40, borderRadius: '50%' }}
                                        />
                                        <div>
                                            <div style={{ fontWeight: 500 }}>{selectedUser.name || 'No Name'}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                                                {selectedUser.email}
                                            </div>
                                        </div>
                                    </div>

                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                        Chọn quyền mới
                                    </label>
                                    <select
                                        value={newRole}
                                        onChange={(e) => setNewRole(e.target.value)}
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
                                        <option value="user">👤 User - Người dùng thường</option>
                                        <option value="moderator">🛡️ Moderator - Quản lý nội dung</option>
                                    </select>

                                    <div style={{
                                        marginTop: '1rem',
                                        padding: '0.75rem',
                                        background: 'var(--admin-bg)',
                                        borderRadius: '6px',
                                        fontSize: '0.875rem',
                                        color: 'var(--admin-text-secondary)'
                                    }}>
                                        {newRole === 'user' && '• Có thể tạo và quản lý bài viết của mình'}
                                        {newRole === 'moderator' && '• Có thể quản lý bài viết của người dùng khác'}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                    <button
                                        className={`${styles.modalBtn} ${styles.cancel}`}
                                        onClick={() => {
                                            setShowRoleModal(false);
                                            setNewRole('user');
                                        }}
                                        disabled={actionLoading}
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        className="btn-primary"
                                        onClick={handleUpdateRole}
                                        disabled={actionLoading || newRole === selectedUser.role}
                                        style={{ padding: '0.625rem 1.25rem' }}
                                    >
                                        {actionLoading ? 'Đang xử lý...' : 'Cập nhật quyền'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
