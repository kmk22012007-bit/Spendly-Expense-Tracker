import React from 'react';
import { Search, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';
import './Topbar.css';

// UI-02: The page heading shall state the current calendar month and year.

export function Topbar() {
  const { searchQuery, setSearchQuery, navigateTo, currentPage } = useApp();

  const now = new Date();
  const currentMonthYear = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const shortMonthYear = now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (currentPage !== 'transactions' && val.trim().length > 0) {
      navigateTo('transactions');
    }
  };

  return (
    <header className="topbar-container" aria-label="Top header">
      <div className="topbar-search-row">
        {/* Search input matching visual reference */}
        <div className="search-box">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="search-input"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={handleSearchChange}
            aria-label="Search transactions"
          />
        </div>

        {/* Date Month Badge */}
        <div className="month-badge" title={`Current Month: ${currentMonthYear}`}>
          <Calendar size={16} className="calendar-icon" />
          <span>{shortMonthYear}</span>
        </div>
      </div>

      {/* Greeting & UI-02 Page heading */}
      <div className="topbar-welcome-row">
        <div>
          <h1 className="welcome-title">
            Welcome Back! <span role="img" aria-label="wave">👋</span>
          </h1>
          {/* UI-02: Page heading states the current calendar month and year */}
          <p className="welcome-subtitle">
            Here's your expense overview for <strong className="current-month-highlight">{currentMonthYear}</strong>.
          </p>
        </div>
      </div>
    </header>
  );
}
