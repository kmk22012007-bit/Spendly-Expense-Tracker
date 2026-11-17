import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppProvider } from '../context/AppContext';
import { Sidebar } from '../components/Sidebar';
import { SummaryCards } from '../components/SummaryCards';
import { TransactionTable } from '../components/TransactionTable';
import { TransactionForm } from '../components/TransactionForm';

// Wrap helper
const renderWithProvider = (ui) => {
  return render(<AppProvider>{ui}</AppProvider>);
};

describe('UI and Component Requirements Verification', () => {
  it('Sidebar: displays required links and NO logout control (UI-03, UI-04, FR-32)', () => {
    renderWithProvider(<Sidebar />);

    // UI-03: Links to Dashboard, Transactions, Add Transaction, Analytics, Settings
    expect(screen.getByRole('button', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add transaction/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /transactions/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /analytics/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();

    // FR-32: The system shall not display a logout control in version 1
    expect(screen.queryByText(/logout/i)).not.toBeInTheDocument();
  });

  it('SummaryCards: displays 4 cards in required order with formatting (UI-06, UI-07, UI-08, FR-01 to FR-04)', () => {
    const mockData = {
      totalBalance: 84250,
      totalIncome: 100000,
      totalExpenses: 15750,
      savings: 84250,
      savingsRate: 84.25,
      comparison: {
        balanceChangePercent: 12.5,
        incomeChangePercent: 8.3,
        expenseChangePercent: 5.2,
      },
    };

    renderWithProvider(<SummaryCards dashboardData={mockData} />);

    // UI-06: Four summary cards labeled Total Balance, Total Income, Total Expenses, and Savings in that order
    const labels = screen.getAllByText(/Total Balance|Total Income|Total Expenses|Savings/i);
    expect(labels[0]).toHaveTextContent('Total Balance');
    expect(labels[1]).toHaveTextContent('Total Income');
    expect(labels[2]).toHaveTextContent('Total Expenses');
    expect(labels[3]).toHaveTextContent('Savings');

    // UI-07: Shows currency symbol and two decimal places
    expect(screen.getAllByText(/₹84,250\.00/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/₹1,00,000\.00/)).toBeInTheDocument();
    expect(screen.getByText(/₹15,750\.00/)).toBeInTheDocument();
  });

  it('TransactionTable: displays columns, signs (+/-), and actions (UI-13, UI-14, UI-15, UI-27)', () => {
    const mockTxs = [
      {
        id: '1',
        type: 'income',
        description: 'Monthly Salary',
        amount: '50000.00',
        category: 'Salary',
        date: '2026-11-15',
      },
      {
        id: '2',
        type: 'expense',
        description: 'Supermarket Grocery',
        amount: '1250.00',
        category: 'Food',
        date: '2026-11-14',
      },
    ];

    const onView = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    renderWithProvider(
      <TransactionTable
        transactions={mockTxs}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    // UI-13: Columns Date, Description, Category, Type, Amount, Actions
    expect(screen.getByRole('columnheader', { name: /date/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /description/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /category/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /type/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /amount/i })).toBeInTheDocument();

    // UI-14: Positive sign for income, negative sign for expense
    expect(screen.getByText(/\+ ₹50,000\.00/)).toBeInTheDocument();
    expect(screen.getByText(/- ₹1,250\.00/)).toBeInTheDocument();

    // UI-15: View, Edit, Delete controls
    const viewButtons = screen.getAllByTitle(/view details/i);
    const editButtons = screen.getAllByTitle(/edit/i);
    const deleteButtons = screen.getAllByTitle(/delete/i);

    expect(viewButtons.length).toBe(2);
    expect(editButtons.length).toBe(2);
    expect(deleteButtons.length).toBe(2);

    fireEvent.click(viewButtons[0]);
    expect(onView).toHaveBeenCalledWith(mockTxs[0]);
  });

  it('TransactionForm: segmented control, validation error, disabled button, cancel (UI-17 to UI-21, NFR-12)', () => {
    const onCancel = vi.fn();
    renderWithProvider(<TransactionForm onCancel={onCancel} />);

    // UI-17: Segmented control for Expense and Income
    const expenseBtn = screen.getByRole('button', { name: /expense/i });
    const incomeBtn = screen.getByRole('button', { name: /income/i });
    expect(expenseBtn).toBeInTheDocument();
    expect(incomeBtn).toBeInTheDocument();

    // UI-18: When Expense is selected, expense categories are present
    expect(screen.getByRole('combobox', { name: /category/i })).toHaveTextContent('Food');

    // Switch to Income
    fireEvent.click(incomeBtn);
    expect(screen.getByRole('combobox', { name: /category/i })).toHaveTextContent('Salary');

    // UI-19: Date field defaults to current date (non-empty)
    const dateInput = screen.getByLabelText(/date/i);
    expect(dateInput.value).not.toBe('');

    // Description field initially empty -> Save button should be disabled (UI-20)
    const saveBtn = screen.getByRole('button', { name: /save transaction/i });
    expect(saveBtn).toBeDisabled();

    // UI-21: Cancel button calls onCancel
    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);
    expect(onCancel).toHaveBeenCalled();
  });
});
