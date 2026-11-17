import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Scale } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/formatters';
import './PeriodSummary.css';

// Requirement FR-24: Display total income, total expenses, and net amount (income - expenses) for selected period

export function PeriodSummary({ totalIncome = 0, totalExpenses = 0, netAmount = 0 }) {
  const { settings } = useApp();
  const isNetNegative = netAmount < 0;

  return (
    <div className="period-summary-grid" aria-label="Period Totals Summary">
      {/* 1. Total Income */}
      <div className="period-stat-card income-stat">
        <div className="stat-header">
          <div className="stat-icon-wrapper income-icon">
            <ArrowDownLeft size={20} />
          </div>
          <span className="stat-label">Total Income</span>
        </div>
        <div className="stat-value income-value">
          + {formatCurrency(totalIncome, settings.currencySymbol)}
        </div>
      </div>

      {/* 2. Total Expenses */}
      <div className="period-stat-card expense-stat">
        <div className="stat-header">
          <div className="stat-icon-wrapper expense-icon">
            <ArrowUpRight size={20} />
          </div>
          <span className="stat-label">Total Expenses</span>
        </div>
        <div className="stat-value expense-value">
          - {formatCurrency(totalExpenses, settings.currencySymbol)}
        </div>
      </div>

      {/* 3. Net Amount (Income - Expenses) */}
      <div className={`period-stat-card net-stat ${isNetNegative ? 'negative-net' : 'positive-net'}`}>
        <div className="stat-header">
          <div className="stat-icon-wrapper net-icon">
            <Scale size={20} />
          </div>
          <span className="stat-label">Net Amount</span>
        </div>
        <div className={`stat-value ${isNetNegative ? 'negative-value' : 'positive-value'}`}>
          {isNetNegative ? '- ' : '+ '}
          {formatCurrency(Math.abs(netAmount), settings.currencySymbol)}
        </div>
      </div>
    </div>
  );
}
