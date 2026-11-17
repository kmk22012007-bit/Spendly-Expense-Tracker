import React from 'react';
import { Search, Filter, RotateCcw } from 'lucide-react';
import { ALL_CATEGORIES } from '../utils/categories';
import './SearchAndFilterBar.css';

// Functional Requirements: FR-13, FR-14, FR-15, UC-05

export function SearchAndFilterBar({
  search,
  onSearchChange,
  typeFilter,
  onTypeChange,
  categoryFilter,
  onCategoryChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onClearFilters,
  totalCount,
}) {
  return (
    <div className="search-filter-container" aria-label="Transaction Filters">
      {/* Top row: Search input and match count */}
      <div className="search-count-row">
        <div className="table-search-box">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="table-search-input"
            placeholder="Search by description..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search by description"
          />
        </div>

        {/* FR-15: Display the number of transactions matching current search and filter criteria */}
        <div className="match-count-badge" aria-live="polite">
          Showing <span className="count-number">{totalCount}</span> {totalCount === 1 ? 'transaction' : 'transactions'}
        </div>
      </div>

      {/* Filter controls row: FR-14 */}
      <div className="filter-controls-row">
        {/* Type Filter */}
        <div className="filter-item">
          <label htmlFor="filter-type" className="filter-label">Type</label>
          <select
            id="filter-type"
            className="filter-select"
            value={typeFilter}
            onChange={(e) => onTypeChange(e.target.value)}
            aria-label="Filter by type"
          >
            <option value="all">All Types</option>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="filter-item">
          <label htmlFor="filter-cat" className="filter-label">Category</label>
          <select
            id="filter-cat"
            className="filter-select"
            value={categoryFilter}
            onChange={(e) => onCategoryChange(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="all">All Categories</option>
            {ALL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range Start */}
        <div className="filter-item">
          <label htmlFor="filter-start-date" className="filter-label">From Date</label>
          <input
            id="filter-start-date"
            type="date"
            className="filter-date-input"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            aria-label="Start date filter"
          />
        </div>

        {/* Date Range End */}
        <div className="filter-item">
          <label htmlFor="filter-end-date" className="filter-label">To Date</label>
          <input
            id="filter-end-date"
            type="date"
            className="filter-date-input"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            aria-label="End date filter"
          />
        </div>

        {/* Reset / Clear Filters Button */}
        <div className="filter-item filter-reset-item">
          <button
            type="button"
            className="clear-filters-btn"
            onClick={onClearFilters}
            aria-label="Clear all filters"
            title="Reset filters to default"
          >
            <RotateCcw size={16} />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
}
