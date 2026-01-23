'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSecurityLogs } from '@/lib/adminApi';
import styles from '../admin.module.css';

/**
 * Security Logs Page
 * View and filter security events
 */
export default function SecurityPage() {
    const [logs, setLogs] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
    const [loading, setLoading] = useState(true);
    const [eventTypeFilter, setEventTypeFilter] = useState('');
    const [ipFilter, setIpFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        const result = await getSecurityLogs({
            page: pagination.page,
            limit: pagination.limit,
            eventType: eventTypeFilter,
            ip: ipFilter,
            startDate,
            endDate
        });

        if (result.success) {
            setLogs(result.data.logs);
            setPagination(prev => ({ ...prev, ...result.data.pagination }));
        }
        setLoading(false);
    }, [pagination.page, pagination.limit, eventTypeFilter, ipFilter, startDate, endDate]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchLogs();
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getEventTypeInfo = (eventType) => {
        const types = {
            'AUTH_SUCCESS': { label: 'Login Success', icon: '✓', class: 'success' },
            'AUTH_FAILURE': { label: 'Login Failed', icon: '×', class: 'danger' },
            'AUTH_LOCKOUT': { label: 'Account Locked', icon: '!', class: 'danger' },
            'UNAUTHORIZED_ACCESS': { label: 'Unauthorized', icon: '⊘', class: 'danger' },
            'RATE_LIMIT_EXCEEDED': { label: 'Rate Limited', icon: '◷', class: 'warning' },
            'INVALID_INPUT': { label: 'Invalid Input', icon: '?', class: 'warning' },
            'FILE_UPLOAD_BLOCKED': { label: 'Upload Blocked', icon: '↑', class: 'warning' },
            'SUSPICIOUS_ACTIVITY': { label: 'Suspicious', icon: '!', class: 'danger' }
        };
        return types[eventType] || { label: eventType, icon: '•', class: 'info' };
    };

    const eventTypes = [
        'AUTH_SUCCESS',
        'AUTH_FAILURE',
        'AUTH_LOCKOUT',
        'UNAUTHORIZED_ACCESS',
        'RATE_LIMIT_EXCEEDED',
        'INVALID_INPUT',
        'FILE_UPLOAD_BLOCKED',
        'SUSPICIOUS_ACTIVITY'
    ];

    return (
        <div>
            {/* Page Header */}
            <div style={{ marginBottom: '1.25rem' }}>
                <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.875rem' }}>
                    Monitor security events in the system
                </p>
            </div>

            {/* Stats Summary */}
            <div className={styles.statsGrid} style={{ marginBottom: '1.25rem' }}>
                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <div className={styles.statIcon}>Σ</div>
                    </div>
                    <div className={styles.statValue}>{pagination.total}</div>
                    <div className={styles.statLabel}>Total Events</div>
                </div>

                <div className={`${styles.statCard} ${styles.blue}`}>
                    <div className={styles.statHeader}>
                        <div className={styles.statIcon}>✓</div>
                    </div>
                    <div className={styles.statValue}>
                        {logs.filter(l => l.eventType === 'AUTH_SUCCESS').length}
                    </div>
                    <div className={styles.statLabel}>Successful Logins</div>
                </div>

                <div className={`${styles.statCard} ${styles.orange}`}>
                    <div className={styles.statHeader}>
                        <div className={styles.statIcon}>!</div>
                    </div>
                    <div className={styles.statValue}>
                        {logs.filter(l => ['RATE_LIMIT_EXCEEDED', 'INVALID_INPUT'].includes(l.eventType)).length}
                    </div>
                    <div className={styles.statLabel}>Warnings</div>
                </div>

                <div className={`${styles.statCard} ${styles.red}`}>
                    <div className={styles.statHeader}>
                        <div className={styles.statIcon}>×</div>
                    </div>
                    <div className={styles.statValue}>
                        {logs.filter(l => ['AUTH_FAILURE', 'AUTH_LOCKOUT', 'UNAUTHORIZED_ACCESS', 'SUSPICIOUS_ACTIVITY'].includes(l.eventType)).length}
                    </div>
                    <div className={styles.statLabel}>Critical Events</div>
                </div>
            </div>

            {/* Filter Bar */}
            <form onSubmit={handleSearch} className={styles.filterBar}>
                <select
                    className={styles.filterSelect}
                    value={eventTypeFilter}
                    onChange={(e) => { setEventTypeFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                >
                    <option value="">All Event Types</option>
                    {eventTypes.map(type => (
                        <option key={type} value={type}>
                            {getEventTypeInfo(type).label}
                        </option>
                    ))}
                </select>

                <div className={styles.searchBox} style={{ minWidth: '150px' }}>
                    <span className={styles.searchIcon}>IP</span>
                    <input
                        type="text"
                        placeholder="Filter by IP..."
                        value={ipFilter}
                        onChange={(e) => setIpFilter(e.target.value)}
                        style={{ paddingLeft: '2.5rem' }}
                    />
                </div>

                <input
                    type="date"
                    className={styles.filterSelect}
                    value={startDate}
                    onChange={(e) => { setStartDate(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                    style={{ padding: '0.75rem' }}
                />

                <input
                    type="date"
                    className={styles.filterSelect}
                    value={endDate}
                    onChange={(e) => { setEndDate(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                    style={{ padding: '0.75rem' }}
                />

                <button type="submit" className="btn-primary" style={{ padding: '0.75rem 1.25rem' }}>
                    Search
                </button>
            </form>

            {/* Logs List */}
            <div className={styles.card}>
                {loading ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>Loading...</p>
                    </div>
                ) : logs.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>S</div>
                        <div className={styles.emptyTitle}>No security events</div>
                        <div className={styles.emptyText}>No events recorded in this time period</div>
                    </div>
                ) : (
                    <div>
                        {logs.map((log, index) => {
                            const eventInfo = getEventTypeInfo(log.eventType);
                            return (
                                <div key={log._id || index} className={styles.logItem}>
                                    <div className={`${styles.logIcon} ${styles[eventInfo.class]}`}>
                                        {eventInfo.icon}
                                    </div>
                                    <div className={styles.logContent}>
                                        <div className={styles.logType}>{eventInfo.label}</div>
                                        <div className={styles.logDetails}>
                                            {log.details || 'No details available'}
                                            {log.userId && (
                                                <span style={{ marginLeft: '0.5rem', color: 'var(--admin-primary)' }}>
                                                    • User: {log.userId?.name || log.userId?.email || log.userId}
                                                </span>
                                            )}
                                        </div>
                                        <div className={styles.logMeta}>
                                            <span>IP: {log.ip}</span>
                                            <span>Endpoint: {log.endpoint}</span>
                                            <span>{formatDate(log.timestamp)}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {!loading && logs.length > 0 && (
                    <div className={styles.pagination}>
                        <div className={styles.paginationInfo}>
                            Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} events
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
        </div>
    );
}
