import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { AddTransactionPage } from './pages/AddTransactionPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AlertCircle } from 'lucide-react';
import './styles/variables.css';
import './styles/layout.css';
import './App.css';

// System Architecture: Section 5.1, 5.2, 5.3
// Routing between Dashboard, Transactions, Add Transaction, Analytics, Settings

function MainContent() {
  const { currentPage, globalError } = useApp();

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'transactions':
        return <TransactionsPage />;
      case 'add':
        return <AddTransactionPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="main-wrapper">
      {/* NFR-08: Error alert when backend is unavailable */}
      {globalError && (
        <div className="global-error-banner" role="alert">
          <AlertCircle size={20} />
          <span>{globalError}</span>
        </div>
      )}

      {/* Topbar with UI-02 month heading and search */}
      <Topbar />

      {/* Dynamic View Content */}
      <main className="content-container">
        {renderCurrentPage()}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <div className="app-container">
        <Sidebar />
        <MainContent />
      </div>
    </AppProvider>
  );
}
