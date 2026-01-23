'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getDashboardStats, getRecentActivity, getTopPosts } from '@/lib/adminApi';
import styles from './admin.module.css';

/**
 * Admin Dashboard Page
 * Shows overview statistics, charts, and recent activity
 */
export default function AdminDashboardPage() {
    const [stats, setStats] = useState(null);
    const [activity, setActivity] = useState([]);
    const [topPosts, setTopPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [statsRes, activityRes, topPostsRes] = await Promise.all([
                getDashboardStats(),
                getRecentActivity(10),
                getTopPosts(5, 'views')
            ]);

            if (statsRes.success) {
                setStats(statsRes.data);
            } else {
                setError(statsRes.error);
            }

            if (activityRes.success) {
                setActivity(activityRes.data.activities || []);
            }

            if (topPostsRes.success) {
                setTopPosts(topPostsRes.data.posts || []);
            }
        } catch (err) {
            setError('Unable to load dashboard data');
        }
        setLoading(false);
    };

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num?.toString() || '0';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString('en-US');
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>!</div>
                <div className={styles.emptyTitle}>Access Denied</div>
                <div className={styles.emptyText}>{error}</div>
                <Link href="/" className="btn-primary" style={{ marginTop: '1rem' }}>
                    Back to Home
                </Link>
            </div>
        );
    }

    return (
        <div>
            {/* Stats Grid */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <div className={styles.statIcon}>U</div>
                        <div className={`${styles.statTrend} ${styles.up}`}>
                            +{stats?.users?.newThisMonth || 0}
                        </div>
                    </div>
                    <div className={styles.statValue}>{formatNumber(stats?.users?.total)}</div>
                    <div className={styles.statLabel}>Total Users</div>
                </div>

                <div className={`${styles.statCard} ${styles.blue}`}>
                    <div className={styles.statHeader}>
                        <div className={styles.statIcon}>P</div>
                        <div className={`${styles.statTrend} ${styles.up}`}>
                            +{stats?.posts?.newThisMonth || 0}
                        </div>
                    </div>
                    <div className={styles.statValue}>{formatNumber(stats?.posts?.total)}</div>
                    <div className={styles.statLabel}>Total Posts</div>
                </div>

                <div className={`${styles.statCard} ${styles.purple}`}>
                    <div className={styles.statHeader}>
                        <div className={styles.statIcon}>V</div>
                    </div>
                    <div className={styles.statValue}>{formatNumber(stats?.engagement?.totalViews)}</div>
                    <div className={styles.statLabel}>Total Views</div>
                </div>

                <div className={`${styles.statCard} ${styles.orange}`}>
                    <div className={styles.statHeader}>
                        <div className={styles.statIcon}>L</div>
                    </div>
                    <div className={styles.statValue}>{formatNumber(stats?.engagement?.totalLikes)}</div>
                    <div className={styles.statLabel}>Total Likes</div>
                </div>
            </div>

            {/* Dashboard Grid */}
            <div className={styles.dashboardGrid}>
                {/* Chart Section */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <div className={styles.cardTitle}>Posts Per Day</div>
                        <span className={styles.cardAction}>Last 7 days</span>
                    </div>
                    <div className={styles.chartContainer}>
                        {stats?.charts?.postsPerDay?.length > 0 ? (
                            stats.charts.postsPerDay.map((item, index) => {
                                const maxCount = Math.max(...stats.charts.postsPerDay.map(d => d.count));
                                const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                                return (
                                    <div key={index} style={{ textAlign: 'center', flex: 1 }}>
                                        <div
                                            className={styles.chartBar}
                                            style={{ height: `${Math.max(height, 5)}%` }}
                                            title={`${item.count} posts`}
                                        ></div>
                                        <div className={styles.chartLabel}>
                                            {new Date(item._id).toLocaleDateString('en-US', { weekday: 'short' })}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '100%',
                                color: 'var(--admin-text-muted)'
                            }}>
                                No data available
                            </div>
                        )}
                    </div>
                </div>

                {/* Category Stats */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <div className={styles.cardTitle}>Posts by Category</div>
                    </div>
                    <div className={styles.categoryList}>
                        {stats?.posts?.byCategory?.map((cat, index) => {
                            const total = stats.posts.total || 1;
                            const percentage = (cat.count / total) * 100;
                            return (
                                <div key={index}>
                                    <div className={styles.categoryItem}>
                                        <div className={styles.categoryInfo}>
                                            <span className={styles.categoryName}>{cat._id}</span>
                                            <span className={styles.categoryCount}>{cat.count} posts</span>
                                        </div>
                                    </div>
                                    <div className={styles.categoryBar}>
                                        <div
                                            className={`${styles.categoryProgress} ${styles[cat._id]}`}
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                        {(!stats?.posts?.byCategory || stats.posts.byCategory.length === 0) && (
                            <div style={{ textAlign: 'center', color: 'var(--admin-text-muted)', padding: '2rem' }}>
                                No posts yet
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Second Row */}
            <div className={styles.dashboardGrid} style={{ marginTop: '1.25rem' }}>
                {/* Top Posts */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <div className={styles.cardTitle}>Top Posts</div>
                        <Link href="/admin/posts" className={styles.cardAction}>
                            View All
                        </Link>
                    </div>
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Category</th>
                                    <th>Views</th>
                                    <th>Likes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topPosts.map((post, index) => (
                                    <tr key={post._id || index}>
                                        <td>
                                            <div style={{
                                                maxWidth: '250px',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                fontWeight: 500
                                            }}>
                                                {post.title}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`${styles.badge} ${styles[post.category]}`}>
                                                {post.category}
                                            </span>
                                        </td>
                                        <td>{formatNumber(post.views)}</td>
                                        <td>{formatNumber(post.likes)}</td>
                                    </tr>
                                ))}
                                {topPosts.length === 0 && (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                                            No posts yet
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <div className={styles.cardTitle}>Recent Activity</div>
                    </div>
                    <div className={styles.activityList}>
                        {activity.map((item, index) => (
                            <div key={index} className={styles.activityItem}>
                                <div className={`${styles.activityIcon} ${styles[item.type]}`}>
                                    {item.type === 'post' ? 'P' : 'U'}
                                </div>
                                <div className={styles.activityContent}>
                                    <div className={styles.activityTitle}>{item.title}</div>
                                    <div className={styles.activityTime}>{formatDate(item.createdAt)}</div>
                                </div>
                            </div>
                        ))}
                        {activity.length === 0 && (
                            <div style={{ textAlign: 'center', color: 'var(--admin-text-muted)', padding: '2rem' }}>
                                No recent activity
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Stats Row */}
            <div className={styles.statsGrid} style={{ marginTop: '1.25rem' }}>
                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <div className={styles.statIcon}>✓</div>
                    </div>
                    <div className={styles.statValue}>{formatNumber(stats?.users?.verified)}</div>
                    <div className={styles.statLabel}>Verified Users</div>
                </div>

                <div className={`${styles.statCard} ${styles.blue}`}>
                    <div className={styles.statHeader}>
                        <div className={styles.statIcon}>G</div>
                    </div>
                    <div className={styles.statValue}>{formatNumber(stats?.users?.google)}</div>
                    <div className={styles.statLabel}>Google Auth Users</div>
                </div>

                <div className={`${styles.statCard} ${styles.purple}`}>
                    <div className={styles.statHeader}>
                        <div className={styles.statIcon}>C</div>
                    </div>
                    <div className={styles.statValue}>{formatNumber(stats?.engagement?.totalComments)}</div>
                    <div className={styles.statLabel}>Total Comments</div>
                </div>

                <div className={`${styles.statCard} ${styles.red}`}>
                    <div className={styles.statHeader}>
                        <div className={styles.statIcon}>!</div>
                    </div>
                    <div className={styles.statValue}>
                        {stats?.security?.events24h?.reduce((sum, e) => sum + e.count, 0) || 0}
                    </div>
                    <div className={styles.statLabel}>Security Events (24h)</div>
                </div>
            </div>
        </div>
    );
}
