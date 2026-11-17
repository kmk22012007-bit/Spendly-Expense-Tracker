import datetime
from decimal import Decimal
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from tracker.models import Transaction

# Requirements: FR-24, FR-25, FR-26, FR-27, FR-28

class AnalyticsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/analytics/'
        self.today = datetime.date.today()

        # Seed transactions in current month
        Transaction.objects.create(
            type='income',
            description='Current Salary',
            amount=Decimal('4000.00'),
            category='Salary',
            date=datetime.date(self.today.year, self.today.month, 2)
        )
        Transaction.objects.create(
            type='expense',
            description='Restaurant Dinner',
            amount=Decimal('300.00'),
            category='Food',
            date=datetime.date(self.today.year, self.today.month, 3)
        )
        Transaction.objects.create(
            type='expense',
            description='Fuel',
            amount=Decimal('100.00'),
            category='Transport',
            date=datetime.date(self.today.year, self.today.month, 4)
        )

    def test_fr24_period_summary(self):
        # FR-24: Total income, total expenses, net amount (income - expenses)
        res = self.client.get(f"{self.url}?period=this_month")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['totalIncome'], 4000.0)
        self.assertEqual(res.data['totalExpenses'], 400.0)
        self.assertEqual(res.data['netAmount'], 3600.0)

    def test_fr25_category_breakdown_with_percentages(self):
        # FR-25: Table of expense totals per category with percentage rounded to 1 decimal place
        res = self.client.get(f"{self.url}?period=this_month")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        breakdown = res.data['categoryBreakdown']
        self.assertEqual(len(breakdown), 2)

        # Food: 300 / 400 = 75.0%
        # Transport: 100 / 400 = 25.0%
        self.assertEqual(breakdown[0]['category'], 'Food')
        self.assertEqual(breakdown[0]['amount'], 300.0)
        self.assertEqual(breakdown[0]['percentage'], 75.0)

        self.assertEqual(breakdown[1]['category'], 'Transport')
        self.assertEqual(breakdown[1]['amount'], 100.0)
        self.assertEqual(breakdown[1]['percentage'], 25.0)

    def test_fr26_monthly_spending_12_months_and_average(self):
        # FR-26: Monthly spending analysis showing total expenses for each of last 12 calendar months and average
        res = self.client.get(f"{self.url}?period=this_month")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        monthly = res.data['monthlySpending']
        self.assertEqual(len(monthly), 12)
        # Total in 12 months = 400.0 / 12 = 33.33
        self.assertEqual(res.data['averageMonthlyExpense'], 33.33)

    def test_fr27_empty_period_state(self):
        # FR-27: Display message "No data for the selected period" when no transactions match
        res = self.client.get(f"{self.url}?period=custom&startDate=2010-01-01&endDate=2010-01-31")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(res.data['hasData'])
        self.assertEqual(res.data['totalIncome'], 0.0)
        self.assertEqual(res.data['totalExpenses'], 0.0)
        self.assertEqual(res.data['netAmount'], 0.0)
        self.assertEqual(res.data['categoryBreakdown'], [])
