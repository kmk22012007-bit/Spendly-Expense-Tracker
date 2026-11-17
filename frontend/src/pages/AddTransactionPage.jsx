import React from 'react';
import { useApp } from '../context/AppContext';
import { TransactionForm } from '../components/TransactionForm';
import { ArrowLeft } from 'lucide-react';
import './AddTransactionPage.css';

// Functional Requirements: FR-16 to FR-23, UI-17 to UI-21, UC-03, UC-04

export function AddTransactionPage() {
  const { navigateTo, editingTransaction } = useApp();

  const handleSuccess = () => {
    navigateTo('transactions');
  };

  const handleCancel = () => {
    // UI-21: Selecting Cancel shall return to the previous page without saving
    navigateTo('dashboard');
  };

  return (
    <div className="add-transaction-page">
      <div className="page-header">
        <button
          type="button"
          className="back-btn"
          onClick={handleCancel}
          aria-label="Return to previous page"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <h2 className="page-title">
          {editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
        </h2>
      </div>

      <div className="form-card-container">
        <TransactionForm
          initialData={editingTransaction}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
