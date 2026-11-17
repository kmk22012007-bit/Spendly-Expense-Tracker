import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  ReferenceLine 
} from 'recharts';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/formatters';
import { TrendingUp } from 'lucide-react';
import './MonthlySpendingChart.css';

// Requirements: FR-26, FR-27, UI-11

export function MonthlySpendingChart({ monthlyData = [], averageMonthlyExpense = 0, hasData = true }) {
  const { settings } = useApp();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-chart-tooltip">
          <p className="tooltip-title">{label}</p>
          <p className="tooltip-item">
            <span>Expenses: </span>
            <strong style={{ color: '#f43f5e' }}>
              {formatCurrency(payload[0].value, settings.currencySymbol)}
            </strong>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="monthly-chart-card">
      <div className="monthly-chart-header">
        <div className="chart-title-box">
          <TrendingUp size={20} className="chart-title-icon" />
          <div>
            <h3 className="chart-title">12-Month Expense Trend</h3>
            <span className="chart-subtitle">Monthly expense history and average</span>
          </div>
        </div>

        {/* FR-26: Average monthly expense over the last 12 calendar months */}
        <div className="avg-expense-badge">
          <span className="avg-label">12-Mo Monthly Average:</span>
          <span className="avg-amount">
            {formatCurrency(averageMonthlyExpense, settings.currencySymbol)}
          </span>
        </div>
      </div>

      <div className="monthly-chart-body">
        {/* FR-27: Display message "No data for the selected period" when no transactions match */}
        {!hasData || monthlyData.length === 0 || !monthlyData.some((d) => d.expenses > 0) ? (
          <div className="monthly-empty-state" role="status">
            <p>No data for the selected period</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#23283c" vertical={false} />
              <XAxis 
                dataKey="shortLabel" 
                stroke="#64748b" 
                tick={{ fill: '#94a3b8', fontSize: 12 }} 
                axisLine={{ stroke: '#23283c' }}
                tickLine={false}
              />
              <YAxis 
                stroke="#64748b" 
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => {
                  if (val >= 1000) return `${settings.currencySymbol}${Math.round(val / 1000)}k`;
                  return `${settings.currencySymbol}${val}`;
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              {averageMonthlyExpense > 0 && (
                <ReferenceLine 
                  y={averageMonthlyExpense} 
                  stroke="#fbbf24" 
                  strokeDasharray="4 4" 
                  label={{ value: 'Avg', fill: '#fbbf24', fontSize: 11, position: 'right' }} 
                />
              )}
              <Bar 
                dataKey="expenses" 
                name="Expenses" 
                fill="#f43f5e" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={28} 
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
