'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getReports, updateReport } from '@/lib/moderatorApi';
import styles from '../moderator.module.css';

export default function ReportsPage() {
    const searchParams = useSearchParams();
    const [reports, setReports] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: searchParams.get('status') || '',
        targetType: searchParams.get('targetType') || '',
        reason: searchParams.get('reason') || ''
    });
    const [selectedReport, setSelectedReport] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [actionData, setActionData] = useState({
        status: 'resolved',
        actionTaken: 'none',
        reviewNotes: ''
    });

    useEffect(() => {
        fetchReports();
    }, [filters, pagination.page]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const response = await getReports({
                page: pagination.page,
                limit: 10,
                ...filters
            });

            if (response.success) {
                setReports(response.data.reports);
                setPagination(prev => ({ ...prev, ...response.data.pagination }));
            }
        } catch (err) {
            console.error('Error fetching reports:', err);
        }
        setLoading(false);
    };

    const handleUpdateReport = async () => {
        try {
            const response = await updateReport(selectedReport._id, actionData);
            if (response.success) {
                setShowModal(false);
                setSelectedReport(null);
                fetchReports();
            } else {
                alert(response.error);
            }
        } catch (err) {
            console.error('Error updating report:', err);
            alert('Failed to update report');
        }
    };

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

    const getStatusBadge = (status) => {
        const statusMap = {
            pending: 'pending',
            reviewing: 'reviewing',
            resolved: 'resolved',
            dismissed: 'dismissed'
        };
        return statusMap[status] || 'pending';
    };

    return (
        <div>
            {/* Filters */}
            <div className={styles.card}>
                <div className={styles.filterBar}>
                    <select
                        className={styles.filterSelect}
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="reviewing">Reviewing</option>
                        <option value="resolved">Resolved</option>
                        <option value="dismissed">Dismissed</option>
                    </select>

                    <select
                        className={styles.filterSelect}
                        value={filters.targetType}
                        onChange={(e) => setFilters({ ...filters, targetType: e.target.value })}
                    >
                        <option value="">All Types</option>
                        <option value="post">Post</option>
                        <option value="comment">Comment</option>
                        <option value="user">User</option>
                    </select>

                    <select
                        className={styles.filterSelect}
                        value={filters.reason}
                        onChange={(e) => setFilters({ ...filters, reason: e.target.value })}
                    >
                        <option value="">All Reasons</option>
                        {Object.entries(reasonLabels).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Reports Table */}
            <div className={styles.card}>
                {loading ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>Loading reports...</p>
                    </div>
                ) : reports.length > 0 ? (
                    <>
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Reporter</th>
                                        <th>Type</th>
                                        <th>Reason</th>
                                        <th>Target</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.map((report) => (
                                        <tr key={report._id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <strong>{report.reporter?.name || 'Unknown'}</strong>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={styles.badge} style={{ background: '#e0e7ff', color: '#3730a3' }}>
                                                    {report.targetType}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`${styles.badge} ${styles.pending}`}>
                                                    {reasonLabels[report.reason] || report.reason}
                                                </span>
                                            </td>
                                            <td>
                                                {report.targetContent?.title || report.targetContent?.name || 'N/A'}
                                            </td>
                                            <td>
                                                <span className={`${styles.badge} ${styles[getStatusBadge(report.status)]}`}>
                                                    {report.status}
                                                </span>
                                            </td>
                                            <td>{new Date(report.createdAt).toLocaleDateString('vi-VN')}</td>
                                            <td>
                                                <div className={styles.actionGroup}>
                                                    <button
                                                        className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`}
                                                        onClick={() => {
                                                            setSelectedReport(report);
                                                            setActionData({
                                                                status: report.status === 'pending' ? 'reviewing' : 'resolved',
                                                                actionTaken: 'none',
                                                                reviewNotes: ''
                                                            });
                                                            setShowModal(true);
                                                        }}
                                                    >
                                                        Review
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
                                Showing {reports.length} of {pagination.total} reports
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
                        <h3>No reports found</h3>
                        <p>There are no reports matching your filters.</p>
                    </div>
                )}
            </div>

            {/* Review Modal */}
            {showModal && selectedReport && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>Review Report</h3>
                            <button className={styles.modalClose} onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.formGroup}>
                                <label>Report Type</label>
                                <p><strong>{selectedReport.targetType}</strong> - {reasonLabels[selectedReport.reason]}</p>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Description</label>
                                <p>{selectedReport.description || 'No description provided'}</p>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Status</label>
                                <select
                                    value={actionData.status}
                                    onChange={(e) => setActionData({ ...actionData, status: e.target.value })}
                                >
                                    <option value="reviewing">Reviewing</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="dismissed">Dismissed</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Action Taken</label>
                                <select
                                    value={actionData.actionTaken}
                                    onChange={(e) => setActionData({ ...actionData, actionTaken: e.target.value })}
                                >
                                    <option value="none">No Action</option>
                                    <option value="warning">Warning Issued</option>
                                    <option value="content_removed">Content Removed</option>
                                    <option value="user_banned">User Banned</option>
                                    <option value="dismissed">Dismissed</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Review Notes</label>
                                <textarea
                                    value={actionData.reviewNotes}
                                    onChange={(e) => setActionData({ ...actionData, reviewNotes: e.target.value })}
                                    placeholder="Add notes about your decision..."
                                />
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button
                                className={`${styles.btn} ${styles.btnSecondary}`}
                                onClick={() => setShowModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className={`${styles.btn} ${styles.btnPrimary}`}
                                onClick={handleUpdateReport}
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
