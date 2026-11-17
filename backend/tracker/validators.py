import datetime
from decimal import Decimal, InvalidOperation
from rest_framework import serializers
from tracker.models import INCOME_CATEGORIES, EXPENSE_CATEGORIES

# Exact error messages specified in Section 7.5
ERR_TYPE = "Select Income or Expense." # VR-01
ERR_DESC_EMPTY = "Enter a description." # VR-02
ERR_DESC_LEN = "Description must be 100 characters or fewer." # VR-03
ERR_AMOUNT_GT_ZERO = "Enter an amount greater than zero." # VR-04
ERR_AMOUNT_DECIMALS = "Amount can have at most two decimal places." # VR-05
ERR_AMOUNT_MAX = "Amount exceeds the maximum of 9,999,999.99." # VR-06 (Assumption A-06)
ERR_CATEGORY = "Select a category." # VR-07
ERR_DATE_INVALID = "Enter a valid date." # VR-08
ERR_DATE_FUTURE = "Date cannot be more than one year in the future." # VR-09 (Assumption A-06)


def validate_transaction_data(data):
    """
    Validates a transaction dictionary against Section 7.5 rules VR-01 to VR-09.
    Raises serializers.ValidationError with exact error messages.
    """
    errors = {}

    # VR-01: type
    tx_type = data.get('type')
    if not tx_type or tx_type not in ('income', 'expense'):
        errors['type'] = [ERR_TYPE]

    # VR-02 & VR-03: description
    desc = data.get('description')
    if desc is None or str(desc).strip() == '':
        errors['description'] = [ERR_DESC_EMPTY]
    elif len(str(desc).strip()) > 100:
        errors['description'] = [ERR_DESC_LEN]

    # VR-04, VR-05, VR-06: amount
    amount_raw = data.get('amount')
    if amount_raw is None or amount_raw == '':
        errors['amount'] = [ERR_AMOUNT_GT_ZERO]
    else:
        try:
            amt_dec = Decimal(str(amount_raw))
            if amt_dec <= Decimal('0'):
                errors['amount'] = [ERR_AMOUNT_GT_ZERO]
            elif amt_dec > Decimal('9999999.99'): # Assumption A-06
                errors['amount'] = [ERR_AMOUNT_MAX]
            else:
                # Check decimal places
                str_amt = str(amount_raw).strip()
                if '.' in str_amt:
                    dec_places = len(str_amt.split('.')[1])
                    if dec_places > 2:
                        errors['amount'] = [ERR_AMOUNT_DECIMALS]
        except (InvalidOperation, ValueError, TypeError):
            errors['amount'] = [ERR_AMOUNT_GT_ZERO]

    # VR-07: category
    cat = data.get('category')
    if not cat:
        errors['category'] = [ERR_CATEGORY]
    else:
        if tx_type == 'income' and cat not in INCOME_CATEGORIES:
            errors['category'] = [ERR_CATEGORY]
        elif tx_type == 'expense' and cat not in EXPENSE_CATEGORIES:
            errors['category'] = [ERR_CATEGORY]
        elif tx_type not in ('income', 'expense'):
            errors['category'] = [ERR_CATEGORY]

    # VR-08 & VR-09: date
    dt_val = data.get('date')
    if not dt_val:
        errors['date'] = [ERR_DATE_INVALID]
    else:
        if isinstance(dt_val, str):
            try:
                parsed_dt = datetime.date.fromisoformat(dt_val)
            except ValueError:
                errors['date'] = [ERR_DATE_INVALID]
                parsed_dt = None
        elif isinstance(dt_val, datetime.date):
            parsed_dt = dt_val
        else:
            errors['date'] = [ERR_DATE_INVALID]
            parsed_dt = None

        if parsed_dt:
            # Assumption A-06: Date cannot be more than one year in the future
            max_future = datetime.date.today() + datetime.timedelta(days=365)
            if parsed_dt > max_future:
                errors['date'] = [ERR_DATE_FUTURE]

    if errors:
        raise serializers.ValidationError(errors)

    return data
