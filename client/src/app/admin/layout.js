'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import './admin.globals.css';
import styles from './admin.module.css';

/**
 * Admin Layout Component
 * Provides sidebar navigation and layout structure for admin pages
 */
export default function AdminLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in and has admin role
        const userCookie = Cookies.get('user');
        if (userCookie) {
            try {
                const userData = JSON.parse(userCookie);
                // Check if user has admin role
                if (userData.role !== 'admin') {
                    // Not an admin - redirect to moderator panel if moderator, else home
                    if (userData.role === 'moderator') {
                        router.push('/moderator');
                    } else {
                        router.push('/');
                    }
                    return;
                }
                setUser(userData);
            } catch {
                router.push('/auth');
            }
        } else {
            router.push('/auth');
        }
        setLoading(false);
    }, [router]);

    const isActive = (path) => {
        if (path === '/admin') {
            return pathname === '/admin';
        }
        return pathname.startsWith(path);
    };

    if (loading) {
        return (
            <div className={styles.loading} style={{ height: '100vh' }}>
                <div className={styles.spinner}></div>
                <p>Đang tải...</p>
            </div>
        );
    }

    return (
        <div className={styles.adminLayout}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <div className={styles.sidebarLogo}>AD</div>
                    <div>
                        <div className={styles.sidebarTitle}>Admin Panel</div>
                        <div className={styles.sidebarSubtitle}>Blog Management</div>
                    </div>
                </div>

                <nav className={styles.navMenu}>
                    <Link
                        href="/admin"
                        className={`${styles.navItem} ${isActive('/admin') && pathname === '/admin' ? styles.navItemActive : ''}`}
                    >
                        <span className={styles.navIcon}>D</span>
                        <span>Dashboard</span>
                    </Link>

                    <div className={styles.navSection}>
                        <div className={styles.navSectionTitle}>Management</div>
                        <Link
                            href="/admin/users"
                            className={`${styles.navItem} ${isActive('/admin/users') ? styles.navItemActive : ''}`}
                        >
                            <span className={styles.navIcon}>U</span>
                            <span>Users</span>
                        </Link>
                        <Link
                            href="/admin/posts"
                            className={`${styles.navItem} ${isActive('/admin/posts') ? styles.navItemActive : ''}`}
                        >
                            <span className={styles.navIcon}>P</span>
                            <span>Posts</span>
                        </Link>
                        <Link
                            href="/admin/roles"
                            className={`${styles.navItem} ${isActive('/admin/roles') ? styles.navItemActive : ''}`}
                        >
                            <span className={styles.navIcon}>R</span>
                            <span>Roles</span>
                        </Link>
                    </div>

                    <div className={styles.navSection}>
                        <div className={styles.navSectionTitle}>Analytics</div>
                        <Link
                            href="/admin/security"
                            className={`${styles.navItem} ${isActive('/admin/security') ? styles.navItemActive : ''}`}
                        >
                            <span className={styles.navIcon}>S</span>
                            <span>Security</span>
                        </Link>
                    </div>
                </nav>

                <div className={styles.backToSite}>
                    <Link href="/" className={styles.navItem}>
                        <span className={styles.navIcon}>←</span>
                        <span>Back to Site</span>
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className={styles.mainContent}>
                {/* Header */}
                <header className={styles.header}>
                    <div className={styles.headerLeft}>
                        <h1>
                            {pathname === '/admin' && 'Dashboard'}
                            {pathname === '/admin/users' && 'User Management'}
                            {pathname === '/admin/posts' && 'Post Management'}
                            {pathname === '/admin/roles' && 'Role Management'}
                            {pathname === '/admin/security' && 'Security Logs'}
                        </h1>
                        <p>Manage your blog platform</p>
                    </div>
                    <div className={styles.headerRight}>
                        <div className={styles.adminProfile}>
                            <img
                                src={user?.picture || '/default-avatar.svg'}
                                alt={user?.name || 'Admin'}
                                className={styles.adminAvatar}
                                onError={(e) => { e.target.src = '/default-avatar.svg'; }}
                            />
                            <div className={styles.adminInfo}>
                                <div className={styles.adminName}>{user?.name || 'Admin'}</div>
                                <div className={styles.adminRole}>Administrator</div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                {children}
            </main>
        </div>
    );
}
