// Assumption A-02: Default currency is Indian Rupee (INR, symbol ₹)

/**
 * Formats a monetary number with currency symbol and 2 decimal places (UI-07).
 */
export function formatCurrency(amount, currencySymbol = '₹') {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `${currencySymbol}0.00`;
  }
  const numericAmount = Math.abs(Number(amount));
  const formatted = numericAmount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currencySymbol}${formatted}`;
}

/**
 * Formats signed monetary amounts (+ for income, - for expense) (UI-14, UI-27).
 */
export function formatSignedAmount(amount, type, currencySymbol = '₹') {
  const formatted = formatCurrency(amount, currencySymbol);
  if (type === 'income') {
    return `+ ${formatted}`;
  } else {
    return `- ${formatted}`;
  }
}

/**
 * Formats a date string according to the selected date display format (FR-30).
 */
export function formatDate(dateString, format = 'YYYY-MM-DD') {
  if (!dateString) return '';
  try {
    const [year, month, day] = dateString.split('-');
    if (!year || !month || !day) return dateString;

    if (format === 'DD/MM/YYYY') {
      return `${day}/${month}/${year}`;
    }
    if (format === 'MM/DD/YYYY') {
      return `${month}/${day}/${year}`;
    }
    // Default YYYY-MM-DD
    return `${year}-${month}-${day}`;
  } catch {
    return dateString;
  }
}

/**
 * Formats a percentage rounded to 1 decimal place (FR-25).
 */
export function formatPercentage(percentage) {
  if (percentage === null || percentage === undefined || isNaN(percentage)) {
    return '0.0%';
  }
  return `${Number(percentage).toFixed(1)}%`;
}
