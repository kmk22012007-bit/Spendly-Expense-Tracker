import { describe, it, expect } from 'vitest';
import { validateForm, ERROR_MESSAGES } from '../utils/validators';

// Requirements: VR-01 to VR-09, Section 7.5, Assumption A-06

describe('Client-Side Form Validation Rules (VR-01 to VR-09)', () => {
  const getValidPayload = () => ({
    type: 'expense',
    description: 'Grocery shopping',
    amount: '120.50',
    category: 'Food',
    date: '2026-11-17',
  });

  it('VR-01: validates type must be income or expense', () => {
    const payload = getValidPayload();
    payload.type = 'invalid';
    const { errors, isValid } = validateForm(payload);
    expect(isValid).toBe(false);
    expect(errors.type).toBe(ERROR_MESSAGES.TYPE);
  });

  it('VR-02: validates description not empty after trim', () => {
    const payload = getValidPayload();
    payload.description = '    ';
    const { errors, isValid } = validateForm(payload);
    expect(isValid).toBe(false);
    expect(errors.description).toBe(ERROR_MESSAGES.DESC_EMPTY);
  });

  it('VR-03: validates description does not exceed 100 characters', () => {
    const payload = getValidPayload();
    payload.description = 'a'.repeat(101);
    const { errors, isValid } = validateForm(payload);
    expect(isValid).toBe(false);
    expect(errors.description).toBe(ERROR_MESSAGES.DESC_MAX);

    payload.description = 'a'.repeat(100);
    const validRes = validateForm(payload);
    expect(validRes.errors.description).toBeUndefined();
  });

  it('VR-04: validates amount greater than zero', () => {
    const payload = getValidPayload();
    payload.amount = '0';
    let res = validateForm(payload);
    expect(res.isValid).toBe(false);
    expect(res.errors.amount).toBe(ERROR_MESSAGES.AMOUNT_GT_ZERO);

    payload.amount = '-25.00';
    res = validateForm(payload);
    expect(res.isValid).toBe(false);
    expect(res.errors.amount).toBe(ERROR_MESSAGES.AMOUNT_GT_ZERO);
  });

  it('VR-05: validates amount at most two decimal places', () => {
    const payload = getValidPayload();
    payload.amount = '10.555';
    const { errors, isValid } = validateForm(payload);
    expect(isValid).toBe(false);
    expect(errors.amount).toBe(ERROR_MESSAGES.AMOUNT_DECIMALS);
  });

  it('VR-06: validates amount does not exceed 9,999,999.99 (Assumption A-06)', () => {
    const payload = getValidPayload();
    payload.amount = '10000000';
    const { errors, isValid } = validateForm(payload);
    expect(isValid).toBe(false);
    expect(errors.amount).toBe(ERROR_MESSAGES.AMOUNT_MAX);

    payload.amount = '9999999.99';
    const validRes = validateForm(payload);
    expect(validRes.errors.amount).toBeUndefined();
  });

  it('VR-07: validates category belongs to the selected type', () => {
    const payload = getValidPayload();
    // Salary is an income category, but type is expense
    payload.category = 'Salary';
    let res = validateForm(payload);
    expect(res.isValid).toBe(false);
    expect(res.errors.category).toBe(ERROR_MESSAGES.CATEGORY);

    // Food is an expense category, but type is income
    payload.type = 'income';
    payload.category = 'Food';
    res = validateForm(payload);
    expect(res.isValid).toBe(false);
    expect(res.errors.category).toBe(ERROR_MESSAGES.CATEGORY);
  });

  it('VR-08: validates date is a valid date', () => {
    const payload = getValidPayload();
    payload.date = 'invalid-date';
    const { errors, isValid } = validateForm(payload);
    expect(isValid).toBe(false);
    expect(errors.date).toBe(ERROR_MESSAGES.DATE_INVALID);
  });

  it('VR-09: validates date cannot be more than 1 year in the future (Assumption A-06)', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 370);
    const dateStr = futureDate.toISOString().split('T')[0];

    const payload = getValidPayload();
    payload.date = dateStr;
    const { errors, isValid } = validateForm(payload);
    expect(isValid).toBe(false);
    expect(errors.date).toBe(ERROR_MESSAGES.DATE_FUTURE);
  });
});
