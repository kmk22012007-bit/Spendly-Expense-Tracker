from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from tracker.models import Transaction, Preference
from decimal import Decimal
import datetime

# Requirements: FR-29, FR-30, FR-31, Assumption A-02

class SettingsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.settings_url = '/api/settings/'
        self.reset_url = '/api/settings/reset/'

    def test_fr29_fr30_preferences_get_and_update(self):
        # Default settings
        res = self.client.get(self.settings_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['currency'], 'INR') # Assumption A-02
        self.assertEqual(res.data['currencySymbol'], '₹')
        self.assertEqual(res.data['dateFormat'], 'YYYY-MM-DD')

        # Update currency to USD and date format to MM/DD/YYYY
        update_res = self.client.put(self.settings_url, {
            'currency': 'USD',
            'dateFormat': 'MM/DD/YYYY'
        }, format='json')
        self.assertEqual(update_res.status_code, status.HTTP_200_OK)
        self.assertEqual(update_res.data['currency'], 'USD')
        self.assertEqual(update_res.data['currencySymbol'], '$')
        self.assertEqual(update_res.data['dateFormat'], 'MM/DD/YYYY')

    def test_fr31_reset_all_data(self):
        # Create transactions
        Transaction.objects.create(
            type='income',
            description='Test',
            amount=Decimal('100.00'),
            category='Salary',
            date=datetime.date.today()
        )
        # Modify preferences
        self.client.put(self.settings_url, {'currency': 'EUR'}, format='json')

        self.assertTrue(Transaction.objects.exists())

        # Reset without confirmation -> fails
        fail_res = self.client.post(self.reset_url, {'confirm': False}, format='json')
        self.assertEqual(fail_res.status_code, status.HTTP_400_BAD_REQUEST)

        # Reset with confirmation -> succeeds
        success_res = self.client.post(self.reset_url, {'confirm': True}, format='json')
        self.assertEqual(success_res.status_code, status.HTTP_200_OK)

        # Verify all transactions are gone
        self.assertEqual(Transaction.objects.count(), 0)

        # Verify preferences restored to default INR
        pref = Preference.get_preferences()
        self.assertEqual(pref.currency, 'INR')
        self.assertEqual(pref.currency_symbol, '₹')
        self.assertEqual(pref.date_format, 'YYYY-MM-DD')
