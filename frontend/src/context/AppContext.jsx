import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [addTransactionType, setAddTransactionType] = useState('expense');
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [globalError, setGlobalError] = useState(null);

  // Assumption A-02: Default currency INR (symbol ₹)
  const [settings, setSettings] = useState({
    currency: 'INR',
    currencySymbol: '₹',
    dateFormat: 'YYYY-MM-DD',
  });

  // Load preferences from backend
  const loadSettings = useCallback(async () => {
    try {
      const data = await apiClient.getSettings();
      setSettings(data);
      setGlobalError(null);
    } catch (err) {
      console.warn('Could not load preferences from server, using defaults:', err.message);
      // NFR-08: display clear message when storage/backend is unavailable
      setGlobalError('Backend service is currently unavailable. Operating in fallback mode.');
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const triggerRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const navigateTo = (page, options = {}) => {
    if (options.initialType) {
      setAddTransactionType(options.initialType);
    }
    if (options.editTransaction) {
      setEditingTransaction(options.editTransaction);
    } else {
      setEditingTransaction(null);
    }
    setCurrentPage(page);
  };

  return (
    <AppContext.Provider
      value={{
        currentPage,
        navigateTo,
        addTransactionType,
        setAddTransactionType,
        editingTransaction,
        setEditingTransaction,
        searchQuery,
        setSearchQuery,
        settings,
        setSettings,
        loadSettings,
        refreshKey,
        triggerRefresh,
        globalError,
        setGlobalError,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
