'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import './moderator.globals.css';
import styles from './moderator.module.css';

/**
 * Moderator Layout Component
 * Provides sidebar navigation and layout structure for moderator pages
 */
export default function ModeratorLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in and has moderator or admin role
        const userCookie = Cookies.get('user');
        if (userCookie) {
            try {
                const userData = JSON.parse(userCookie);
                // Check if user has moderator or admin role
                if (!['moderator', 'admin'].includes(userData.role)) {
                    // Not a moderator, redirect to home
                    router.push('/');
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
        if (path === '/moderator') {
            return pathname === '/moderator';
        }
        return pathname.startsWith(path);
    };

    if (loading) {
        return (
            <div className={styles.loading} style={{ height: '100vh' }}>
                <div className={styles.spinner}></div>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className={styles.modLayout}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <div className={styles.sidebarLogo}>The Moderator</div>
                    <div className={styles.sidebarSubtitle}>Internal Review System</div>
                </div>

                <nav className={styles.navMenu}>
                    <Link
                        href="/moderator"
                        className={`${styles.navItem} ${isActive('/moderator') && pathname === '/moderator' ? styles.navItemActive : ''}`}
                    >
                        <span>Dashboard</span>
                    </Link>

                    <div className={styles.navSection}>
                        <div className={styles.navSectionTitle}>Moderation</div>
                        <Link
                            href="/moderator/reports"
                            className={`${styles.navItem} ${isActive('/moderator/reports') ? styles.navItemActive : ''}`}
                        >
                            <span>Reports</span>
                        </Link>
                        <Link
                            href="/moderator/posts"
                            className={`${styles.navItem} ${isActive('/moderator/posts') ? styles.navItemActive : ''}`}
                        >
                            <span>Posts</span>
                        </Link>
                        <Link
                            href="/moderator/banned"
                            className={`${styles.navItem} ${isActive('/moderator/banned') ? styles.navItemActive : ''}`}
                        >
                            <span>Banned Users</span>
                        </Link>
                    </div>

                    {user?.role === 'admin' && (
                        <div className={styles.navSection}>
                            <div className={styles.navSectionTitle}>Admin</div>
                            <Link
                                href="/admin"
                                className={styles.navItem}
                            >
                                <span>Admin Panel</span>
                            </Link>
                        </div>
                    )}
                </nav>

                <div className={styles.backToSite}>
                    <Link href="/" className={styles.navItem}>
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
                            {pathname === '/moderator' && 'Start Page'}
                            {pathname === '/moderator/reports' && 'Report Ledger'}
                            {pathname === '/moderator/posts' && 'Post Archives'}
                            {pathname === '/moderator/banned' && 'Banned Personnel'}
                        </h1>
                        <p>Daily moderation tasks and oversight</p>
                    </div>
                    <div className={styles.headerRight}>
                        <div className={styles.modProfile}>
                            <div className={styles.modInfo}>
                                <div className={styles.modName}>{user?.name || 'Moderator'}</div>
                                <div className={styles.modRole}>
                                    {user?.role === 'admin' ? 'Administrator' : 'Moderator'}
                                </div>
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
