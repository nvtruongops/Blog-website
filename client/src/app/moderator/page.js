'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getModeratorStats } from '@/lib/moderatorApi';
import styles from './moderator.module.css';

export default function ModeratorDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const response = await getModeratorStats();
            if (response.success) {
                setStats(response.data);
            } else {
                setError(response.error);
            }
        } catch (err) {
            setError('Unable to load dashboard data');
        }
        setLoading(false);
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
            <div className={styles.card}>
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>!</div>
                    <div className={styles.emptyTitle}>Access Denied</div>
                    <div className={styles.emptyText}>{error}</div>
                    <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={fetchStats}>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const reasonLabels = {
        spam: 'Spam',
        harassment: 'Harassment',
        hate_speech: 'Hate Speech',
        violence: 'Violence',
        inappropriate_content: 'Inappropriate',
        misinformation: 'Misinformation',
        copyright: 'Copyright',
        other: 'Other'
    };

    return (
        <div>
            {/* Stats Grid */}
            <div className={styles.statsGrid}>
                <div className={`${styles.statCard} ${styles.warning}`}>
                    <div className={styles.statHeader}>
                        <div className={styles.statLabel}>Pending Reports</div>
                    </div>
                    <div className={styles.statValue}>{stats?.reports?.pending || 0}</div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <div className={styles.statLabel}>Under Review</div>
                    </div>
                    <div className={styles.statValue}>{stats?.reports?.reviewing || 0}</div>
                </div>

                <div className={`${styles.statCard} ${styles.success}`}>
                    <div className={styles.statHeader}>
                        <div className={styles.statLabel}>Resolved Today</div>
                    </div>
                    <div className={styles.statValue}>{stats?.reports?.resolvedToday || 0}</div>
                </div>

                <div className={`${styles.statCard} ${styles.danger}`}>
                    <div className={styles.statHeader}>
                        <div className={styles.statLabel}>Banned Users</div>
                    </div>
                    <div className={styles.statValue}>{stats?.bannedUsers || 0}</div>
                </div>
            </div>

            {/* Reports by Type */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>Reports by Type</h3>
                </div>
                {stats?.reportsByType?.length > 0 ? (
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Reason</th>
                                    <th>Count</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.reportsByType.map((item) => (
                                    <tr key={item._id}>
                                        <td>
                                            <span className={`${styles.badge} ${styles.pending}`}>
                                                {reasonLabels[item._id] || item._id}
                                            </span>
                                        </td>
                                        <td><strong>{item.count}</strong></td>
                                        <td>
                                            <a
                                                href={`/moderator/reports?reason=${item._id}`}
                                                className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
                                            >
                                                View All
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <h3>No pending reports</h3>
                        <p>There are no reports to review at this time.</p>
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>Quick Actions</h3>
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <Link href="/moderator/reports" className={`${styles.btn} ${styles.btnPrimary}`}>
                        View All Reports
                    </Link>
                    <Link href="/moderator/posts" className={`${styles.btn} ${styles.btnSecondary}`}>
                        Moderate Posts
                    </Link>
                    <Link href="/moderator/banned" className={`${styles.btn} ${styles.btnSecondary}`}>
                        Manage Banned Users
                    </Link>
                </div>
            </div>
        </div>
    );
}
