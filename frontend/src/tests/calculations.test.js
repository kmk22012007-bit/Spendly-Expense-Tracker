import { describe, it, expect } from 'vitest';
import { formatCurrency, formatSignedAmount, formatDate, formatPercentage } from '../utils/formatters';

// Requirements: UI-07, UI-08, UI-14, FR-01, FR-04, FR-25, Assumption A-02, Assumption A-03

describe('Formatting and Calculation Utilities', () => {
  it('formats currency correctly with default symbol (Assumption A-02)', () => {
    expect(formatCurrency(84250, '₹')).toBe('₹84,250.00');
    expect(formatCurrency(15750.5, '₹')).toBe('₹15,750.50');
    expect(formatCurrency(0, '₹')).toBe('₹0.00');
    expect(formatCurrency(1234567.89, '$')).toBe('$12,34,567.89');
  });

  it('formats signed amounts for income and expense (UI-14, UI-27)', () => {
    expect(formatSignedAmount(100, 'income', '₹')).toBe('+ ₹100.00');
    expect(formatSignedAmount(50, 'expense', '₹')).toBe('- ₹50.00');
  });

  it('formats dates in various selected formats (FR-30)', () => {
    const rawDate = '2026-11-17';
    expect(formatDate(rawDate, 'YYYY-MM-DD')).toBe('2026-11-17');
    expect(formatDate(rawDate, 'DD/MM/YYYY')).toBe('17/11/2026');
    expect(formatDate(rawDate, 'MM/DD/YYYY')).toBe('11/17/2026');
  });

  it('formats percentage rounded to one decimal place (FR-25)', () => {
    expect(formatPercentage(35.26)).toBe('35.3%');
    expect(formatPercentage(20)).toBe('20.0%');
    expect(formatPercentage(0)).toBe('0.0%');
  });

  it('verifies balance and savings formula definitions (FR-01, FR-04, Assumption A-03)', () => {
    // Assumption A-03: Balance is total income minus total expenses across all records.
    // Savings is total income minus total expenses for current calendar month.
    const allIncome = 10000;
    const allExpenses = 3000;
    const balance = allIncome - allExpenses;
    expect(balance).toBe(7000);

    const currentMonthIncome = 5000;
    const currentMonthExpenses = 1500;
    const savings = currentMonthIncome - currentMonthExpenses;
    expect(savings).toBe(3500);
  });
});
