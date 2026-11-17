import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/formatters';
import { BarChart3 } from 'lucide-react';
import './SpendingOverviewChart.css';

// Requirements: UI-09, UI-11, UI-12, FR-05, NFR-15

export function SpendingOverviewChart({ data = [] }) {
  const { settings } = useApp();

  const hasData = data && data.length > 0 && data.some((d) => d.expenses > 0 || d.income > 0);

  // Custom Recharts Tooltip satisfying UI-11
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-chart-tooltip">
          <p className="tooltip-title">{label}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} className="tooltip-item" style={{ color: entry.color }}>
              <span>{entry.name}: </span>
              <strong>{formatCurrency(entry.value, settings.currencySymbol)}</strong>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-card-container">
      <div className="chart-card-header">
        <div className="chart-title-box">
          <BarChart3 size={20} className="chart-title-icon" />
          <h3 className="chart-title">Spending Overview</h3>
        </div>
      </div>

      <div className="chart-body">
        {/* UI-12, NFR-15: Placeholder message when it has no data */}
        {!hasData ? (
          <div className="chart-empty-placeholder" role="status">
            <p>No spending data available for the last 6 months.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#23283c" vertical={false} />
              {/* UI-09: Labeled axis for months */}
              <XAxis 
                dataKey="label" 
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
              <Legend 
                verticalAlign="top" 
                align="right" 
                wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }} 
              />
              {/* Green Income & Purple Expenses bars matching UI Reference */}
              <Bar 
                dataKey="income" 
                name="Income" 
                fill="#10b981" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={20} 
              />
              <Bar 
                dataKey="expenses" 
                name="Expenses" 
                fill="#818cf8" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={20} 
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
