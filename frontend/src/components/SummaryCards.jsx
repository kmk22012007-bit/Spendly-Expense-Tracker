import React from 'react';
import { Wallet, ArrowDownCircle, ArrowUpCircle, PiggyBank, TrendingUp, TrendingDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/formatters';
import './SummaryCards.css';

// Requirements: UI-06, UI-07, UI-08, FR-01 to FR-04, Assumption A-03

export function SummaryCards({ dashboardData }) {
  const { settings } = useApp();

  const totalBalance = dashboardData?.totalBalance ?? 0;
  const totalIncome = dashboardData?.totalIncome ?? 0;
  const totalExpenses = dashboardData?.totalExpenses ?? 0;
  const savings = dashboardData?.savings ?? 0;
  const savingsRate = dashboardData?.savingsRate ?? 0;
  const comparison = dashboardData?.comparison || {};

  // UI-06: Four summary cards labeled Total Balance, Total Income, Total Expenses, and Savings, in that order.
  const cards = [
    {
      id: 'balance',
      label: 'Total Balance',
      value: totalBalance,
      icon: Wallet,
      cardClass: 'card-balance',
      subtext: `${comparison.balanceChangePercent >= 0 ? '↑' : '↓'} ${Math.abs(comparison.balanceChangePercent || 0)}% from last month`,
      isPositiveTrend: (comparison.balanceChangePercent || 0) >= 0,
      sparklineColor: '#60a5fa',
    },
    {
      id: 'income',
      label: 'Total Income',
      value: totalIncome,
      icon: ArrowDownCircle,
      cardClass: 'card-income',
      subtext: `↑ ${Math.abs(comparison.incomeChangePercent || 0)}% from last month`,
      isPositiveTrend: (comparison.incomeChangePercent || 0) >= 0,
      sparklineColor: '#34d399',
    },
    {
      id: 'expenses',
      label: 'Total Expenses',
      value: totalExpenses,
      icon: ArrowUpCircle,
      cardClass: 'card-expenses',
      subtext: `↑ ${Math.abs(comparison.expenseChangePercent || 0)}% from last month`,
      isPositiveTrend: false, // Expense increase is red/alert
      sparklineColor: '#f87171',
    },
    {
      id: 'savings',
      label: 'Savings',
      value: savings,
      icon: PiggyBank,
      cardClass: 'card-savings',
      subtext: `${savingsRate}% of income`,
      isPositiveTrend: savings >= 0,
      sparklineColor: '#fbbf24',
    },
  ];

  return (
    <div className="summary-cards-grid" aria-label="Financial Summary Cards">
      {cards.map((card) => {
        const Icon = card.icon;
        const isNegative = card.value < 0;

        return (
          <div key={card.id} className={`summary-card ${card.cardClass}`}>
            <div className="card-top-row">
              <div className="card-icon-wrapper">
                <Icon size={22} className="card-icon" />
              </div>
              <span className="card-label">{card.label}</span>
            </div>

            {/* UI-07: Value with selected currency symbol and 2 decimal places */}
            {/* UI-08: Negative values shown with a minus sign and distinct color */}
            <div className={`card-value-display ${isNegative ? 'negative-value' : ''}`}>
              {isNegative ? '-' : ''}
              {formatCurrency(Math.abs(card.value), settings.currencySymbol)}
            </div>

            <div className="card-bottom-row">
              <span className={`card-trend-badge ${card.isPositiveTrend ? 'trend-up' : 'trend-neutral'}`}>
                {card.subtext}
              </span>

              {/* Decorative mini-sparkline curve matching UI reference */}
              <svg className="sparkline-svg" viewBox="0 0 80 28" fill="none" aria-hidden="true">
                <path
                  d="M2 22 C 20 8, 40 26, 60 12 L 78 6"
                  stroke={card.sparklineColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
}
