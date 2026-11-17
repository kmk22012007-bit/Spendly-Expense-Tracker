# Spendly – Expense Tracker

Spendly is a modern full-stack personal finance web application built with a React frontend and a Django REST Framework backend.

## Architecture & Tech Stack

- **Frontend**: React 19 bootstrapped with Vite, pure CSS with custom properties (no Tailwind or external component libraries), Recharts for data visualizations, and Lucide React for iconography.
- **Backend**: Python 3.14, Django 6.1, Django REST Framework, and `django-cors-headers`.
- **Database**: SQLite for development; zero-code PostgreSQL configuration via environment variables (`DB_ENGINE=postgresql` or `DATABASE_URL`).
- **Data Persistence**: Relational database persistence through a single centralized API client module (`frontend/src/api/client.js`) satisfying NFR-16.
- **Design System**: Deep dark slate palette with custom CSS variables (`variables.css`), responsive across mobile (<768px), tablet (768–1023px), and desktop (>=1024px).

---

## Directory Structure & Conventions

```
experiments/
├── backend/
│   ├── spendly/              # Django project settings and root URLs
│   │   ├── settings.py       # Configured for CORS, DRF, and SQLite/PostgreSQL
│   │   └── urls.py           # Routes /api/ to tracker.urls
│   ├── tracker/              # Core tracking application
│   │   ├── models.py         # Transaction & Preference models
│   │   ├── serializers.py    # Serializers using Section 7.1 camelCase
│   │   ├── validators.py     # Section 7.5 validation rules (VR-01 to VR-09)
│   │   ├── views.py          # CRUD ViewSet, DashboardView, AnalyticsView, PreferenceView
│   │   ├── urls.py           # REST endpoints
│   │   └── tests/            # Test suite (28 tests covering all endpoints and validation)
│   ├── benchmark_nfr.py      # Automated benchmark suite for NFR-01 to NFR-04 with 1,000 transactions
│   ├── requirements.txt      # Python dependencies
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js     # Centralized API client module (NFR-16)
│   │   ├── context/
│   │   │   └── AppContext.jsx# Application state, preferences, and refresh triggers
│   │   ├── styles/
│   │   │   ├── variables.css # CSS custom properties for dark theme (UI-25, UI-26, NFR-18)
│   │   │   └── layout.css    # Responsive grid and breakpoint rules (UI-22, NFR-20)
│   │   ├── components/       # Feature components (Sidebar, Topbar, SummaryCards, etc.)
│   │   ├── pages/            # View pages (Dashboard, Transactions, Add, Analytics, Settings)
│   │   ├── utils/            # Categories, formatters, and client-side validators
│   │   └── tests/            # Vitest + RTL tests (calculations, validation, components, use cases)
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## Running the Project

### Backend
```bash
cd backend
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://127.0.0.1:5173/` in your browser.

---

## Running Tests & Benchmarks

- **Backend Tests**:
  ```bash
  cd backend
  python manage.py test
  ```
- **Frontend Tests**:
  ```bash
  cd frontend
  npm test
  ```
- **Performance Benchmarks (NFR-01 to NFR-04)**:
  ```bash
  python backend/benchmark_nfr.py
  ```
