import React, { useState } from 'react';
import { X, Edit3, Trash2, Calendar, Tag, FileText, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { CATEGORY_COLORS, DEFAULT_CATEGORY_COLOR } from '../utils/categories';
import { TransactionForm } from './TransactionForm';
import './TransactionDetailModal.css';

// Requirements: FR-10, FR-11, UC-06

export function TransactionDetailModal({ transaction, onClose, onEditComplete, onDeleteRequest }) {
  const { settings } = useApp();
  const [isEditing, setIsEditing] = useState(false);

  if (!transaction) return null;

  const isIncome = transaction.type === 'income';
  const catColor = CATEGORY_COLORS[transaction.category] || DEFAULT_CATEGORY_COLOR;

  const handleEditSuccess = () => {
    setIsEditing(false);
    if (onEditComplete) onEditComplete();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="detail-modal-title">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <h3 id="detail-modal-title" className="modal-title">
            {isEditing ? 'Edit Transaction' : 'Transaction Details'}
          </h3>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {isEditing ? (
          /* FR-11: Edit transaction form pre-filled */
          <div className="modal-edit-container">
            <TransactionForm
              initialData={transaction}
              onSuccess={handleEditSuccess}
              onCancel={() => setIsEditing(false)}
            />
          </div>
        ) : (
          /* FR-10: Detail view displaying type, description, amount, category, and date */
          <div className="modal-body">
            <div className="detail-amount-card">
              <span className={`detail-type-badge ${isIncome ? 'income-badge' : 'expense-badge'}`}>
                {isIncome ? 'Income' : 'Expense'}
              </span>
              <div className={`detail-amount-text ${isIncome ? 'amount-income' : 'amount-expense'}`}>
                {isIncome ? '+ ' : '- '}
                {formatCurrency(transaction.amount, settings.currencySymbol)}
              </div>
            </div>

            <div className="detail-rows-list">
              <div className="detail-row">
                <div className="detail-label">
                  <FileText size={16} />
                  <span>Description</span>
                </div>
                <div className="detail-value">{transaction.description}</div>
              </div>

              <div className="detail-row">
                <div className="detail-label">
                  <Tag size={16} />
                  <span>Category</span>
                </div>
                <div className="detail-value">
                  <span
                    className="category-pill"
                    style={{ borderColor: catColor, color: catColor }}
                  >
                    {transaction.category}
                  </span>
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-label">
                  <Calendar size={16} />
                  <span>Date</span>
                </div>
                <div className="detail-value">
                  {formatDate(transaction.date, settings.dateFormat)}
                </div>
              </div>

              {transaction.createdAt && (
                <div className="detail-row">
                  <div className="detail-label">
                    <Clock size={16} />
                    <span>Created</span>
                  </div>
                  <div className="detail-value timestamp-value">
                    {new Date(transaction.createdAt).toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="modal-footer-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => onDeleteRequest(transaction)}
              >
                <Trash2 size={16} />
                <span>Delete</span>
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 size={16} />
                <span>Edit</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
