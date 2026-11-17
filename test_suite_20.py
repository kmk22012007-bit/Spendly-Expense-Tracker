import os
import sys
import time
import datetime
from decimal import Decimal

# Set up Django environment
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'spendly.settings')
import django
django.setup()

from django.test import Client
from tracker.models import Transaction, Preference
from tracker.validators import (
    ERR_TYPE, ERR_DESC_EMPTY, ERR_DESC_LEN,
    ERR_AMOUNT_GT_ZERO, ERR_AMOUNT_DECIMALS, ERR_AMOUNT_MAX,
    ERR_CATEGORY, ERR_DATE_INVALID, ERR_DATE_FUTURE
)

def run_test_suite():
    client = Client()
    today = datetime.date.today()
    results = []

    print("=" * 80)
    print("SPENDLY COMPREHENSIVE 20-TESTCASE VERIFICATION SUITE")
    print(f"Timestamp: {datetime.datetime.now().isoformat()} | Environment: Django 6.1 + SQLite")
    print("=" * 80)

    def log_test(tc_id, title, status, duration_ms, details=""):
        results.append({
            'id': tc_id,
            'title': title,
            'status': status,
            'duration_ms': duration_ms,
            'details': details
        })
        icon = "✓ PASS" if status == "PASS" else "✗ FAIL"
        print(f"[{icon}] {tc_id}: {title} ({duration_ms:.2f}ms)")
        if details and status != "PASS":
            print(f"       Reason: {details}")

    # Reset DB before starting
    Transaction.objects.all().delete()
    pref = Preference.get_preferences()
    pref.currency = 'INR'
    pref.currency_symbol = '₹'
    pref.date_format = 'YYYY-MM-DD'
    pref.save()

    # -------------------------------------------------------------------------
    # TC-01: Create Income Transaction (FR-16, FR-19)
    # -------------------------------------------------------------------------
    t0 = time.perf_counter()
    res = client.post('/api/transactions/', {
        'type': 'income',
        'description': 'Tech Salary Nov',
        'amount': '50000.00',
        'category': 'Salary',
        'date': today.strftime('%Y-%m-%d')
    }, content_type='application/json')
    t1 = time.perf_counter()
    if res.status_code == 201 and res.json().get('type') == 'income' and res.json().get('amount') == '50000.00':
        tc01_id = res.json().get('id')
        log_test("TC-01", "Create Income Transaction (FR-16, FR-19)", "PASS", (t1 - t0) * 1000, f"Created ID: {tc01_id}")
    else:
        log_test("TC-01", "Create Income Transaction (FR-16, FR-19)", "FAIL", (t1 - t0) * 1000, f"Status: {res.status_code}, data: {res.data}")

    # -------------------------------------------------------------------------
    # TC-02: Create Expense Transaction (FR-20, FR-23)
    # -------------------------------------------------------------------------
    t0 = time.perf_counter()
    res = client.post('/api/transactions/', {
        'type': 'expense',
        'description': 'Supermarket Groceries',
        'amount': '2500.50',
        'category': 'Food',
        'date': today.strftime('%Y-%m-%d')
    }, content_type='application/json')
    t1 = time.perf_counter()
    if res.status_code == 201 and res.json().get('type') == 'expense' and res.json().get('category') == 'Food':
        tc02_id = res.json().get('id')
        log_test("TC-02", "Create Expense Transaction (FR-20, FR-23)", "PASS", (t1 - t0) * 1000, f"Created ID: {tc02_id}")
    else:
        log_test("TC-02", "Create Expense Transaction (FR-20, FR-23)", "FAIL", (t1 - t0) * 1000, f"Status: {res.status_code}, data: {res.data}")

    # -------------------------------------------------------------------------
    # TC-03: VR-01 Type Validation
    # -------------------------------------------------------------------------
    t0 = time.perf_counter()
    res = client.post('/api/transactions/', {
        'type': 'donation',
        'description': 'Charity',
        'amount': '100.00',
        'category': 'Other',
        'date': today.strftime('%Y-%m-%d')
    }, content_type='application/json')
    t1 = time.perf_counter()
    if res.status_code == 400 and ERR_TYPE in str(res.json().get('type', [])):
        log_test("TC-03", "VR-01 Type Validation (must be income or expense)", "PASS", (t1 - t0) * 1000)
    else:
        log_test("TC-03", "VR-01 Type Validation (must be income or expense)", "FAIL", (t1 - t0) * 1000, f"Status: {res.status_code}, resp: {res.data}")

    # -------------------------------------------------------------------------
    # TC-04: VR-02 & VR-03 Description Validation
    # -------------------------------------------------------------------------
    t0 = time.perf_counter()
    # Empty after trim
    res_empty = client.post('/api/transactions/', {
        'type': 'expense', 'description': '    ', 'amount': '50.00', 'category': 'Food', 'date': today.strftime('%Y-%m-%d')
    }, content_type='application/json')
    # Exceeds 100 chars
    res_len = client.post('/api/transactions/', {
        'type': 'expense', 'description': 'X' * 101, 'amount': '50.00', 'category': 'Food', 'date': today.strftime('%Y-%m-%d')
    }, content_type='application/json')
    t1 = time.perf_counter()
    if (res_empty.status_code == 400 and ERR_DESC_EMPTY in str(res_empty.json().get('description', [])) and
        res_len.status_code == 400 and ERR_DESC_LEN in str(res_len.json().get('description', []))):
        log_test("TC-04", "VR-02 & VR-03 Description Validation (empty & max 100)", "PASS", (t1 - t0) * 1000)
    else:
        log_test("TC-04", "VR-02 & VR-03 Description Validation (empty & max 100)", "FAIL", (t1 - t0) * 1000, f"Empty: {res_empty.data}, Len: {res_len.data}")

    # -------------------------------------------------------------------------
    # TC-05: VR-04, VR-05 & VR-06 Amount Validation
    # -------------------------------------------------------------------------
    t0 = time.perf_counter()
    # Non-positive amount
    res_zero = client.post('/api/transactions/', {
        'type': 'expense', 'description': 'Item', 'amount': '0.00', 'category': 'Food', 'date': today.strftime('%Y-%m-%d')
    }, content_type='application/json')
    # More than 2 decimal places
    res_dec = client.post('/api/transactions/', {
        'type': 'expense', 'description': 'Item', 'amount': '45.123', 'category': 'Food', 'date': today.strftime('%Y-%m-%d')
    }, content_type='application/json')
    # Exceeds 9,999,999.99
    res_max = client.post('/api/transactions/', {
        'type': 'expense', 'description': 'Item', 'amount': '10000000.00', 'category': 'Food', 'date': today.strftime('%Y-%m-%d')
    }, content_type='application/json')
    t1 = time.perf_counter()

    c1 = res_zero.status_code == 400 and ERR_AMOUNT_GT_ZERO in str(res_zero.json().get('amount', []))
    c2 = res_dec.status_code == 400 and ERR_AMOUNT_DECIMALS in str(res_dec.json().get('amount', []))
    c3 = res_max.status_code == 400 and ERR_AMOUNT_MAX in str(res_max.json().get('amount', []))
    if c1 and c2 and c3:
        log_test("TC-05", "VR-04, VR-05, VR-06 Amount Validation (>0, <=2 dec, <=9,999,999.99)", "PASS", (t1 - t0) * 1000)
    else:
        log_test("TC-05", "VR-04, VR-05, VR-06 Amount Validation (>0, <=2 dec, <=9,999,999.99)", "FAIL", (t1 - t0) * 1000, f"c1={c1}, c2={c2}, c3={c3}")

    # -------------------------------------------------------------------------
    # TC-06: VR-07 Category Mismatch Validation
    # -------------------------------------------------------------------------
    t0 = time.perf_counter()
    # Salary is income category, attempted on expense
    res_cat = client.post('/api/transactions/', {
        'type': 'expense', 'description': 'Misclassified', 'amount': '100.00', 'category': 'Salary', 'date': today.strftime('%Y-%m-%d')
    }, content_type='application/json')
    t1 = time.perf_counter()
    if res_cat.status_code == 400 and ERR_CATEGORY in str(res_cat.json().get('category', [])):
        log_test("TC-06", "VR-07 Category Mismatch Validation (category must match type)", "PASS", (t1 - t0) * 1000)
    else:
        log_test("TC-06", "VR-07 Category Mismatch Validation (category must match type)", "FAIL", (t1 - t0) * 1000, f"Resp: {res_cat.data}")

    # -------------------------------------------------------------------------
    # TC-07: VR-08 & VR-09 Date Validation
    # -------------------------------------------------------------------------
    t0 = time.perf_counter()
    res_inv_date = client.post('/api/transactions/', {
        'type': 'expense', 'description': 'Bad Date', 'amount': '100.00', 'category': 'Food', 'date': '2026-02-31'
    }, content_type='application/json')
    far_future = today + datetime.timedelta(days=368)
    res_fut_date = client.post('/api/transactions/', {
        'type': 'expense', 'description': 'Too Far', 'amount': '100.00', 'category': 'Food', 'date': far_future.strftime('%Y-%m-%d')
    }, content_type='application/json')
    t1 = time.perf_counter()

    d1 = res_inv_date.status_code == 400 and ERR_DATE_INVALID in str(res_inv_date.json().get('date', []))
    d2 = res_fut_date.status_code == 400 and ERR_DATE_FUTURE in str(res_fut_date.json().get('date', []))
    if d1 and d2:
        log_test("TC-07", "VR-08 & VR-09 Date Validation (valid calendar date & <= 365 days future)", "PASS", (t1 - t0) * 1000)
    else:
        log_test("TC-07", "VR-08 & VR-09 Date Validation (valid calendar date & <= 365 days future)", "FAIL", (t1 - t0) * 1000, f"d1={d1}, d2={d2}")

    # -------------------------------------------------------------------------
    # TC-08: Stored Transactions Sorting (FR-09)
    # -------------------------------------------------------------------------
    # Add records with explicit chronological dates
    Transaction.objects.create(type='expense', description='Older Tx', amount=Decimal('20.00'), category='Food', date=today - datetime.timedelta(days=5))
    Transaction.objects.create(type='expense', description='Newest Tx', amount=Decimal('30.00'), category='Transport', date=today + datetime.timedelta(days=1))
    t0 = time.perf_counter()
    res = client.get('/api/transactions/')
    t1 = time.perf_counter()
    tx_list = res.json().get('results', [])
    dates = [t['date'] for t in tx_list]
    is_sorted = dates == sorted(dates, reverse=True)
    if res.status_code == 200 and is_sorted and len(tx_list) >= 4:
        log_test("TC-08", "Transactions Ordering Descending by Date (FR-09)", "PASS", (t1 - t0) * 1000, f"Dates: {dates[:4]}")
    else:
        log_test("TC-08", "Transactions Ordering Descending by Date (FR-09)", "FAIL", (t1 - t0) * 1000, f"Dates: {dates}")

    # -------------------------------------------------------------------------
    # TC-09: Search by Description Substring (FR-13)
    # -------------------------------------------------------------------------
    t0 = time.perf_counter()
    res = client.get('/api/transactions/?search=supermarket')
    t1 = time.perf_counter()
    res_data = res.json()
    matches = res_data.get('results', [])
    if res.status_code == 200 and len(matches) == 1 and 'Supermarket' in matches[0]['description']:
        log_test("TC-09", "Search by Description Case-Insensitive Substring (FR-13)", "PASS", (t1 - t0) * 1000, f"Found match: {matches[0]['description']}")
    else:
        log_test("TC-09", "Search by Description Case-Insensitive Substring (FR-13)", "FAIL", (t1 - t0) * 1000, f"Count: {len(matches)}")

    # -------------------------------------------------------------------------
    # TC-10: Filter by Type, Category, and Date Range (FR-14, FR-15)
    # -------------------------------------------------------------------------
    t0 = time.perf_counter()
    res = client.get('/api/transactions/?type=expense&category=Food')
    t1 = time.perf_counter()
    res_data = res.json()
    matches = res_data.get('results', [])
    count = res_data.get('count', 0)
    all_food_expense = all(m['type'] == 'expense' and m['category'] == 'Food' for m in matches)
    if res.status_code == 200 and all_food_expense and count == len(matches) and count >= 2:
        log_test("TC-10", "Filter by Type, Category, and Count Reporting (FR-14, FR-15)", "PASS", (t1 - t0) * 1000, f"Filtered Count: {count}")
    else:
        log_test("TC-10", "Filter by Type, Category, and Count Reporting (FR-14, FR-15)", "FAIL", (t1 - t0) * 1000, f"Count: {count}, matches: {matches}")

    # -------------------------------------------------------------------------
    # TC-11: Transaction Detail View (FR-10)
    # -------------------------------------------------------------------------
    t0 = time.perf_counter()
    res = client.get(f'/api/transactions/{tc01_id}/')
    t1 = time.perf_counter()
    tx_detail = res.json()
    required_keys = ['id', 'type', 'description', 'amount', 'category', 'date', 'createdAt', 'updatedAt']
    has_all_keys = all(k in tx_detail for k in required_keys)
    if res.status_code == 200 and has_all_keys and tx_detail['id'] == tc01_id:
        log_test("TC-11", "Transaction Detail View Full Fields (FR-10)", "PASS", (t1 - t0) * 1000)
    else:
        log_test("TC-11", "Transaction Detail View Full Fields (FR-10)", "FAIL", (t1 - t0) * 1000, f"Keys: {list(tx_detail.keys())}")

    # -------------------------------------------------------------------------
    # TC-12: Edit Transaction Fields with Validation (FR-11)
    # -------------------------------------------------------------------------
    t0 = time.perf_counter()
    res = client.put(f'/api/transactions/{tc02_id}/', {
        'type': 'expense',
        'description': 'Supermarket Groceries & Toiletries',
        'amount': '3200.75',
        'category': 'Food',
        'date': today.strftime('%Y-%m-%d')
    }, content_type='application/json')
    t1 = time.perf_counter()
    updated_tx = res.json()
    if res.status_code == 200 and updated_tx.get('amount') == '3200.75' and updated_tx.get('description') == 'Supermarket Groceries & Toiletries':
        log_test("TC-12", "Edit Transaction Fields & Persistence (FR-11)", "PASS", (t1 - t0) * 1000, f"Updated amount: {updated_tx.get('amount')}")
    else:
        log_test("TC-12", "Edit Transaction Fields & Persistence (FR-11)", "FAIL", (t1 - t0) * 1000, f"Status: {res.status_code}")

    # -------------------------------------------------------------------------
    # TC-13: Delete Transaction (FR-12)
    # -------------------------------------------------------------------------
    # Create temp tx to delete
    del_tx = Transaction.objects.create(type='expense', description='To Be Deleted', amount=Decimal('99.00'), category='Other', date=today)
    t0 = time.perf_counter()
    res_del = client.delete(f'/api/transactions/{del_tx.id}/')
    res_check = client.get(f'/api/transactions/{del_tx.id}/')
    t1 = time.perf_counter()
    if res_del.status_code == 204 and res_check.status_code == 404:
        log_test("TC-13", "Delete Transaction (FR-12)", "PASS", (t1 - t0) * 1000)
    else:
        log_test("TC-13", "Delete Transaction (FR-12)", "FAIL", (t1 - t0) * 1000, f"Del status: {res_del.status_code}, Check status: {res_check.status_code}")

    # -------------------------------------------------------------------------
    # TC-14: Dashboard Financial Summaries (FR-01 to FR-04, Assumption A-03)
    # -------------------------------------------------------------------------
    t0 = time.perf_counter()
    res = client.get('/api/dashboard/')
    t1 = time.perf_counter()
    dash = res.json()
    # Check formulas:
    # totalBalance = totalIncome - totalExpenses
    # savings = currentMonth.income - currentMonth.expenses
    calc_bal = round(dash['totalIncome'] - dash['totalExpenses'], 2)
    calc_savings = round(dash['currentMonth']['income'] - dash['currentMonth']['expenses'], 2)
    if (res.status_code == 200 and
        abs(dash['totalBalance'] - calc_bal) < 0.01 and
        abs(dash['savings'] - calc_savings) < 0.01 and
        dash['totalIncome'] >= 50000.0):
        log_test("TC-14", "Dashboard Summary Totals & Savings (FR-01 to FR-04, A-03)", "PASS", (t1 - t0) * 1000,
                 f"Bal: {dash['totalBalance']}, Inc: {dash['totalIncome']}, Exp: {dash['totalExpenses']}, Sav: {dash['savings']}")
    else:
        log_test("TC-14", "Dashboard Summary Totals & Savings (FR-01 to FR-04, A-03)", "FAIL", (t1 - t0) * 1000, f"Data: {dash}")

    # -------------------------------------------------------------------------
    # TC-15: Dashboard 6-Month Overview & Recent 5 (FR-05, FR-07)
    # -------------------------------------------------------------------------
    overview = dash.get('spendingOverview', [])
    recent = dash.get('recentTransactions', [])
    is_6_months = len(overview) == 6
    is_max_5_recent = len(recent) <= 5 and len(recent) > 0
    t_duration = (t1 - t0) * 1000
    if is_6_months and is_max_5_recent:
        log_test("TC-15", "Dashboard 6-Month Chart & Recent 5 List (FR-05, FR-07)", "PASS", t_duration,
                 f"Overview months: {len(overview)}, Recent count: {len(recent)}")
    else:
        log_test("TC-15", "Dashboard 6-Month Chart & Recent 5 List (FR-05, FR-07)", "FAIL", t_duration,
                 f"6_mo: {is_6_months}, recent_len: {len(recent)}")

    # -------------------------------------------------------------------------
    # TC-16: Analytics Period Summary & Net Amount (FR-24, FR-28)
    # -------------------------------------------------------------------------
    t0 = time.perf_counter()
    res = client.get('/api/analytics/?period=this_month')
    t1 = time.perf_counter()
    anl = res.json()
    net_calc = round(anl.get('totalIncome', 0) - anl.get('totalExpenses', 0), 2)
    if res.status_code == 200 and abs(anl.get('netAmount', 0) - net_calc) < 0.01 and anl.get('hasData') is True:
        log_test("TC-16", "Analytics Period Summary & Net Amount (FR-24, FR-28)", "PASS", (t1 - t0) * 1000,
                 f"Inc: {anl['totalIncome']}, Exp: {anl['totalExpenses']}, Net: {anl['netAmount']}")
    else:
        log_test("TC-16", "Analytics Period Summary & Net Amount (FR-24, FR-28)", "FAIL", (t1 - t0) * 1000, f"Data: {anl}")

    # -------------------------------------------------------------------------
    # TC-17: Analytics Category Breakdown with Percentage (FR-25)
    # -------------------------------------------------------------------------
    cats = anl.get('categoryBreakdown', [])
    pct_sum = sum(c.get('percentage', 0) for c in cats)
    if len(cats) > 0 and abs(pct_sum - 100.0) <= 0.5:
        log_test("TC-17", "Analytics Category Breakdown & Percentage Share (FR-25)", "PASS", (t1 - t0) * 1000,
                 f"Categories: {len(cats)}, Total Share: {pct_sum:.1f}%")
    else:
        log_test("TC-17", "Analytics Category Breakdown & Percentage Share (FR-25)", "FAIL", (t1 - t0) * 1000,
                 f"Cats: {cats}, pct_sum: {pct_sum}")

    # -------------------------------------------------------------------------
    # TC-18: Analytics 12-Month Expense Trend & Monthly Average (FR-26)
    # -------------------------------------------------------------------------
    monthly_trend = anl.get('monthlySpending', [])
    avg_expense = anl.get('averageMonthlyExpense', 0)
    calc_avg = round(sum(m['expenses'] for m in monthly_trend) / 12.0, 2)
    if len(monthly_trend) == 12 and abs(avg_expense - calc_avg) < 0.05:
        log_test("TC-18", "Analytics 12-Month Spending Trend & Average (FR-26)", "PASS", (t1 - t0) * 1000,
                 f"12 months present, Avg: {avg_expense}")
    else:
        log_test("TC-18", "Analytics 12-Month Spending Trend & Average (FR-26)", "FAIL", (t1 - t0) * 1000,
                 f"Len: {len(monthly_trend)}, avg: {avg_expense}, calc: {calc_avg}")

    # -------------------------------------------------------------------------
    # TC-19: Analytics Empty Period Handling (FR-27)
    # -------------------------------------------------------------------------
    t0 = time.perf_counter()
    res_empty = client.get('/api/analytics/?period=custom&startDate=2015-01-01&endDate=2015-01-31')
    t1 = time.perf_counter()
    anl_empty = res_empty.json()
    if (res_empty.status_code == 200 and
        anl_empty.get('hasData') is False and
        anl_empty.get('totalIncome') == 0.0 and
        anl_empty.get('totalExpenses') == 0.0 and
        len(anl_empty.get('categoryBreakdown')) == 0):
        log_test("TC-19", "Analytics Empty State Handling (FR-27)", "PASS", (t1 - t0) * 1000, "hasData: False, Totals: 0.0")
    else:
        log_test("TC-19", "Analytics Empty State Handling (FR-27)", "FAIL", (t1 - t0) * 1000, f"Data: {anl_empty}")

    # -------------------------------------------------------------------------
    # TC-20: Settings Preferences & Reset All Data (FR-29, FR-30, FR-31)
    # -------------------------------------------------------------------------
    t0 = time.perf_counter()
    # 1. Update preferences to USD
    res_pref = client.put('/api/settings/', {'currency': 'USD', 'dateFormat': 'MM/DD/YYYY'}, content_type='application/json')
    usd_updated = res_pref.status_code == 200 and res_pref.json().get('currency') == 'USD' and res_pref.json().get('currencySymbol') == '$'

    # 2. Reset All Data with confirmation
    res_reset = client.post('/api/settings/reset/', {'confirm': True}, content_type='application/json')
    reset_ok = res_reset.status_code == 200

    # 3. Verify database empty and preferences restored to default INR
    tx_count_after = Transaction.objects.count()
    pref_after = Preference.get_preferences()
    t1 = time.perf_counter()

    if usd_updated and reset_ok and tx_count_after == 0 and pref_after.currency == 'INR' and pref_after.currency_symbol == '₹':
        log_test("TC-20", "Settings Update & Reset All Data (FR-29, FR-30, FR-31)", "PASS", (t1 - t0) * 1000,
                 f"DB count after reset: {tx_count_after}, Pref: {pref_after.currency} ({pref_after.currency_symbol})")
    else:
        log_test("TC-20", "Settings Update & Reset All Data (FR-29, FR-30, FR-31)", "FAIL", (t1 - t0) * 1000,
                 f"usd: {usd_updated}, reset: {reset_ok}, count: {tx_count_after}, pref: {pref_after.currency}")

    # -------------------------------------------------------------------------
    # SUMMARY
    # -------------------------------------------------------------------------
    print("=" * 80)
    passed_count = sum(1 for r in results if r['status'] == "PASS")
    failed_count = sum(1 for r in results if r['status'] == "FAIL")
    total_time_ms = sum(r['duration_ms'] for r in results)
    print(f"RESULTS SUMMARY: {passed_count} / {len(results)} PASSED | {failed_count} FAILED")
    print(f"Total Execution Time: {total_time_ms:.2f} ms")
    print("=" * 80)

    return results

if __name__ == '__main__':
    run_test_suite()
