import React from 'react';
import { History, ArrowRight, Utensils, Car, Building, Zap, Film, Heart, ShoppingBag, DollarSign, Briefcase, TrendingUp, Layers } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { CATEGORY_COLORS, DEFAULT_CATEGORY_COLOR } from '../utils/categories';
import './RecentTransactions.css';

// Requirement: FR-07: Display five most recent transactions ordered by date descending

const CATEGORY_ICONS = {
  Food: Utensils,
  Transport: Car,
  Housing: Building,
  Utilities: Zap,
  Entertainment: Film,
  Health: Heart,
  Shopping: ShoppingBag,
  Salary: DollarSign,
  Business: Briefcase,
  Investment: TrendingUp,
  Other: Layers,
};

export function RecentTransactions({ transactions = [], onViewDetail }) {
  const { settings, navigateTo } = useApp();

  return (
    <div className="recent-transactions-card">
      <div className="recent-header">
        <div className="recent-title-box">
          <History size={20} className="recent-icon" />
          <h3 className="recent-title">Recent Transactions</h3>
        </div>
        <button
          type="button"
          className="view-all-btn"
          onClick={() => navigateTo('transactions')}
          aria-label="View all transactions"
        >
          <span>View All</span>
          <ArrowRight size={16} />
        </button>
      </div>

      <div className="recent-list">
        {transactions.length === 0 ? (
          <div className="recent-empty-state">
            <p>No recent transactions.</p>
          </div>
        ) : (
          transactions.map((tx) => {
            const isIncome = tx.type === 'income';
            const IconComponent = CATEGORY_ICONS[tx.category] || Layers;
            const catColor = CATEGORY_COLORS[tx.category] || DEFAULT_CATEGORY_COLOR;

            return (
              <div
                key={tx.id}
                className="recent-item-row"
                onClick={() => onViewDetail && onViewDetail(tx)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onViewDetail && onViewDetail(tx);
                  }
                }}
              >
                <div className="recent-item-left">
                  <div
                    className="category-icon-box"
                    style={{ backgroundColor: `${catColor}20`, color: catColor }}
                  >
                    <IconComponent size={18} />
                  </div>
                  <div className="recent-item-info">
                    <span className="recent-item-desc" title={tx.description}>
                      {tx.description}
                    </span>
                    <span className="recent-item-meta">
                      {formatDate(tx.date, settings.dateFormat)} • {tx.category}
                    </span>
                  </div>
                </div>

                <div className={`recent-item-amount ${isIncome ? 'amount-income' : 'amount-expense'}`}>
                  {isIncome ? '+ ' : '- '}
                  {formatCurrency(tx.amount, settings.currencySymbol)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
