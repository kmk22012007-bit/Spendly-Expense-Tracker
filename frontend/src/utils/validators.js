import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from './categories';

// Exact error messages matching Section 7.5
export const ERROR_MESSAGES = {
  TYPE: 'Select Income or Expense.',
  DESC_EMPTY: 'Enter a description.',
  DESC_MAX: 'Description must be 100 characters or fewer.',
  AMOUNT_GT_ZERO: 'Enter an amount greater than zero.',
  AMOUNT_DECIMALS: 'Amount can have at most two decimal places.',
  AMOUNT_MAX: 'Amount exceeds the maximum of 9,999,999.99.', // Assumption A-06
  CATEGORY: 'Select a category.',
  DATE_INVALID: 'Enter a valid date.',
  DATE_FUTURE: 'Date cannot be more than one year in the future.', // Assumption A-06
};

/**
 * Validates a form state object against rules VR-01 through VR-09.
 * Returns an errors dictionary where each key contains the error string if invalid.
 */
export function validateForm(fields) {
  const errors = {};

  // VR-01: Type
  if (!fields.type || (fields.type !== 'income' && fields.type !== 'expense')) {
    errors.type = ERROR_MESSAGES.TYPE;
  }

  // VR-02 & VR-03: Description
  const desc = fields.description !== undefined && fields.description !== null ? String(fields.description) : '';
  const trimmedDesc = desc.trim();
  if (trimmedDesc.length === 0) {
    errors.description = ERROR_MESSAGES.DESC_EMPTY;
  } else if (trimmedDesc.length > 100) {
    errors.description = ERROR_MESSAGES.DESC_MAX;
  }

  // VR-04, VR-05, VR-06: Amount
  if (fields.amount === '' || fields.amount === null || fields.amount === undefined) {
    errors.amount = ERROR_MESSAGES.AMOUNT_GT_ZERO;
  } else {
    const numAmount = Number(fields.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      errors.amount = ERROR_MESSAGES.AMOUNT_GT_ZERO;
    } else if (numAmount > 9999999.99) {
      errors.amount = ERROR_MESSAGES.AMOUNT_MAX;
    } else {
      const parts = String(fields.amount).split('.');
      if (parts.length > 1 && parts[1].length > 2) {
        errors.amount = ERROR_MESSAGES.AMOUNT_DECIMALS;
      }
    }
  }

  // VR-07: Category
  if (!fields.category) {
    errors.category = ERROR_MESSAGES.CATEGORY;
  } else {
    const validCats = fields.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    if (!validCats.includes(fields.category)) {
      errors.category = ERROR_MESSAGES.CATEGORY;
    }
  }

  // VR-08 & VR-09: Date
  if (!fields.date) {
    errors.date = ERROR_MESSAGES.DATE_INVALID;
  } else {
    const d = new Date(fields.date);
    if (isNaN(d.getTime())) {
      errors.date = ERROR_MESSAGES.DATE_INVALID;
    } else {
      // Check date format YYYY-MM-DD
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(fields.date)) {
        errors.date = ERROR_MESSAGES.DATE_INVALID;
      } else {
        // VR-09: Not more than 365 days in future (Assumption A-06)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const maxFuture = new Date(today);
        maxFuture.setDate(maxFuture.getDate() + 365);

        const inputDate = new Date(`${fields.date}T00:00:00`);
        if (inputDate > maxFuture) {
          errors.date = ERROR_MESSAGES.DATE_FUTURE;
        }
      }
    }
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}
