import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { apiClient } from '../api/client';
import { PeriodSelector } from '../components/PeriodSelector';
import { PeriodSummary } from '../components/PeriodSummary';
import { CategoryBreakdownTable } from '../components/CategoryBreakdownTable';
import { MonthlySpendingChart } from '../components/MonthlySpendingChart';
import { Loader2 } from 'lucide-react';
import './AnalyticsPage.css';

// Requirements: FR-24 to FR-28

export function AnalyticsPage() {
  const { refreshKey } = useApp();

  const [period, setPeriod] = useState('this_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load analytics metrics for selected period (FR-24 to FR-28)
  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getAnalytics({
        period,
        startDate: period === 'custom' ? startDate : undefined,
        endDate: period === 'custom' ? endDate : undefined,
      });
      setAnalyticsData(data);
    } catch (err) {
      setError(err.message || 'Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  }, [period, startDate, endDate, refreshKey]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <h2 className="analytics-title">Analytics & Reports</h2>
        <p className="analytics-subtitle">
          Track your cash flow, analyze expense distributions, and spot long-term patterns.
        </p>
      </div>

      {/* FR-28: Period Selector */}
      <PeriodSelector
        period={period}
        onPeriodChange={setPeriod}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
      />

      {loading && !analyticsData ? (
        <div className="analytics-loading-box" role="status">
          <Loader2 className="spinner-icon" size={36} />
          <span>Calculating analytics...</span>
        </div>
      ) : error ? (
        <div className="analytics-error-box" role="alert">
          <p>{error}</p>
          <button type="button" className="btn btn-secondary" onClick={loadAnalytics}>
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* FR-24: Period Summary Cards (Income, Expenses, Net) */}
          <PeriodSummary
            totalIncome={analyticsData?.totalIncome || 0}
            totalExpenses={analyticsData?.totalExpenses || 0}
            netAmount={analyticsData?.netAmount || 0}
          />

          {/* FR-26, FR-27: Monthly Spending Chart & Average */}
          <MonthlySpendingChart
            monthlyData={analyticsData?.monthlySpending || []}
            averageMonthlyExpense={analyticsData?.averageMonthlyExpense || 0}
            hasData={analyticsData?.hasData}
          />

          {/* FR-25: Category Breakdown Table with % share */}
          <CategoryBreakdownTable breakdown={analyticsData?.categoryBreakdown || []} />
        </>
      )}
    </div>
  );
}
