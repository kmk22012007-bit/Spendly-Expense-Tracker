import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { apiClient } from '../api/client';
import { SearchAndFilterBar } from '../components/SearchAndFilterBar';
import { TransactionTable } from '../components/TransactionTable';
import { TransactionCardList } from '../components/TransactionCardList';
import { TransactionDetailModal } from '../components/TransactionDetailModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { Plus, Download, Loader2 } from 'lucide-react';
import './TransactionsPage.css';

// Requirements: FR-09 to FR-15, UI-13 to UI-16, UI-23, UC-05, UC-06, UC-07

export function TransactionsPage() {
  const { searchQuery, setSearchQuery, refreshKey, triggerRefresh, navigateTo } = useApp();

  const [transactions, setTransactions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state (FR-14)
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals state
  const [selectedTx, setSelectedTx] = useState(null);
  const [deleteTargetTx, setDeleteTargetTx] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Viewport width for UI-23 (mobile stacked cards vs desktop table)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch transactions with current filters (FR-09, FR-13, FR-14, FR-15)
  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getTransactions({
        search: searchQuery,
        type: typeFilter,
        category: categoryFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setTransactions(data.results || []);
      setTotalCount(data.count || 0);
    } catch (err) {
      setError(err.message || 'Failed to load transactions.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, typeFilter, categoryFilter, startDate, endDate, refreshKey]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setStartDate('');
    setEndDate('');
  };

  const handleView = (tx) => {
    setSelectedTx(tx);
  };

  const handleEdit = (tx) => {
    setSelectedTx(tx); // Detail modal has embedded edit mode
  };

  const handleDeleteRequest = (tx) => {
    if (selectedTx) setSelectedTx(null); // Close detail modal if open
    setDeleteTargetTx(tx);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetTx) return;
    setIsDeleting(true);
    try {
      await apiClient.deleteTransaction(deleteTargetTx.id);
      setDeleteTargetTx(null);
      triggerRefresh();
    } catch (err) {
      alert(`Could not delete transaction: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="transactions-page">
      {/* Header bar */}
      <div className="tx-page-header">
        <div>
          <h2 className="tx-page-title">Transactions</h2>
          <p className="tx-page-subtitle">View, search, filter, and manage all your entries.</p>
        </div>
        <button
          type="button"
          className="btn btn-primary add-new-btn"
          onClick={() => navigateTo('add')}
        >
          <Plus size={18} />
          <span>Add Transaction</span>
        </button>
      </div>

      {/* Filter and Search Bar: FR-13, FR-14, FR-15 */}
      <SearchAndFilterBar
        search={searchQuery}
        onSearchChange={setSearchQuery}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        onClearFilters={handleClearFilters}
        totalCount={totalCount}
      />

      {/* Content: Loading, Error, or Table/Card view */}
      {loading ? (
        <div className="tx-loading-box" role="status">
          <Loader2 className="spinner-icon" size={32} />
          <span>Loading transactions...</span>
        </div>
      ) : error ? (
        <div className="tx-error-box" role="alert">
          <p>{error}</p>
          <button type="button" className="btn btn-secondary" onClick={loadTransactions}>
            Retry
          </button>
        </div>
      ) : isMobile ? (
        /* UI-23: Mobile stacked cards */
        <TransactionCardList
          transactions={transactions}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDeleteRequest}
        />
      ) : (
        /* UI-13, UI-16: Desktop Table with sticky header */
        <TransactionTable
          transactions={transactions}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDeleteRequest}
        />
      )}

      {/* Detail / Edit Modal: FR-10, FR-11 */}
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

      {/* Delete Confirmation Modal: FR-12 */}
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
