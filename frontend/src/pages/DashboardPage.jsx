import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { apiClient } from '../api/client';
import { SummaryCards } from '../components/SummaryCards';
import { SpendingOverviewChart } from '../components/SpendingOverviewChart';
import { CategoryDistributionChart } from '../components/CategoryDistributionChart';
import { RecentTransactions } from '../components/RecentTransactions';
import { DashboardQuickAdd } from '../components/DashboardQuickAdd';
import { TransactionDetailModal } from '../components/TransactionDetailModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { Loader2 } from 'lucide-react';
import './DashboardPage.css';

// Requirements: UI-01, UI-06 to UI-12, FR-01 to FR-08

export function DashboardPage() {
  const { refreshKey, triggerRefresh } = useApp();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals for interaction from recent transactions
  const [selectedTx, setSelectedTx] = useState(null);
  const [deleteTargetTx, setDeleteTargetTx] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load dashboard data (FR-01 to FR-07)
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getDashboard();
      setDashboardData(data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [refreshKey]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleDeleteRequest = (tx) => {
    if (selectedTx) setSelectedTx(null);
    setDeleteTargetTx(tx);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetTx) return;
    setIsDeleting(true);
    try {
      await apiClient.deleteTransaction(deleteTargetTx.id);
      setDeleteTargetTx(null);
      // FR-08: Updates dashboard values and charts
      triggerRefresh();
    } catch (err) {
      alert(`Could not delete transaction: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="dashboard-loading-box" role="status">
        <Loader2 className="spinner-icon" size={36} />
        <span>Loading your financial dashboard...</span>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="dashboard-error-box" role="alert">
        <p>{error}</p>
        <button type="button" className="btn btn-secondary" onClick={loadDashboardData}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* UI-01: Content Order Top-to-Bottom:
          1. Summary Cards (UI-06 to UI-08, FR-01 to FR-04)
          2. Two charts side by side on wide screens (UI-09, UI-10, FR-05, FR-06)
          3. Recent transactions / Quick add (FR-07)
      */}

      {/* 1. Summary Cards */}
      <section className="dashboard-section" aria-label="Summary Cards">
        <SummaryCards dashboardData={dashboardData} />
      </section>

      {/* 2. Charts side by side */}
      <section className="dashboard-charts-grid" aria-label="Charts Overview">
        <SpendingOverviewChart data={dashboardData?.spendingOverview || []} />
        <CategoryDistributionChart distribution={dashboardData?.categoryDistribution || []} />
      </section>

      {/* 3. Bottom Row: Recent Transactions + Quick Add Form */}
      <section className="dashboard-bottom-grid" aria-label="Recent Activity and Quick Entry">
        <RecentTransactions
          transactions={dashboardData?.recentTransactions || []}
          onViewDetail={(tx) => setSelectedTx(tx)}
        />
        <DashboardQuickAdd />
      </section>

      {/* Transaction Detail / Edit Modal */}
      {selectedTx && (
        <TransactionDetailModal
          transaction={selectedTx}
          onClose={() => setSelectedTx(null)}
          onEditComplete={() => {
            setSelectedTx(null);
            triggerRefresh();
          }}
          onDeleteRequest={handleDeleteRequest}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetTx && (
        <DeleteConfirmModal
          transaction={deleteTargetTx}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTargetTx(null)}
          deleting={isDeleting}
        />
      )}
    </div>
  );
}
