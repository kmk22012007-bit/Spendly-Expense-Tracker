import React from 'react';
import { PlusCircle } from 'lucide-react';
import { TransactionForm } from './TransactionForm';
import './DashboardQuickAdd.css';

export function DashboardQuickAdd() {
  return (
    <div className="dashboard-quick-add-card">
      <div className="quick-add-header">
        <div className="quick-add-title-box">
          <PlusCircle size={20} className="quick-add-icon" />
          <h3 className="quick-add-title">Add New Transaction</h3>
        </div>
      </div>

      <div className="quick-add-body">
        <TransactionForm embedded={true} />
      </div>
    </div>
  );
}
