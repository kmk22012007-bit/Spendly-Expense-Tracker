import datetime
from decimal import Decimal
from django.db.models import Sum, Q, Avg
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response

from tracker.models import Transaction, Preference, INCOME_CATEGORIES, EXPENSE_CATEGORIES
from tracker.serializers import TransactionSerializer, PreferenceSerializer

# Assumption A-01: Version 1 has no user accounts, sign-in, or session.
# Assumption A-02: Default currency is INR (symbol ₹).
# Assumption A-03: Balance is total income minus total expenses across all records.
#                  Savings is total income minus total expenses for the current calendar month.
# Assumption A-04: Income categories: Salary, Business, Investment, Other.
# Assumption A-05: Expense categories: Food, Transport, Housing, Utilities, Entertainment, Health, Shopping, Other.
# Assumption A-06: Limits: max amount 9,999,999.99 and max future date offset 365 days.

class TransactionViewSet(viewsets.ModelViewSet):
    """
    CRUD ViewSet for Transactions.
    Supports search and filtering (FR-09, FR-10, FR-11, FR-12, FR-13, FR-14, FR-15).
    """
    serializer_class = TransactionSerializer

    def get_queryset(self):
        # Order by date descending by default (FR-09)
        queryset = Transaction.objects.all().order_by('-date', '-created_at')

        # FR-13: Search by description text, case-insensitively, matching any substring
        search_query = self.request.query_params.get('search')
        if search_query:
            queryset = queryset.filter(description__icontains=search_query.strip())

        # FR-14: Filter by type (income, expense, or all)
        tx_type = self.request.query_params.get('type')
        if tx_type and tx_type.lower() in ('income', 'expense'):
            queryset = queryset.filter(type=tx_type.lower())

        # FR-14: Filter by category
        category = self.request.query_params.get('category')
        if category and category.strip():
            queryset = queryset.filter(category=category.strip())

        # FR-14: Filter by start date and end date
        start_date = self.request.query_params.get('startDate') or self.request.query_params.get('start_date')
        if start_date:
            try:
                queryset = queryset.filter(date__gte=start_date)
            except Exception:
                pass

        end_date = self.request.query_params.get('endDate') or self.request.query_params.get('end_date')
        if end_date:
            try:
                queryset = queryset.filter(date__lte=end_date)
            except Exception:
                pass

        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        # FR-15: Return count of matching transactions along with the results
        return Response({
            'count': queryset.count(),
            'results': serializer.data
        })


class DashboardView(APIView):
    """
    Computes dashboard totals, charts, and recent transactions (FR-01 to FR-07).
    """
    def get(self, request):
        today = datetime.date.today()
        # Selected month or default to current calendar month
        month_param = request.query_params.get('month')
        if month_param:
            try:
                year, month = map(int, month_param.split('-'))
                target_month_start = datetime.date(year, month, 1)
            except Exception:
                target_month_start = datetime.date(today.year, today.month, 1)
        else:
            target_month_start = datetime.date(today.year, today.month, 1)

        # First day of next month
        if target_month_start.month == 12:
            next_month_start = datetime.date(target_month_start.year + 1, 1, 1)
        else:
            next_month_start = datetime.date(target_month_start.year, target_month_start.month + 1, 1)

        # Prior month start for comparison
        if target_month_start.month == 1:
            prior_month_start = datetime.date(target_month_start.year - 1, 12, 1)
        else:
            prior_month_start = datetime.date(target_month_start.year, target_month_start.month - 1, 1)

        # FR-01: Total Balance = sum(income) - sum(expenses) across all transactions
        # FR-02: Total Income = sum(all income transactions)
        # FR-03: Total Expenses = sum(all expense transactions)
        # Assumption A-03: Balance is across all records
        all_income = Transaction.objects.filter(type='income').aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        all_expense = Transaction.objects.filter(type='expense').aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        total_balance = all_income - all_expense

        # FR-04 & Assumption A-03: Savings = current calendar month income - current calendar month expenses
        month_income = Transaction.objects.filter(
            type='income',
            date__gte=target_month_start,
            date__lt=next_month_start
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        month_expense = Transaction.objects.filter(
            type='expense',
            date__gte=target_month_start,
            date__lt=next_month_start
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        savings = month_income - month_expense
        savings_rate = (float(savings) / float(month_income) * 100.0) if month_income > 0 else 0.0

        # Prior month stats for UI comparison badge
        prior_month_income = Transaction.objects.filter(
            type='income',
            date__gte=prior_month_start,
            date__lt=target_month_start
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        prior_month_expense = Transaction.objects.filter(
            type='expense',
            date__gte=prior_month_start,
            date__lt=target_month_start
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        def calc_pct_change(current, prior):
            if prior > 0:
                return round(float((current - prior) / prior * 100), 1)
            elif current > 0:
                return 100.0
            return 0.0

        income_change_pct = calc_pct_change(month_income, prior_month_income)
        expense_change_pct = calc_pct_change(month_expense, prior_month_expense)
        prior_month_balance = prior_month_income - prior_month_expense
        balance_change_pct = calc_pct_change(savings, prior_month_balance)

        # FR-05: Spending overview chart showing total expenses for each of the last six calendar months
        spending_overview = []
        for i in range(5, -1, -1):
            # Calculate month offset
            cur_m = target_month_start.month - i
            cur_y = target_month_start.year
            while cur_m <= 0:
                cur_m += 12
                cur_y -= 1
            m_start = datetime.date(cur_y, cur_m, 1)
            if cur_m == 12:
                m_end = datetime.date(cur_y + 1, 1, 1)
            else:
                m_end = datetime.date(cur_y, cur_m + 1, 1)

            m_exp = Transaction.objects.filter(
                type='expense',
                date__gte=m_start,
                date__lt=m_end
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

            m_inc = Transaction.objects.filter(
                type='income',
                date__gte=m_start,
                date__lt=m_end
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

            spending_overview.append({
                'month': m_start.strftime('%Y-%m'),
                'label': m_start.strftime('%b'),
                'year': m_start.strftime('%Y'),
                'expenses': float(m_exp),
                'income': float(m_inc),
            })

        # FR-06: Expense distribution chart showing expense totals per category for the current calendar month
        cat_expenses = Transaction.objects.filter(
            type='expense',
            date__gte=target_month_start,
            date__lt=next_month_start
        ).values('category').annotate(amount=Sum('amount')).order_by('-amount')

        category_distribution = []
        cat_total_sum = month_expense
        for item in cat_expenses:
            cat_amt = item['amount'] or Decimal('0.00')
            pct = round(float(cat_amt / cat_total_sum * 100), 1) if cat_total_sum > 0 else 0.0
            category_distribution.append({
                'category': item['category'],
                'amount': float(cat_amt),
                'percentage': pct,
            })

        # FR-07: Five most recent transactions, ordered by transaction date descending
        recent_txs = Transaction.objects.all().order_by('-date', '-created_at')[:5]
        recent_serializer = TransactionSerializer(recent_txs, many=True)

        return Response({
            'totalBalance': float(total_balance),
            'totalIncome': float(all_income),
            'totalExpenses': float(all_expense),
            'savings': float(savings),
            'savingsRate': round(savings_rate, 2),
            'currentMonth': {
                'income': float(month_income),
                'expenses': float(month_expense),
                'monthLabel': target_month_start.strftime('%B %Y'),
            },
            'comparison': {
                'incomeChangePercent': income_change_pct,
                'expenseChangePercent': expense_change_pct,
                'balanceChangePercent': balance_change_pct,
            },
            'spendingOverview': spending_overview,
            'categoryDistribution': category_distribution,
            'recentTransactions': recent_serializer.data,
        })


class AnalyticsView(APIView):
    """
    Analytics endpoint (FR-24 to FR-28).
    Supports period selection: This Month, Last 3 Months, This Year, Custom Range.
    """
    def get(self, request):
        period = request.query_params.get('period', 'this_month')
        today = datetime.date.today()

        # FR-28: Determine date bounds based on period
        if period == 'this_month':
            start_date = datetime.date(today.year, today.month, 1)
            if today.month == 12:
                end_date = datetime.date(today.year + 1, 1, 1) - datetime.timedelta(days=1)
            else:
                end_date = datetime.date(today.year, today.month + 1, 1) - datetime.timedelta(days=1)
        elif period == 'last_3_months':
            cur_month_start = datetime.date(today.year, today.month, 1)
            # Subtract 2 months for 3-month window
            start_date = (cur_month_start - datetime.timedelta(days=65)).replace(day=1)
            if today.month == 12:
                end_date = datetime.date(today.year + 1, 1, 1) - datetime.timedelta(days=1)
            else:
                end_date = datetime.date(today.year, today.month + 1, 1) - datetime.timedelta(days=1)
        elif period == 'this_year':
            start_date = datetime.date(today.year, 1, 1)
            end_date = datetime.date(today.year, 12, 31)
        elif period == 'custom':
            start_str = request.query_params.get('startDate') or request.query_params.get('start_date')
            end_str = request.query_params.get('endDate') or request.query_params.get('end_date')
            try:
                start_date = datetime.date.fromisoformat(start_str) if start_str else datetime.date(today.year, today.month, 1)
                end_date = datetime.date.fromisoformat(end_str) if end_str else today
            except Exception:
                start_date = datetime.date(today.year, today.month, 1)
                end_date = today
        else:
            start_date = datetime.date(today.year, today.month, 1)
            end_date = today

        period_txs = Transaction.objects.filter(date__gte=start_date, date__lte=end_date)
        has_data = period_txs.exists()

        # FR-24: Total income, total expenses, and net amount (income minus expenses)
        total_income = period_txs.filter(type='income').aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        total_expenses = period_txs.filter(type='expense').aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        net_amount = total_income - total_expenses

        # FR-25: Table of expense totals per category with percentage rounded to 1 decimal place
        cat_breakdown_qs = period_txs.filter(type='expense').values('category').annotate(amount=Sum('amount')).order_by('-amount')
        category_breakdown = []
        for item in cat_breakdown_qs:
            c_amt = item['amount'] or Decimal('0.00')
            pct = round(float(c_amt / total_expenses * 100), 1) if total_expenses > 0 else 0.0
            category_breakdown.append({
                'category': item['category'],
                'amount': float(c_amt),
                'percentage': pct,
            })

        # FR-26: Monthly spending analysis showing total expenses for each of the last 12 calendar months and average monthly expense
        twelve_months_spending = []
        cur_m_start = datetime.date(today.year, today.month, 1)
        total_12m_expense = Decimal('0.00')

        for i in range(11, -1, -1):
            # Calculate month offset
            y = cur_m_start.year
            m = cur_m_start.month - i
            while m <= 0:
                m += 12
                y -= 1
            m_s = datetime.date(y, m, 1)
            if m == 12:
                m_e = datetime.date(y + 1, 1, 1)
            else:
                m_e = datetime.date(y, m + 1, 1)

            exp = Transaction.objects.filter(
                type='expense',
                date__gte=m_s,
                date__lt=m_e
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

            total_12m_expense += exp
            twelve_months_spending.append({
                'month': m_s.strftime('%Y-%m'),
                'label': m_s.strftime('%b %Y'),
                'shortLabel': m_s.strftime('%b'),
                'expenses': float(exp),
            })

        avg_monthly_expense = float(round(total_12m_expense / Decimal('12'), 2))

        return Response({
            'period': period,
            'startDate': start_date.strftime('%Y-%m-%d'),
            'endDate': end_date.strftime('%Y-%m-%d'),
            'hasData': has_data,
            'totalIncome': float(total_income),
            'totalExpenses': float(total_expenses),
            'netAmount': float(net_amount),
            'categoryBreakdown': category_breakdown,
            'monthlySpending': twelve_months_spending,
            'averageMonthlyExpense': avg_monthly_expense,
        })


class PreferenceView(APIView):
    """
    Settings preferences endpoint (FR-29, FR-30, Assumption A-02).
    """
    def get(self, request):
        pref = Preference.get_preferences()
        serializer = PreferenceSerializer(pref)
        return Response(serializer.data)

    def put(self, request):
        pref = Preference.get_preferences()
        serializer = PreferenceSerializer(pref, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ResetDataView(APIView):
    """
    FR-31: Erase all stored transactions and preferences after confirmation prompt.
    """
    def post(self, request):
        confirm = request.data.get('confirm')
        if not confirm:
            return Response({'error': 'Confirmation is required to reset data.'}, status=status.HTTP_400_BAD_REQUEST)

        # Clear transactions
        Transaction.objects.all().delete()

        # Reset preferences to default
        pref = Preference.get_preferences()
        pref.currency = 'INR' # Assumption A-02
        pref.currency_symbol = '₹'
        pref.date_format = 'YYYY-MM-DD'
        pref.save()

        return Response({
            'message': 'All stored transactions and preferences have been reset successfully.'
        })
