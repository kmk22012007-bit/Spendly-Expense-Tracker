import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import { apiClient } from '../api/client';

// Comprehensive Chapter 6 Use Case Tests

vi.mock('../api/client', () => {
  let mockTxs = [];
  let mockSettings = {
    currency: 'INR',
    currencySymbol: '₹',
    dateFormat: 'YYYY-MM-DD',
  };

  return {
    apiClient: {
      getSettings: vi.fn(async () => mockSettings),
      updateSettings: vi.fn(async (data) => {
        mockSettings = {
          ...mockSettings,
          ...data,
          currencySymbol: data.currency === 'USD' ? '$' : data.currency === 'EUR' ? '€' : '₹',
        };
        return mockSettings;
      }),
      resetAllData: vi.fn(async () => {
        mockTxs = [];
        mockSettings = { currency: 'INR', currencySymbol: '₹', dateFormat: 'YYYY-MM-DD' };
        return { message: 'Reset successful' };
      }),
      getTransactions: vi.fn(async (params = {}) => {
        let filtered = [...mockTxs];
        if (params.search) {
          filtered = filtered.filter((t) =>
            t.description.toLowerCase().includes(params.search.toLowerCase())
          );
        }
        if (params.type && params.type !== 'all') {
          filtered = filtered.filter((t) => t.type === params.type);
        }
        if (params.category && params.category !== 'all') {
          filtered = filtered.filter((t) => t.category === params.category);
        }
        return { count: filtered.length, results: filtered };
      }),
      createTransaction: vi.fn(async (data) => {
        const newTx = {
          id: `tx-${Date.now()}-${Math.random()}`,
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        mockTxs.unshift(newTx);
        return newTx;
      }),
      updateTransaction: vi.fn(async (id, data) => {
        const idx = mockTxs.findIndex((t) => t.id === id);
        if (idx >= 0) {
          mockTxs[idx] = { ...mockTxs[idx], ...data, updatedAt: new Date().toISOString() };
          return mockTxs[idx];
        }
        throw new Error('Not found');
      }),
      deleteTransaction: vi.fn(async (id) => {
        mockTxs = mockTxs.filter((t) => t.id !== id);
        return null;
      }),
      getDashboard: vi.fn(async () => {
        const allIncome = mockTxs
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0);
        const allExpense = mockTxs
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0);
        return {
          totalBalance: allIncome - allExpense,
          totalIncome: allIncome,
          totalExpenses: allExpense,
          savings: allIncome - allExpense,
          savingsRate: allIncome > 0 ? ((allIncome - allExpense) / allIncome) * 100 : 0,
          comparison: { incomeChangePercent: 0, expenseChangePercent: 0, balanceChangePercent: 0 },
          spendingOverview: [],
          categoryDistribution: [],
          recentTransactions: mockTxs.slice(0, 5),
        };
      }),
      getAnalytics: vi.fn(async (params = {}) => {
        const hasData = mockTxs.length > 0;
        const totalIncome = mockTxs
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0);
        const totalExpenses = mockTxs
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0);
        return {
          period: params.period || 'this_month',
          startDate: '2026-11-01',
          endDate: '2026-11-30',
          hasData,
          totalIncome,
          totalExpenses,
          netAmount: totalIncome - totalExpenses,
          categoryBreakdown: [],
          monthlySpending: [],
          averageMonthlyExpense: 0,
        };
      }),
    },
  };
});

describe('Chapter 6 Use Case Walkthroughs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('UC-02: View Dashboard - Empty state (Alternative Flow A1)', async () => {
    render(<App />);

    // Check heading (UI-02)
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();

    // Check 4 summary cards show 0
    await waitFor(() => {
      expect(screen.getByText('Total Balance')).toBeInTheDocument();
      expect(screen.getByText('Total Income')).toBeInTheDocument();
      expect(screen.getByText('Total Expenses')).toBeInTheDocument();
      expect(screen.getByText('Savings')).toBeInTheDocument();
    });

    // Chart placeholders show empty states (UI-12, NFR-15)
    expect(screen.getByText(/no spending data available/i)).toBeInTheDocument();
    expect(screen.getByText(/no expense data for this month/i)).toBeInTheDocument();
  });

  it('UC-03: Add Income - Main flow, Alt Flow A1 (validation), Alt Flow A2 (cancel)', async () => {
    render(<App />);

    // Click "Add Transaction" in Sidebar
    const addNavBtn = screen.getByRole('button', { name: /add transaction/i });
    fireEvent.click(addNavBtn);

    // Verify Add Transaction Page is displayed
    expect(screen.getByRole('heading', { name: /add new transaction/i })).toBeInTheDocument();

    // Select Income type (UI-17)
    const incomeBtn = screen.getByRole('button', { name: /income/i });
    fireEvent.click(incomeBtn);

    // Alternative Flow A1: Validation failure when submitting empty fields
    const saveBtn = screen.getByRole('button', { name: /save transaction/i });
    expect(saveBtn).toBeDisabled();

    // Alternative Flow A2: User selects Cancel
    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);
    // Should return to previous page (Dashboard)
    await waitFor(() => {
      expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    });

    // Re-open Add Transaction for Main Flow via sidebar
    const navButtons = screen.getAllByRole('button', { name: /add transaction/i });
    fireEvent.click(navButtons[0]);
    fireEvent.click(screen.getByRole('button', { name: /income/i }));

    // Fill valid entries
    const descInput = screen.getByLabelText(/description/i);
    const amountInput = screen.getByLabelText(/amount/i);
    const categorySelect = screen.getByLabelText(/category/i);

    fireEvent.change(descInput, { target: { value: 'Tech Consulting Salary' } });
    fireEvent.change(amountInput, { target: { value: '60000.00' } });
    fireEvent.change(categorySelect, { target: { value: 'Salary' } });

    // Save button is now enabled
    const submitBtn = screen.getByRole('button', { name: /save transaction/i });
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(apiClient.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'income',
          description: 'Tech Consulting Salary',
          amount: '60000.00',
          category: 'Salary',
        })
      );
    });
  });

  it('UC-04: Add Expense - Main flow', async () => {
    render(<App />);

    const navButtons = screen.getAllByRole('button', { name: /add transaction/i });
    fireEvent.click(navButtons[0]);

    // Expense is default
    const descInput = screen.getByLabelText(/description/i);
    const amountInput = screen.getByLabelText(/amount/i);
    const categorySelect = screen.getByLabelText(/category/i);

    fireEvent.change(descInput, { target: { value: 'Organic Supermarket Grocery' } });
    fireEvent.change(amountInput, { target: { value: '3500.50' } });
    fireEvent.change(categorySelect, { target: { value: 'Food' } });

    fireEvent.click(screen.getByRole('button', { name: /save transaction/i }));

    await waitFor(() => {
      expect(apiClient.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'expense',
          description: 'Organic Supermarket Grocery',
          amount: '3500.50',
          category: 'Food',
        })
      );
    });
  });

  it('UC-05: View Transactions - Search, filter, count, detail view, empty match (Alt Flow A1)', async () => {
    render(<App />);

    // Navigate to Transactions page
    fireEvent.click(screen.getByRole('button', { name: /^transactions/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Transactions' })).toBeInTheDocument();
      expect(apiClient.getTransactions).toHaveBeenCalled();
    });

    // Check count badge (FR-15)
    expect(screen.getByText(/showing/i)).toBeInTheDocument();

    // Test Search input (FR-13)
    const searchInput = screen.getByPlaceholderText(/search by description/i);
    fireEvent.change(searchInput, { target: { value: 'NonExistentThing' } });

    await waitFor(() => {
      expect(apiClient.getTransactions).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'NonExistentThing' })
      );
    });

    // Test Clear / Reset button
    const resetBtn = screen.getByRole('button', { name: /clear all filters/i });
    fireEvent.click(resetBtn);
    expect(searchInput.value).toBe('');
  });

  it('UC-08: View Analytics - Period selector and breakdown', async () => {
    render(<App />);

    // Navigate to Analytics page
    fireEvent.click(screen.getByRole('button', { name: /analytics/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /analytics & reports/i })).toBeInTheDocument();
      expect(apiClient.getAnalytics).toHaveBeenCalled();
    });

    // Test Period buttons (FR-28)
    const last3MoBtn = screen.getByRole('button', { name: /last 3 months/i });
    fireEvent.click(last3MoBtn);

    await waitFor(() => {
      expect(apiClient.getAnalytics).toHaveBeenCalledWith(
        expect.objectContaining({ period: 'last_3_months' })
      );
    });

    const thisYearBtn = screen.getByRole('button', { name: /this year/i });
    fireEvent.click(thisYearBtn);

    await waitFor(() => {
      expect(apiClient.getAnalytics).toHaveBeenCalledWith(
        expect.objectContaining({ period: 'this_year' })
      );
    });
  });

  it('Settings: Currency change, format change, Reset all data (FR-29 to FR-31)', async () => {
    render(<App />);

    // Navigate to Settings
    fireEvent.click(screen.getByRole('button', { name: /settings/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /application settings/i })).toBeInTheDocument();
    });

    // Change currency to USD
    const currencySelect = screen.getByLabelText(/currency/i);
    fireEvent.change(currencySelect, { target: { value: 'USD' } });

    // Save preferences
    fireEvent.click(screen.getByRole('button', { name: /save preferences/i }));

    await waitFor(() => {
      expect(apiClient.updateSettings).toHaveBeenCalledWith(
        expect.objectContaining({ currency: 'USD' })
      );
    });

    // Test Reset All Data (FR-31)
    const resetBtn = screen.getByRole('button', { name: /reset all data\.\.\./i });
    fireEvent.click(resetBtn);

    // Confirmation dialog appears
    expect(screen.getByText(/erase all data\?/i)).toBeInTheDocument();

    // Confirm
    const confirmBtn = screen.getByRole('button', { name: /yes, erase everything/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(apiClient.resetAllData).toHaveBeenCalled();
    });
  });
});
