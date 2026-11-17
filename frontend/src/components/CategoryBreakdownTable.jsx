import React from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { CATEGORY_COLORS, DEFAULT_CATEGORY_COLOR } from '../utils/categories';
import { PieChart } from 'lucide-react';
import './CategoryBreakdownTable.css';

// Requirement FR-25: Table of expense totals per category for selected period with percentage rounded to 1 decimal place

export function CategoryBreakdownTable({ breakdown = [] }) {
  const { settings } = useApp();

  if (!breakdown || breakdown.length === 0) {
    return (
      <div className="category-breakdown-card">
        <div className="breakdown-header">
          <PieChart size={20} className="breakdown-icon" />
          <h3 className="breakdown-title">Expense Breakdown by Category</h3>
        </div>
        <div className="breakdown-empty">
          <p>No expense transactions recorded in this period.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="category-breakdown-card">
      <div className="breakdown-header">
        <PieChart size={20} className="breakdown-icon" />
        <h3 className="breakdown-title">Expense Breakdown by Category</h3>
      </div>

      <div className="breakdown-table-wrapper">
        <table className="breakdown-table" aria-label="Category Expense Breakdown">
          <thead>
            <tr>
              <th scope="col">Category</th>
              <th scope="col" className="text-right">Total Spent</th>
              <th scope="col" className="text-right">Share (%)</th>
              <th scope="col" className="col-bar">Distribution</th>
            </tr>
          </thead>
          <tbody>
            {breakdown.map((item) => {
              const color = CATEGORY_COLORS[item.category] || DEFAULT_CATEGORY_COLOR;
              return (
                <tr key={item.category}>
                  <td>
                    <div className="category-cell-content">
                      <span className="cat-color-dot" style={{ backgroundColor: color }} />
                      <span className="cat-name">{item.category}</span>
                    </div>
                  </td>
                  <td className="text-right font-medium">
                    {formatCurrency(item.amount, settings.currencySymbol)}
                  </td>
                  <td className="text-right font-semibold">
                    {/* FR-25: Rounded to one decimal place */}
                    {formatPercentage(item.percentage)}
                  </td>
                  <td className="col-bar">
                    <div className="progress-bar-track">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${Math.min(100, Math.max(0, item.percentage))}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
