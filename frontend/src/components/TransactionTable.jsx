import React from 'react';
import { Eye, Edit2, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { CATEGORY_COLORS, DEFAULT_CATEGORY_COLOR } from '../utils/categories';
import './TransactionTable.css';

// Requirements: UI-13, UI-14, UI-15, UI-16, UI-27, UI-24

export function TransactionTable({ transactions, onView, onEdit, onDelete }) {
  const { settings } = useApp();

  if (!transactions || transactions.length === 0) {
    return (
      <div className="empty-table-state" role="status">
        <p className="empty-text">No transactions match the current criteria.</p>
      </div>
    );
  }

  return (
    <div className="table-scroll-wrapper">
      <table className="transaction-table" aria-label="Transactions List">
        {/* UI-16: Sticky table header */}
        <thead className="sticky-header">
          <tr>
            {/* UI-13: Columns Date, Description, Category, Type, and Amount */}
            <th scope="col" className="col-date">Date</th>
            <th scope="col" className="col-desc">Description</th>
            <th scope="col" className="col-cat">Category</th>
            <th scope="col" className="col-type">Type</th>
            <th scope="col" className="col-amount">Amount</th>
            <th scope="col" className="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => {
            const isIncome = tx.type === 'income';
            const catColor = CATEGORY_COLORS[tx.category] || DEFAULT_CATEGORY_COLOR;
            return (
              <tr key={tx.id} className="table-row">
                <td className="col-date">
                  {formatDate(tx.date, settings.dateFormat)}
                </td>
                <td className="col-desc">
                  <span className="desc-text" title={tx.description}>
                    {tx.description}
                  </span>
                </td>
                <td className="col-cat">
                  <span
                    className="category-pill"
                    style={{ borderColor: catColor, color: catColor }}
                  >
                    {tx.category}
                  </span>
                </td>
                {/* UI-27: Type label displayed alongside color and sign */}
                <td className="col-type">
                  <span className={`type-badge ${isIncome ? 'income-badge' : 'expense-badge'}`}>
                    {isIncome ? 'Income' : 'Expense'}
                  </span>
                </td>
                {/* UI-14, UI-27: Income positive (+), expense negative (-) */}
                <td className={`col-amount ${isIncome ? 'amount-income' : 'amount-expense'}`}>
                  {isIncome ? '+ ' : '- '}
                  {formatCurrency(tx.amount, settings.currencySymbol)}
                </td>
                {/* UI-15: View, Edit, Delete controls */}
                <td className="col-actions">
                  <div className="action-buttons-group">
                    <button
                      type="button"
                      className="table-action-btn view-btn"
                      onClick={() => onView(tx)}
                      aria-label={`View transaction ${tx.description}`}
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      type="button"
                      className="table-action-btn edit-btn"
                      onClick={() => onEdit(tx)}
                      aria-label={`Edit transaction ${tx.description}`}
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      type="button"
                      className="table-action-btn delete-btn"
                      onClick={() => onDelete(tx)}
                      aria-label={`Delete transaction ${tx.description}`}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
