// Assumption A-04: Income categories: Salary, Business, Investment, Other
export const INCOME_CATEGORIES = [
  'Salary',
  'Business',
  'Investment',
  'Other',
];

// Assumption A-05: Expense categories: Food, Transport, Housing, Utilities, Entertainment, Health, Shopping, Other
export const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Housing',
  'Utilities',
  'Entertainment',
  'Health',
  'Shopping',
  'Other',
];

export const ALL_CATEGORIES = Array.from(new Set([...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES])).sort();

// Color mapping for donut chart and badges
export const CATEGORY_COLORS = {
  Food: '#38bdf8',          // Sky blue
  Transport: '#f97316',     // Orange
  Housing: '#a855f7',       // Purple
  Utilities: '#ec4899',     // Pink / Magenta
  Entertainment: '#eab308', // Amber / Yellow
  Health: '#10b981',        // Emerald
  Shopping: '#8b5cf6',      // Violet
  Salary: '#22c55e',        // Green
  Business: '#06b6d4',      // Cyan
  Investment: '#3b82f6',    // Blue
  Other: '#94a3b8',         // Slate Gray
};

export const DEFAULT_CATEGORY_COLOR = '#64748b';
