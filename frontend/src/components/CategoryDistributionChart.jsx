import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { CATEGORY_COLORS, DEFAULT_CATEGORY_COLOR } from '../utils/categories';
import { PieChart as PieIcon } from 'lucide-react';
import './CategoryDistributionChart.css';

// Requirements: UI-10, UI-11, UI-12, FR-06, NFR-15

export function CategoryDistributionChart({ distribution = [] }) {
  const { settings } = useApp();

  const hasData = distribution && distribution.length > 0 && distribution.some((d) => d.amount > 0);

  const totalExpenseAmount = distribution.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  // Custom tooltip satisfying UI-11
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-chart-tooltip">
          <p className="tooltip-title" style={{ color: data.fill }}>
            {data.category}
          </p>
          <p className="tooltip-item">
            <span>Amount: </span>
            <strong>{formatCurrency(data.amount, settings.currencySymbol)}</strong>
          </p>
          <p className="tooltip-item">
            <span>Share: </span>
            <strong>{formatPercentage(data.percentage)}</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-card-container">
      <div className="chart-card-header">
        <div className="chart-title-box">
          <PieIcon size={20} className="chart-title-icon" />
          <h3 className="chart-title">Expense by Category</h3>
        </div>
      </div>

      <div className="chart-body">
        {/* UI-12, NFR-15: Placeholder message when it has no data */}
        {!hasData ? (
          <div className="chart-empty-placeholder" role="status">
            <p>No expense data for this month.</p>
          </div>
        ) : (
          <div className="donut-and-legend-wrapper">
            <div className="donut-relative-container">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  {/* UI-10: Donut chart */}
                  <Pie
                    data={distribution}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                  >
                    {distribution.map((entry, index) => {
                      const color = CATEGORY_COLORS[entry.category] || DEFAULT_CATEGORY_COLOR;
                      return <Cell key={`cell-${index}`} fill={color} stroke="#141824" strokeWidth={2} />;
                    })}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center Total matching UI reference */}
              <div className="donut-center-label">
                <span className="donut-center-amount">
                  {formatCurrency(totalExpenseAmount, settings.currencySymbol)}
                </span>
                <span className="donut-center-text">Total</span>
              </div>
            </div>

            {/* UI-10: Legend listing each category and its amount / percentage */}
            <div className="category-legend-list">
              {distribution.map((item) => {
                const color = CATEGORY_COLORS[item.category] || DEFAULT_CATEGORY_COLOR;
                return (
                  <div key={item.category} className="legend-item-row">
                    <div className="legend-category-info">
                      <span className="legend-color-dot" style={{ backgroundColor: color }} />
                      <span className="legend-category-name">{item.category}</span>
                    </div>
                    <div className="legend-values">
                      <span className="legend-amount">{formatCurrency(item.amount, settings.currencySymbol)}</span>
                      <span className="legend-percentage">{formatPercentage(item.percentage)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
