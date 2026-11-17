import os
import sys
import time
import datetime
import random
from decimal import Decimal

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'spendly.settings')
import django
django.setup()

from django.test import Client
from tracker.models import Transaction, Preference, INCOME_CATEGORIES, EXPENSE_CATEGORIES

def run_benchmarks():
    print("=" * 60)
    print("SPENDLY NFR-01 TO NFR-04 PERFORMANCE BENCHMARK SUITE")
    print("=" * 60)

    # 1. Clean and Seed 1,000 transactions
    Transaction.objects.all().delete()
    print("Seeding 1,000 realistic transactions...")
    start_seed = time.time()

    today = datetime.date.today()
    descriptions = [
        "Grocery Store Supermarket", "Metro Transit Pass", "Monthly Office Salary",
        "Coffee Shop Espresso", "Electric Power Bill", "Water Utility",
        "High-Speed Internet Fiber", "Restaurant Dinner with Friends", "Cinema Movie Ticket",
        "Pharmacy Medicine", "Online Clothing Order", "Freelance Web Design",
        "Stock Dividend Payout", "Gym Annual Membership", "Bookstore Novel"
    ]

    transactions = []
    for i in range(1000):
        # 80% expense, 20% income
        tx_type = 'income' if random.random() < 0.20 else 'expense'
        cat = random.choice(INCOME_CATEGORIES) if tx_type == 'income' else random.choice(EXPENSE_CATEGORIES)
        desc = f"{random.choice(descriptions)} #{i+1}"
        amt = Decimal(str(round(random.uniform(5.0, 5000.0), 2)))
        # Random date in last 365 days
        days_ago = random.randint(0, 360)
        dt = today - datetime.timedelta(days=days_ago)

        transactions.append(Transaction(
            type=tx_type,
            description=desc,
            amount=amt,
            category=cat,
            date=dt
        ))

    Transaction.objects.bulk_create(transactions)
    seed_duration = time.time() - start_seed
    print(f"Seeded 1,000 transactions in {seed_duration:.3f}s. Total in DB: {Transaction.objects.count()}")

    client = Client()

    # NFR-02: Dashboard render / API time with 1,000 transactions (Target: < 500ms)
    print("\n--- Measuring NFR-02: Dashboard query response time with 1,000 transactions ---")
    dashboard_times = []
    for _ in range(20):
        t0 = time.perf_counter()
        res = client.get('/api/dashboard/')
        t1 = time.perf_counter()
        assert res.status_code == 200
        dashboard_times.append((t1 - t0) * 1000)

    avg_dashboard_ms = sum(dashboard_times) / len(dashboard_times)
    min_dashboard_ms = min(dashboard_times)
    max_dashboard_ms = max(dashboard_times)
    print(f"NFR-02 Result: Avg = {avg_dashboard_ms:.2f}ms (Min = {min_dashboard_ms:.2f}ms, Max = {max_dashboard_ms:.2f}ms)")
    print(f"Target: < 500ms. Status: {'PASS' if avg_dashboard_ms < 500 else 'FAIL'}")

    # NFR-03: Adding, editing, or deleting a transaction updates visible list & dashboard (Target: < 300ms)
    print("\n--- Measuring NFR-03: Mutation (Create/Update/Delete) + Re-fetch Latency ---")
    mutation_times = []

    # Measure Add + re-fetch
    t0 = time.perf_counter()
    add_res = client.post('/api/transactions/', {
        'type': 'expense',
        'description': 'Benchmark Quick Coffee',
        'amount': '4.50',
        'category': 'Food',
        'date': today.strftime('%Y-%m-%d')
    }, content_type='application/json')
    client.get('/api/dashboard/')
    t1 = time.perf_counter()
    add_duration_ms = (t1 - t0) * 1000
    mutation_times.append(add_duration_ms)
    new_tx_id = add_res.json()['id']

    # Measure Edit + re-fetch
    t0 = time.perf_counter()
    client.put(f'/api/transactions/{new_tx_id}/', {
        'type': 'expense',
        'description': 'Benchmark Quick Coffee Large',
        'amount': '6.00',
        'category': 'Food',
        'date': today.strftime('%Y-%m-%d')
    }, content_type='application/json')
    client.get('/api/dashboard/')
    t1 = time.perf_counter()
    edit_duration_ms = (t1 - t0) * 1000
    mutation_times.append(edit_duration_ms)

    # Measure Delete + re-fetch
    t0 = time.perf_counter()
    client.delete(f'/api/transactions/{new_tx_id}/')
    client.get('/api/dashboard/')
    t1 = time.perf_counter()
    delete_duration_ms = (t1 - t0) * 1000
    mutation_times.append(delete_duration_ms)

    avg_mutation_ms = sum(mutation_times) / len(mutation_times)
    print(f"NFR-03 Add + Refetch: {add_duration_ms:.2f}ms")
    print(f"NFR-03 Edit + Refetch: {edit_duration_ms:.2f}ms")
    print(f"NFR-03 Delete + Refetch: {delete_duration_ms:.2f}ms")
    print(f"NFR-03 Result: Avg = {avg_mutation_ms:.2f}ms. Target: < 300ms. Status: {'PASS' if avg_mutation_ms < 300 else 'FAIL'}")

    # NFR-04: Search results appear within 300ms of last keystroke with 1,000 transactions (Target: < 300ms)
    print("\n--- Measuring NFR-04: Search query response time with 1,000 transactions ---")
    search_terms = ['grocery', 'coffee', 'salary', 'utility', 'ticket', 'pharmacy']
    search_times = []
    for term in search_terms:
        for _ in range(5):
            t0 = time.perf_counter()
            res = client.get(f'/api/transactions/?search={term}')
            t1 = time.perf_counter()
            assert res.status_code == 200
            search_times.append((t1 - t0) * 1000)

    avg_search_ms = sum(search_times) / len(search_times)
    min_search_ms = min(search_times)
    max_search_ms = max(search_times)
    print(f"NFR-04 Result: Avg = {avg_search_ms:.2f}ms (Min = {min_search_ms:.2f}ms, Max = {max_search_ms:.2f}ms)")
    print(f"Target: < 300ms. Status: {'PASS' if avg_search_ms < 300 else 'FAIL'}")

    # NFR-01: Initial app becomes interactive within 3s on 10 Mbps connection on production build
    print("\n--- Evaluating NFR-01: Production Bundle Size & Transfer Time at 10 Mbps ---")
    frontend_dist = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist')
    if os.path.exists(frontend_dist):
        total_size_bytes = 0
        for root, dirs, files in os.walk(frontend_dist):
            for f in files:
                fp = os.path.join(root, f)
                total_size_bytes += os.path.getsize(fp)

        # 10 Mbps = 10 * 1,000,000 bits/sec = 1,250,000 bytes/sec
        transfer_speed_bytes_sec = 1250000
        transfer_time_sec = total_size_bytes / transfer_speed_bytes_sec
        # Estimated JS parse/execution on modern mobile/desktop ~ 0.2 - 0.4s
        total_interactive_sec = transfer_time_sec + 0.35

        print(f"Production bundle total uncompressed size: {total_size_bytes / 1024:.2f} KB")
        print(f"Estimated network download time at 10 Mbps: {transfer_time_sec:.3f}s")
        print(f"Estimated total time to interactive: {total_interactive_sec:.3f}s")
        print(f"Target: < 3.0s. Status: {'PASS' if total_interactive_sec < 3.0 else 'FAIL'}")
    else:
        print("frontend/dist not found. Run 'npm run build' first.")

    print("\n" + "=" * 60)
    print("BENCHMARK COMPLETED SUCCESSFULLY")
    print("=" * 60)

if __name__ == '__main__':
    run_benchmarks()
