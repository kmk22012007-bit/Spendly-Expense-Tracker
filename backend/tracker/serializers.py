import datetime
from decimal import Decimal, InvalidOperation
from rest_framework import serializers
from tracker.models import Transaction, Preference, INCOME_CATEGORIES, EXPENSE_CATEGORIES
from tracker.validators import (
    validate_transaction_data,
    ERR_TYPE, ERR_DESC_EMPTY, ERR_DESC_LEN,
    ERR_AMOUNT_GT_ZERO, ERR_AMOUNT_DECIMALS, ERR_AMOUNT_MAX,
    ERR_CATEGORY, ERR_DATE_INVALID, ERR_DATE_FUTURE
)

# Assumption A-01: No user accounts in version 1
# Assumption A-02: Currency symbols
# Assumption A-06: Limits

class TransactionSerializer(serializers.ModelSerializer):
    # Mapping to camelCase as defined in Section 7.1
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id',
            'type',
            'description',
            'amount',
            'category',
            'date',
            'createdAt',
            'updatedAt',
        ]
        extra_kwargs = {
            'type': {
                'error_messages': {
                    'required': ERR_TYPE,
                    'invalid_choice': ERR_TYPE,
                    'blank': ERR_TYPE,
                    'null': ERR_TYPE,
                }
            },
            'description': {
                'error_messages': {
                    'required': ERR_DESC_EMPTY,
                    'blank': ERR_DESC_EMPTY,
                    'null': ERR_DESC_EMPTY,
                    'max_length': ERR_DESC_LEN,
                }
            },
            'amount': {
                'error_messages': {
                    'required': ERR_AMOUNT_GT_ZERO,
                    'invalid': ERR_AMOUNT_GT_ZERO,
                    'null': ERR_AMOUNT_GT_ZERO,
                    'max_digits': ERR_AMOUNT_MAX,
                    'max_decimal_places': ERR_AMOUNT_DECIMALS,
                }
            },
            'category': {
                'error_messages': {
                    'required': ERR_CATEGORY,
                    'blank': ERR_CATEGORY,
                    'null': ERR_CATEGORY,
                }
            },
            'date': {
                'error_messages': {
                    'required': ERR_DATE_INVALID,
                    'invalid': ERR_DATE_INVALID,
                    'null': ERR_DATE_INVALID,
                }
            }
        }

    def to_internal_value(self, data):
        # First perform custom full validation according to Section 7.5
        validate_transaction_data(data)
        return super().to_internal_value(data)

    def validate_description(self, value):
        trimmed = value.strip()
        if not trimmed:
            raise serializers.ValidationError(ERR_DESC_EMPTY) # VR-02
        if len(trimmed) > 100:
            raise serializers.ValidationError(ERR_DESC_LEN) # VR-03
        return trimmed

    def validate_amount(self, value):
        if value <= Decimal('0'):
            raise serializers.ValidationError(ERR_AMOUNT_GT_ZERO) # VR-04
        if value > Decimal('9999999.99'): # Assumption A-06
            raise serializers.ValidationError(ERR_AMOUNT_MAX) # VR-06
        # Check decimals
        str_val = f"{value}"
        if '.' in str_val and len(str_val.split('.')[1]) > 2:
            raise serializers.ValidationError(ERR_AMOUNT_DECIMALS) # VR-05
        return value

    def validate_date(self, value):
        max_future = datetime.date.today() + datetime.timedelta(days=365) # Assumption A-06
        if value > max_future:
            raise serializers.ValidationError(ERR_DATE_FUTURE) # VR-09
        return value

    def validate(self, attrs):
        # Validate category matches type (VR-07)
        tx_type = attrs.get('type')
        category = attrs.get('category')
        if tx_type == 'income' and category not in INCOME_CATEGORIES:
            raise serializers.ValidationError({'category': [ERR_CATEGORY]})
        if tx_type == 'expense' and category not in EXPENSE_CATEGORIES:
            raise serializers.ValidationError({'category': [ERR_CATEGORY]})
        return attrs


class PreferenceSerializer(serializers.ModelSerializer):
    currencySymbol = serializers.CharField(source='currency_symbol', read_only=True)
    dateFormat = serializers.CharField(source='date_format')

    class Meta:
        model = Preference
        fields = ['currency', 'currencySymbol', 'dateFormat', 'updated_at']

    def validate_currency(self, value):
        # Assumption A-02: INR, USD, EUR, GBP
        valid_currencies = ['INR', 'USD', 'EUR', 'GBP']
        if value not in valid_currencies:
            raise serializers.ValidationError(f"Currency must be one of {valid_currencies}.")
        return value

    def validate_dateFormat(self, value):
        valid_formats = ['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY']
        if value not in valid_formats:
            raise serializers.ValidationError(f"Date format must be one of {valid_formats}.")
        return value
