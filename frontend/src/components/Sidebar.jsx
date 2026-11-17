import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Receipt, 
  BarChart3, 
  Settings, 
  Menu, 
  X,
  Wallet
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import './Sidebar.css';

// Functional Requirements: UI-03, UI-04, UI-05, FR-32

export function Sidebar() {
  const { currentPage, navigateTo } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // UI-03: Sidebar links with Lucide icons and text labels
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'add', label: 'Add Transaction', icon: PlusCircle },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (pageId) => {
    navigateTo(pageId);
    setMobileMenuOpen(false); // Close mobile menu if opened
  };

  return (
    <aside className="sidebar-container" aria-label="Main Navigation">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="logo-wrapper">
          <div className="logo-icon-box">
            <Wallet className="logo-icon" size={24} />
          </div>
          <div className="logo-text">
            <span className="brand-title">Spendly</span>
            <span className="brand-subtitle">Expense Tracker</span>
          </div>
        </div>

        {/* UI-05: Mobile Menu Toggle Button (< 768px) */}
        <button 
          className="mobile-menu-btn" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className={`sidebar-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <ul className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            // UI-04: Active page link visually distinguished
            const isActive = currentPage === item.id;
            return (
              <li key={item.id} className="nav-item">
                <button
                  type="button"
                  className={`nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => handleNavClick(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="nav-icon" size={20} />
                  <span className="nav-label">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* FR-32: The system shall NOT display a logout control */}
      </nav>
    </aside>
  );
}
