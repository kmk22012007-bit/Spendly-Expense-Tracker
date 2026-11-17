import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { apiClient } from '../api/client';
import { Settings, DollarSign, Calendar, Trash2, AlertTriangle, Check, X } from 'lucide-react';
import './SettingsPage.css';

// Requirements: FR-29, FR-30, FR-31, Assumption A-02

export function SettingsPage() {
  const { settings, setSettings, triggerRefresh } = useApp();

  const [currency, setCurrency] = useState(settings.currency || 'INR');
  const [dateFormat, setDateFormat] = useState(settings.dateFormat || 'YYYY-MM-DD');

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Reset confirmation state (FR-31)
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Assumption A-02: Settings list contains INR, USD, EUR, and GBP
  const currencies = [
    { code: 'INR', symbol: '₹', label: 'Indian Rupee (₹ INR)' },
    { code: 'USD', symbol: '$', label: 'US Dollar ($ USD)' },
    { code: 'EUR', symbol: '€', label: 'Euro (€ EUR)' },
    { code: 'GBP', symbol: '£', label: 'British Pound (£ GBP)' },
  ];

  const dateFormats = [
    { format: 'YYYY-MM-DD', label: 'YYYY-MM-DD (e.g. 2026-11-17)' },
    { format: 'DD/MM/YYYY', label: 'DD/MM/YYYY (e.g. 17/11/2026)' },
    { format: 'MM/DD/YYYY', label: 'MM/DD/YYYY (e.g. 11/17/2026)' },
  ];

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const updated = await apiClient.updateSettings({
        currency,
        dateFormat,
      });
      setSettings(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err.message || 'Failed to update preferences.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetData = async () => {
    setResetting(true);
    try {
      await apiClient.resetAllData();
      setShowResetConfirm(false);
      setResetSuccess(true);
      triggerRefresh();
      // Reload settings into state
      setCurrency('INR');
      setDateFormat('YYYY-MM-DD');
      setSettings({
        currency: 'INR',
        currencySymbol: '₹',
        dateFormat: 'YYYY-MM-DD',
      });
      setTimeout(() => setResetSuccess(false), 4000);
    } catch (err) {
      alert(`Failed to reset data: ${err.message}`);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h2 className="settings-title">Application Settings</h2>
        <p className="settings-subtitle">Configure display formatting, currency, and data management.</p>
      </div>

      {saveSuccess && (
        <div className="settings-alert success-alert" role="status">
          <Check size={18} />
          <span>Preferences updated successfully!</span>
        </div>
      )}

      {resetSuccess && (
        <div className="settings-alert success-alert" role="status">
          <Check size={18} />
          <span>All transactions and preferences have been successfully reset.</span>
        </div>
      )}

      {saveError && (
        <div className="settings-alert error-alert" role="alert">
          <AlertTriangle size={18} />
          <span>{saveError}</span>
        </div>
      )}

      {/* Preferences Form: FR-29, FR-30 */}
      <div className="settings-card">
        <div className="settings-card-header">
          <Settings size={20} className="card-header-icon" />
          <h3 className="card-header-title">Display Preferences</h3>
        </div>

        <form onSubmit={handleSavePreferences} className="settings-form">
          {/* FR-29 & Assumption A-02: Currency Selector */}
          <div className="form-group">
            <label htmlFor="settings-currency" className="form-label">
              <DollarSign size={16} />
              <span>Currency</span>
            </label>
            <select
              id="settings-currency"
              className="settings-select"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
            <span className="field-hint">
              Selected symbol will be used across all balance, transaction, and chart views.
            </span>
          </div>

          {/* FR-30: Date Format Selector */}
          <div className="form-group">
            <label htmlFor="settings-date-format" className="form-label">
              <Calendar size={16} />
              <span>Date Format</span>
            </label>
            <select
              id="settings-date-format"
              className="settings-select"
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
            >
              {dateFormats.map((df) => (
                <option key={df.format} value={df.format}>
                  {df.label}
                </option>
              ))}
            </select>
            <span className="field-hint">
              Controls the formatting of dates shown in transaction tables and detail cards.
            </span>
          </div>

          <div className="settings-form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone: FR-31 Reset All Data */}
      <div className="settings-card danger-card">
        <div className="settings-card-header">
          <Trash2 size={20} className="danger-icon" />
          <h3 className="card-header-title text-danger">Reset All Data</h3>
        </div>

        <div className="danger-card-body">
          <p className="danger-description">
            Erase all stored transactions, reset your balance, and restore all application settings back to defaults.
          </p>

          <button
            type="button"
            className="btn btn-danger reset-btn"
            onClick={() => setShowResetConfirm(true)}
          >
            <Trash2 size={16} />
            <span>Reset All Data...</span>
          </button>
        </div>
      </div>

      {/* Reset Confirmation Dialog: FR-31 */}
      {showResetConfirm && (
        <div className="modal-backdrop" onClick={() => setShowResetConfirm(false)} role="dialog" aria-modal="true" aria-labelledby="reset-confirm-title">
          <div className="modal-content reset-confirm-content" onClick={(e) => e.stopPropagation()}>
            <div className="reset-modal-header">
              <div className="reset-warning-box">
                <AlertTriangle size={24} className="warning-icon" />
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowResetConfirm(false)}
                aria-label="Cancel reset"
              >
                <X size={20} />
              </button>
            </div>

            <div className="reset-modal-body">
              <h3 id="reset-confirm-title" className="reset-title">Erase All Data?</h3>
              <p className="reset-message">
                This will permanently delete all income and expense transactions in your database and reset preferences back to Indian Rupee (₹).
              </p>
              <p className="reset-submessage">Are you absolutely sure you want to proceed?</p>
            </div>

            <div className="reset-modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowResetConfirm(false)}
                disabled={resetting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleResetData}
                disabled={resetting}
              >
                {resetting ? 'Resetting...' : 'Yes, Erase Everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
