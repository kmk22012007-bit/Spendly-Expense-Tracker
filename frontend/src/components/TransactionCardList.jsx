import React from 'react';
import { Eye, Edit2, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { CATEGORY_COLORS, DEFAULT_CATEGORY_COLOR } from '../utils/categories';
import './TransactionCardList.css';

// Requirement UI-23: On mobile, the transaction table shall be replaced by stacked cards showing the same fields.

export function TransactionCardList({ transactions, onView, onEdit, onDelete }) {
  const { settings } = useApp();

  if (!transactions || transactions.length === 0) {
    return (
      <div className="mobile-empty-state" role="status">
        <p className="empty-text">No transactions match the current criteria.</p>
      </div>
    );
  }

  return (
    <div className="mobile-card-list" aria-label="Transactions mobile card list">
      {transactions.map((tx) => {
        const isIncome = tx.type === 'income';
        const catColor = CATEGORY_COLORS[tx.category] || DEFAULT_CATEGORY_COLOR;

        return (
          <div key={tx.id} className="tx-mobile-card">
            <div className="mobile-card-top">
              <span className="mobile-card-date">
                {formatDate(tx.date, settings.dateFormat)}
              </span>
              <span className={`type-badge ${isIncome ? 'income-badge' : 'expense-badge'}`}>
                {isIncome ? 'Income' : 'Expense'}
              </span>
            </div>

            <div className="mobile-card-body">
              <div className="mobile-card-desc" title={tx.description}>
                {tx.description}
              </div>
              <div className={`mobile-card-amount ${isIncome ? 'amount-income' : 'amount-expense'}`}>
                {isIncome ? '+ ' : '- '}
                {formatCurrency(tx.amount, settings.currencySymbol)}
              </div>
            </div>

            <div className="mobile-card-bottom">
              <span
                className="category-pill"
                style={{ borderColor: catColor, color: catColor }}
              >
                {tx.category}
              </span>

              {/* View, Edit, Delete controls */}
              <div className="mobile-card-actions">
                <button
                  type="button"
                  className="mobile-action-btn view-btn"
                  onClick={() => onView(tx)}
                  aria-label={`View transaction ${tx.description}`}
                >
                  <Eye size={18} />
                </button>
                <button
                  type="button"
                  className="mobile-action-btn edit-btn"
                  onClick={() => onEdit(tx)}
                  aria-label={`Edit transaction ${tx.description}`}
                >
                  <Edit2 size={18} />
                </button>
                <button
                  type="button"
                  className="mobile-action-btn delete-btn"
                  onClick={() => onDelete(tx)}
                  aria-label={`Delete transaction ${tx.description}`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
