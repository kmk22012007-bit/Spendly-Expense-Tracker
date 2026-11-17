import datetime
from decimal import Decimal
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from tracker.models import Transaction

# Requirements: FR-01, FR-02, FR-03, FR-04, FR-05, FR-06, FR-07, Assumption A-03

class DashboardTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/dashboard/'
        today = datetime.date.today()

        # Seed transactions in current month
        # Income = 5000 + 2000 = 7000
        Transaction.objects.create(
            type='income',
            description='Main Salary',
            amount=Decimal('5000.00'),
            category='Salary',
            date=datetime.date(today.year, today.month, 1)
        )
        Transaction.objects.create(
            type='income',
            description='Side Hustle',
            amount=Decimal('2000.00'),
            category='Business',
            date=datetime.date(today.year, today.month, 5)
        )
        # Expenses = 600 (Food) + 400 (Transport) = 1000
        Transaction.objects.create(
            type='expense',
            description='Groceries',
            amount=Decimal('600.00'),
            category='Food',
            date=datetime.date(today.year, today.month, 2)
        )
        Transaction.objects.create(
            type='expense',
            description='Monthly Transit Pass',
            amount=Decimal('400.00'),
            category='Transport',
            date=datetime.date(today.year, today.month, 4)
        )

        # Seed an old transaction in a previous year (to test FR-01 vs FR-04)
        Transaction.objects.create(
            type='income',
            description='Old Bonus',
            amount=Decimal('1000.00'),
            category='Salary',
            date=datetime.date(today.year - 1, 1, 10)
        )
        Transaction.objects.create(
            type='expense',
            description='Old Purchase',
            amount=Decimal('500.00'),
            category='Shopping',
            date=datetime.date(today.year - 1, 1, 12)
        )

    def test_fr01_to_fr04_summary_totals(self):
        # Total Income across all records = 5000 + 2000 + 1000 = 8000
        # Total Expenses across all records = 600 + 400 + 500 = 1500
        # Total Balance = 8000 - 1500 = 6500
        # Savings for current calendar month (Assumption A-03) = 7000 - 1000 = 6000
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.data

        self.assertEqual(data['totalIncome'], 8000.0) # FR-02
        self.assertEqual(data['totalExpenses'], 1500.0) # FR-03
        self.assertEqual(data['totalBalance'], 6500.0) # FR-01
        self.assertEqual(data['savings'], 6000.0) # FR-04 & Assumption A-03

    def test_fr05_spending_overview_last_six_months(self):
        # FR-05: Spending overview chart showing total expenses for each of the last 6 calendar months
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        overview = res.data['spendingOverview']
        self.assertEqual(len(overview), 6)
        # The latest month should be current month with expenses 1000.0
        self.assertEqual(overview[-1]['expenses'], 1000.0)

    def test_fr06_expense_distribution_current_month(self):
        # FR-06: Expense distribution chart showing expense totals per category for current calendar month
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        dist = res.data['categoryDistribution']
        self.assertEqual(len(dist), 2)
        # Food is 600 (60%), Transport is 400 (40%)
        self.assertEqual(dist[0]['category'], 'Food')
        self.assertEqual(dist[0]['amount'], 600.0)
        self.assertEqual(dist[0]['percentage'], 60.0)
        self.assertEqual(dist[1]['category'], 'Transport')
        self.assertEqual(dist[1]['amount'], 400.0)
        self.assertEqual(dist[1]['percentage'], 40.0)

    def test_fr07_five_most_recent_transactions(self):
        # FR-07: Five most recent transactions ordered by date descending
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        recent = res.data['recentTransactions']
        self.assertTrue(len(recent) <= 5)
        # Verify descending order
        dates = [tx['date'] for tx in recent]
        self.assertEqual(dates, sorted(dates, reverse=True))

    def test_empty_dashboard_state(self):
        # When no transactions exist
        Transaction.objects.all().delete()
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['totalBalance'], 0.0)
        self.assertEqual(res.data['totalIncome'], 0.0)
        self.assertEqual(res.data['totalExpenses'], 0.0)
        self.assertEqual(res.data['savings'], 0.0)
        self.assertEqual(res.data['categoryDistribution'], [])
        self.assertEqual(res.data['recentTransactions'], [])
