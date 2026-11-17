import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/formatters';
import './DeleteConfirmModal.css';

// Requirements: FR-12, UC-07

export function DeleteConfirmModal({ transaction, onConfirm, onCancel, deleting = false }) {
  const { settings } = useApp();

  if (!transaction) return null;

  return (
    <div className="modal-backdrop" onClick={onCancel} role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title">
      <div className="modal-content delete-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="delete-modal-header">
          <div className="delete-icon-box">
            <AlertTriangle className="delete-warning-icon" size={24} />
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onCancel}
            aria-label="Cancel deletion"
          >
            <X size={20} />
          </button>
        </div>

        <div className="delete-modal-body">
          <h3 id="delete-dialog-title" className="delete-title">Delete Transaction?</h3>
          {/* FR-12: The dialog states the transaction description and amount */}
          <p className="delete-message">
            Are you sure you want to permanently delete:
          </p>
          <div className="delete-target-preview">
            <span className="target-desc">"{transaction.description}"</span>
            <span className="target-amount">
              {formatCurrency(transaction.amount, settings.currencySymbol)}
            </span>
          </div>
          <p className="delete-subtext">This action cannot be undone.</p>
        </div>

        <div className="delete-modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn delete-confirm-btn"
            onClick={onConfirm}
            disabled={deleting}
          >
            <Trash2 size={16} />
            <span>{deleting ? 'Deleting...' : 'Confirm Delete'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
