import datetime
from decimal import Decimal
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from tracker.models import Transaction, INCOME_CATEGORIES, EXPENSE_CATEGORIES
from tracker.validators import (
    ERR_TYPE, ERR_DESC_EMPTY, ERR_DESC_LEN,
    ERR_AMOUNT_GT_ZERO, ERR_AMOUNT_DECIMALS, ERR_AMOUNT_MAX,
    ERR_CATEGORY, ERR_DATE_INVALID, ERR_DATE_FUTURE
)

# Assumption A-06: Maximum amount is 9,999,999.99 and max future date offset is 365 days.

class ValidationRulesTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/transactions/'

    def test_vr01_type_validation(self):
        # VR-01: type must be "income" or "expense"
        # Test invalid type
        payload = {
            'type': 'invalid_type',
            'description': 'Valid Desc',
            'amount': '100.00',
            'category': 'Other',
            'date': '2026-11-17'
        }
        res = self.client.post(self.url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn(ERR_TYPE, str(res.data.get('type', [])))

        # Test missing type
        payload.pop('type')
        res = self.client.post(self.url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn(ERR_TYPE, str(res.data.get('type', [])))

    def test_vr02_description_not_empty_after_trim(self):
        # VR-02: description must not be empty after trimming whitespace
        payload = {
            'type': 'expense',
            'description': '   ',
            'amount': '50.00',
            'category': 'Food',
            'date': '2026-11-17'
        }
        res = self.client.post(self.url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn(ERR_DESC_EMPTY, str(res.data.get('description', [])))

    def test_vr03_description_length_limit(self):
        # VR-03: description must not exceed 100 characters
        payload = {
            'type': 'expense',
            'description': 'A' * 101,
            'amount': '50.00',
            'category': 'Food',
            'date': '2026-11-17'
        }
        res = self.client.post(self.url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn(ERR_DESC_LEN, str(res.data.get('description', [])))

        # 100 characters should succeed
        payload['description'] = 'A' * 100
        res = self.client.post(self.url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_vr04_amount_greater_than_zero(self):
        # VR-04: amount must be a number greater than 0
        for zero_amt in ['0', '0.00', '-10.50']:
            payload = {
                'type': 'expense',
                'description': 'Test',
                'amount': zero_amt,
                'category': 'Food',
                'date': '2026-11-17'
            }
            res = self.client.post(self.url, payload, format='json')
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn(ERR_AMOUNT_GT_ZERO, str(res.data.get('amount', [])))

    def test_vr05_amount_max_two_decimals(self):
        # VR-05: amount must have at most two decimal places
        payload = {
            'type': 'expense',
            'description': 'Test Decimals',
            'amount': '12.345',
            'category': 'Food',
            'date': '2026-11-17'
        }
        res = self.client.post(self.url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn(ERR_AMOUNT_DECIMALS, str(res.data.get('amount', [])))

    def test_vr06_amount_max_limit(self):
        # VR-06: amount must not exceed 9,999,999.99 (Assumption A-06)
        payload = {
            'type': 'expense',
            'description': 'Huge Amount',
            'amount': '10000000.00',
            'category': 'Food',
            'date': '2026-11-17'
        }
        res = self.client.post(self.url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn(ERR_AMOUNT_MAX, str(res.data.get('amount', [])))

        # 9,999,999.99 should succeed
        payload['amount'] = '9999999.99'
        res = self.client.post(self.url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_vr07_category_matches_type(self):
        # VR-07: category must be a value from the category list for the selected type
        # Salary is income category, used for expense -> should fail
        payload = {
            'type': 'expense',
            'description': 'Invalid Category for Expense',
            'amount': '100.00',
            'category': 'Salary',
            'date': '2026-11-17'
        }
        res = self.client.post(self.url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn(ERR_CATEGORY, str(res.data.get('category', [])))

        # Food is expense category, used for income -> should fail
        payload['type'] = 'income'
        payload['category'] = 'Food'
        res = self.client.post(self.url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn(ERR_CATEGORY, str(res.data.get('category', [])))

        # Non-existent category
        payload['category'] = 'Spaceship'
        res = self.client.post(self.url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn(ERR_CATEGORY, str(res.data.get('category', [])))

    def test_vr08_date_validity(self):
        # VR-08: date must be a valid calendar date
        payload = {
            'type': 'expense',
            'description': 'Bad Date',
            'amount': '100.00',
            'category': 'Food',
            'date': '2026-02-31' # invalid date
        }
        res = self.client.post(self.url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn(ERR_DATE_INVALID, str(res.data.get('date', [])))

    def test_vr09_date_future_limit(self):
        # VR-09: date must not be later than current date plus 365 days (Assumption A-06)
        future_date = datetime.date.today() + datetime.timedelta(days=367)
        payload = {
            'type': 'expense',
            'description': 'Far Future',
            'amount': '100.00',
            'category': 'Food',
            'date': future_date.strftime('%Y-%m-%d')
        }
        res = self.client.post(self.url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn(ERR_DATE_FUTURE, str(res.data.get('date', [])))
