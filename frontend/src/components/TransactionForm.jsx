import React, { useState, useEffect } from 'react';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../utils/categories';
import { validateForm } from '../utils/validators';
import { apiClient } from '../api/client';
import { useApp } from '../context/AppContext';
import { ArrowDownLeft, ArrowUpRight, Calendar, DollarSign, FileText, Tag, Check, AlertCircle } from 'lucide-react';
import './TransactionForm.css';

// Requirements: FR-16 to FR-23, UI-17 to UI-21, NFR-12, FR-11

export function TransactionForm({ initialData = null, onSuccess, onCancel, embedded = false }) {
  const { settings, triggerRefresh, addTransactionType } = useApp();

  const getTodayDateString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    type: initialData?.type || addTransactionType || 'expense',
    description: initialData?.description || '',
    amount: initialData?.amount !== undefined ? String(initialData.amount) : '',
    category: initialData?.category || (initialData?.type === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]),
    date: initialData?.date || getTodayDateString(), // UI-19: Date defaults to current date
  });

  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  // Validate form fields
  const { errors, isValid } = validateForm(formData);

  // If type changes, adjust category if it doesn't fit the new type
  const handleTypeChange = (newType) => {
    const newDefaultCat = newType === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0];
    setFormData((prev) => ({
      ...prev,
      type: newType,
      category: newDefaultCat,
    }));
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setServerError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      type: true,
      description: true,
      amount: true,
      category: true,
      date: true,
    });

    if (!isValid) return;

    setSubmitting(true);
    setServerError(null);

    const payload = {
      type: formData.type,
      description: formData.description.trim(),
      amount: Number(formData.amount).toFixed(2),
      category: formData.category,
      date: formData.date,
    };

    try {
      if (initialData?.id) {
        // Edit mode (FR-11)
        await apiClient.updateTransaction(initialData.id, payload);
      } else {
        // Create mode (FR-16, FR-20)
        await apiClient.createTransaction(payload);
      }

      triggerRefresh();
      setSuccessMessage(initialData?.id ? 'Transaction updated successfully!' : 'Transaction added successfully!');

      if (embedded) {
        // Reset embedded form
        setFormData({
          type: formData.type,
          description: '',
          amount: '',
          category: formData.type === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0],
          date: getTodayDateString(),
        });
        setTouched({});
        setTimeout(() => setSuccessMessage(null), 3000);
      } else if (onSuccess) {
        setTimeout(() => onSuccess(), 500);
      }
    } catch (err) {
      if (err.data && typeof err.data === 'object') {
        const errorStrings = [];
        for (const [field, fieldErrors] of Object.entries(err.data)) {
          if (Array.isArray(fieldErrors)) {
            errorStrings.push(`${fieldErrors.join(', ')}`);
          } else {
            errorStrings.push(String(fieldErrors));
          }
        }
        setServerError(errorStrings.join(' '));
      } else {
        setServerError(err.message || 'Failed to save transaction.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // UI-18: Categories list for selected type
  const availableCategories = formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <form className={`transaction-form ${embedded ? 'embedded-form' : ''}`} onSubmit={handleSubmit} noValidate>
      {serverError && (
        <div className="form-alert error-alert" role="alert">
          <AlertCircle size={18} />
          <span>{serverError}</span>
        </div>
      )}

      {successMessage && (
        <div className="form-alert success-alert" role="status">
          <Check size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* UI-17: 1. Segmented Control for Income and Expense */}
      <div className="form-group">
        <label className="form-label">Transaction Type</label>
        <div className="segmented-control" role="group" aria-label="Transaction Type">
          <button
            type="button"
            className={`segment-btn expense-btn ${formData.type === 'expense' ? 'active' : ''}`}
            onClick={() => handleTypeChange('expense')}
            aria-pressed={formData.type === 'expense'}
          >
            <ArrowDownLeft size={16} />
            <span>Expense</span>
          </button>
          <button
            type="button"
            className={`segment-btn income-btn ${formData.type === 'income' ? 'active' : ''}`}
            onClick={() => handleTypeChange('income')}
            aria-pressed={formData.type === 'income'}
          >
            <ArrowUpRight size={16} />
            <span>Income</span>
          </button>
        </div>
        {errors.type && touched.type && (
          <span className="field-error-message" role="alert">{errors.type}</span>
        )}
      </div>

      {/* UI-17: 2. Description field */}
      <div className="form-group">
        <label htmlFor="tx-description" className="form-label">Description</label>
        <div className="input-with-icon">
          <FileText className="input-icon" size={18} />
          <input
            id="tx-description"
            type="text"
            className={`form-input ${errors.description && touched.description ? 'input-error' : ''}`}
            placeholder="e.g. Grocery shopping, Salary"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            onBlur={() => handleBlur('description')}
            maxLength={105}
            required
            aria-required="true"
            aria-invalid={!!(errors.description && touched.description)}
          />
        </div>
        {/* NFR-12, UI-20: Error message next to the field */}
        {errors.description && touched.description && (
          <span className="field-error-message" role="alert">{errors.description}</span>
        )}
      </div>

      {/* UI-17: 3. Amount and 4. Category fields */}
      <div className="form-row">
        {/* Amount */}
        <div className="form-group flex-1">
          <label htmlFor="tx-amount" className="form-label">
            Amount ({settings.currencySymbol})
          </label>
          <div className="input-with-icon">
            <span className="currency-prefix">{settings.currencySymbol}</span>
            <input
              id="tx-amount"
              type="number"
              step="0.01"
              min="0.01"
              max="9999999.99"
              className={`form-input ${errors.amount && touched.amount ? 'input-error' : ''}`}
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              onBlur={() => handleBlur('amount')}
              required
              aria-required="true"
              aria-invalid={!!(errors.amount && touched.amount)}
            />
          </div>
          {/* NFR-12, UI-20: Error message next to the field */}
          {errors.amount && touched.amount && (
            <span className="field-error-message" role="alert">{errors.amount}</span>
          )}
        </div>

        {/* Category: UI-18 lists only categories for selected type */}
        <div className="form-group flex-1">
          <label htmlFor="tx-category" className="form-label">Category</label>
          <div className="input-with-icon">
            <Tag className="input-icon" size={18} />
            <select
              id="tx-category"
              className={`form-select ${errors.category && touched.category ? 'input-error' : ''}`}
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              onBlur={() => handleBlur('category')}
              required
              aria-required="true"
              aria-invalid={!!(errors.category && touched.category)}
            >
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          {errors.category && touched.category && (
            <span className="field-error-message" role="alert">{errors.category}</span>
          )}
        </div>
      </div>

      {/* UI-17: 5. Date field (defaults to current date UI-19) */}
      <div className="form-group">
        <label htmlFor="tx-date" className="form-label">Date</label>
        <div className="input-with-icon">
          <Calendar className="input-icon" size={18} />
          <input
            id="tx-date"
            type="date"
            className={`form-input ${errors.date && touched.date ? 'input-error' : ''}`}
            value={formData.date}
            onChange={(e) => handleChange('date', e.target.value)}
            onBlur={() => handleBlur('date')}
            required
            aria-required="true"
            aria-invalid={!!(errors.date && touched.date)}
          />
        </div>
        {/* NFR-12, UI-20: Error message next to the field */}
        {errors.date && touched.date && (
          <span className="field-error-message" role="alert">{errors.date}</span>
        )}
      </div>

      {/* Form Action Buttons: UI-20, UI-21 */}
      <div className="form-actions">
        {onCancel && (
          <button
            type="button"
            className="btn btn-secondary cancel-btn"
            onClick={onCancel}
          >
            Cancel
          </button>
        )}

        {/* UI-20: Save button is disabled while any field fails validation */}
        <button
          type="submit"
          className="btn btn-primary submit-btn"
          disabled={!isValid || submitting}
          aria-disabled={!isValid || submitting}
        >
          {submitting
            ? 'Saving...'
            : initialData?.id
            ? 'Update Transaction'
            : embedded
            ? 'Add Transaction'
            : 'Save Transaction'}
        </button>
      </div>
    </form>
  );
}
