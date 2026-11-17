import datetime
from decimal import Decimal
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from tracker.models import Transaction

# Functional Requirements: FR-09, FR-10, FR-11, FR-12, FR-13, FR-14, FR-15, FR-16, FR-19, FR-20, FR-23

class TransactionCRUDTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.base_url = '/api/transactions/'

        # Seed sample transactions
        self.tx1 = Transaction.objects.create(
            type='expense',
            description='Supermarket Grocery',
            amount=Decimal('150.50'),
            category='Food',
            date=datetime.date(2026, 11, 10)
        )
        self.tx2 = Transaction.objects.create(
            type='expense',
            description='Bus Ticket Metro',
            amount=Decimal('45.00'),
            category='Transport',
            date=datetime.date(2026, 11, 12)
        )
        self.tx3 = Transaction.objects.create(
            type='income',
            description='Consulting Salary',
            amount=Decimal('5000.00'),
            category='Salary',
            date=datetime.date(2026, 11, 15)
        )

    def test_fr16_fr19_create_income_transaction(self):
        # FR-16: Add income transaction
        # FR-19: Store with type value Income
        payload = {
            'type': 'income',
            'description': 'Freelance Work',
            'amount': '1250.00',
            'category': 'Business',
            'date': '2026-11-16'
        }
        res = self.client.post(self.base_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['type'], 'income')
        self.assertEqual(res.data['description'], 'Freelance Work')
        self.assertEqual(res.data['amount'], '1250.00')
        self.assertEqual(res.data['category'], 'Business')
        self.assertEqual(res.data['date'], '2026-11-16')
        self.assertTrue('id' in res.data)
        self.assertTrue('createdAt' in res.data)
        self.assertTrue('updatedAt' in res.data)

    def test_fr20_fr23_create_expense_transaction(self):
        # FR-20: Add expense transaction
        # FR-23: Store with type value Expense
        payload = {
            'type': 'expense',
            'description': 'Dinner Out',
            'amount': '80.00',
            'category': 'Food',
            'date': '2026-11-16'
        }
        res = self.client.post(self.base_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['type'], 'expense')
        self.assertEqual(res.data['category'], 'Food')

    def test_fr09_list_ordered_by_date_descending(self):
        # FR-09: Display all stored transactions in a table, ordered by date descending
        res = self.client.get(self.base_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data['results']
        self.assertEqual(len(results), 3)
        # Dates should be 2026-11-15, 2026-11-12, 2026-11-10
        self.assertEqual(results[0]['date'], '2026-11-15')
        self.assertEqual(results[1]['date'], '2026-11-12')
        self.assertEqual(results[2]['date'], '2026-11-10')

    def test_fr10_transaction_detail(self):
        # FR-10: Detail view that displays type, description, amount, category, and date
        res = self.client.get(f"{self.base_url}{self.tx1.id}/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['type'], 'expense')
        self.assertEqual(res.data['description'], 'Supermarket Grocery')
        self.assertEqual(res.data['amount'], '150.50')
        self.assertEqual(res.data['category'], 'Food')
        self.assertEqual(res.data['date'], '2026-11-10')

    def test_fr11_edit_transaction(self):
        # FR-11: Edit any field of existing transaction with validation
        update_payload = {
            'type': 'expense',
            'description': 'Supermarket Grocery & Cleaning',
            'amount': '180.00',
            'category': 'Food',
            'date': '2026-11-11'
        }
        res = self.client.put(f"{self.base_url}{self.tx1.id}/", update_payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['description'], 'Supermarket Grocery & Cleaning')
        self.assertEqual(res.data['amount'], '180.00')

    def test_fr12_delete_transaction(self):
        # FR-12: Delete transaction
        res = self.client.delete(f"{self.base_url}{self.tx1.id}/")
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Transaction.objects.filter(id=self.tx1.id).exists())

    def test_fr13_search_transactions(self):
        # FR-13: Search transactions by description text, case-insensitively, matching any substring
        res = self.client.get(f"{self.base_url}?search=grocery")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['count'], 1)
        self.assertEqual(res.data['results'][0]['description'], 'Supermarket Grocery')

    def test_fr14_fr15_filter_transactions(self):
        # FR-14: Filter by type (Income, Expense, All), category, start and end date
        # FR-15: Return count of matching transactions

        # Filter by type=expense
        res = self.client.get(f"{self.base_url}?type=expense")
        self.assertEqual(res.data['count'], 2)

        # Filter by category=Transport
        res = self.client.get(f"{self.base_url}?category=Transport")
        self.assertEqual(res.data['count'], 1)
        self.assertEqual(res.data['results'][0]['category'], 'Transport')

        # Filter by date range
        res = self.client.get(f"{self.base_url}?startDate=2026-11-11&endDate=2026-11-14")
        self.assertEqual(res.data['count'], 1)
        self.assertEqual(res.data['results'][0]['date'], '2026-11-12')
