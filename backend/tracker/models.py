import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal

# Assumption A-01: Version 1 has no user accounts, sign-in, or session.
# Assumption A-02: Default currency is INR (symbol ₹).
# Assumption A-04: Income categories: Salary, Business, Investment, Other.
# Assumption A-05: Expense categories: Food, Transport, Housing, Utilities, Entertainment, Health, Shopping, Other.
# Assumption A-06: Maximum amount is 9,999,999.99.

INCOME_CATEGORIES = [
    'Salary',
    'Business',
    'Investment',
    'Other',
]

EXPENSE_CATEGORIES = [
    'Food',
    'Transport',
    'Housing',
    'Utilities',
    'Entertainment',
    'Health',
    'Shopping',
    'Other',
]

ALL_CATEGORIES = sorted(list(set(INCOME_CATEGORIES + EXPENSE_CATEGORIES)))

TYPE_CHOICES = [
    ('income', 'Income'),
    ('expense', 'Expense'),
]

class Transaction(models.Model):
    # Unique identifier generated at creation time (Section 7.1, BI-04)
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    description = models.CharField(max_length=100)
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal('0.01')),
            MaxValueValidator(Decimal('9999999.99')) # Assumption A-06
        ]
    )
    category = models.CharField(max_length=50)
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['-date', '-created_at']),
            models.Index(fields=['type', 'date']),
            models.Index(fields=['category']),
        ]

    def __str__(self):
        return f"{self.type}: {self.description} ({self.amount}) on {self.date}"


class Preference(models.Model):
    # Singleton preferences for the application (id=1)
    CURRENCY_CHOICES = [
        ('INR', '₹ - INR'),
        ('USD', '$ - USD'),
        ('EUR', '€ - EUR'),
        ('GBP', '£ - GBP'),
    ]

    CURRENCY_SYMBOLS = {
        'INR': '₹',
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
    }

    DATE_FORMAT_CHOICES = [
        ('YYYY-MM-DD', 'YYYY-MM-DD'),
        ('DD/MM/YYYY', 'DD/MM/YYYY'),
        ('MM/DD/YYYY', 'MM/DD/YYYY'),
    ]

    # Assumption A-02: Default currency is INR
    currency = models.CharField(max_length=10, default='INR', choices=CURRENCY_CHOICES)
    currency_symbol = models.CharField(max_length=5, default='₹')
    date_format = models.CharField(max_length=20, default='YYYY-MM-DD', choices=DATE_FORMAT_CHOICES)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        self.currency_symbol = self.CURRENCY_SYMBOLS.get(self.currency, '₹')
        super().save(*args, **kwargs)

    @classmethod
    def get_preferences(cls):
        obj, _ = cls.objects.get_or_create(id=1, defaults={
            'currency': 'INR',
            'currency_symbol': '₹',
            'date_format': 'YYYY-MM-DD',
        })
        return obj

    def __str__(self):
        return f"Preferences (Currency: {self.currency}, Format: {self.date_format})"
