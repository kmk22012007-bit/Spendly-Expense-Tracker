import React from 'react';
import { Calendar } from 'lucide-react';
import './PeriodSelector.css';

// Requirement FR-28: Select period of This Month, Last 3 Months, This Year, or Custom Range

export function PeriodSelector({
  period,
  onPeriodChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
}) {
  const periods = [
    { id: 'this_month', label: 'This Month' },
    { id: 'last_3_months', label: 'Last 3 Months' },
    { id: 'this_year', label: 'This Year' },
    { id: 'custom', label: 'Custom Range' },
  ];

  return (
    <div className="period-selector-container">
      <div className="period-buttons-group" role="group" aria-label="Select Analytics Period">
        {periods.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`period-btn ${period === p.id ? 'active' : ''}`}
            onClick={() => onPeriodChange(p.id)}
            aria-pressed={period === p.id}
          >
            {p.label}
          </button>
        ))}
      </div>

      {period === 'custom' && (
        <div className="custom-range-inputs">
          <div className="date-input-box">
            <label htmlFor="custom-start" className="date-input-label">From</label>
            <div className="date-field-wrapper">
              <Calendar size={14} className="date-field-icon" />
              <input
                id="custom-start"
                type="date"
                className="date-field-input"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                aria-label="Custom range start date"
              />
            </div>
          </div>

          <div className="date-input-box">
            <label htmlFor="custom-end" className="date-input-label">To</label>
            <div className="date-field-wrapper">
              <Calendar size={14} className="date-field-icon" />
              <input
                id="custom-end"
                type="date"
                className="date-field-input"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                aria-label="Custom range end date"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
