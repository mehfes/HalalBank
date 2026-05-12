# HalalBank — Project Status

## Done (Implemented)

### Backend — Core
- .NET 8 Web API with Clean Architecture (Domain, Application, Infrastructure, API)
- PostgreSQL database with EF Core 8 + Npgsql, auto-migration on startup
- Customer CRUD
- Subscription CRUD with status management (Active/Passive/Suspended/Cancelled)
- Payment processing with mock bank API simulation
- Scheduled payment processing (background service checks overdue subscriptions every 6h)
- Dashboard stats (active count, upcoming payments)
- Exception handling middleware
- Seed data (3 customers, 4 subscription plans, 5 subscriptions, admin user)

### Backend — Authentication & Security
- **Phase 1: Password Hashing (BCrypt)** — all passwords hashed with BCrypt.Net
- **Phase 1: JWT Token Generation & Login** — Bearer tokens issued on login, validated by middleware
- **Phase 1: [Authorize] attributes** on all controllers (Customers, Subscriptions, Payments, SubscriptionPlans, Dashboard, PaymentTask)
- **Phase 1: Role-based authorization** (Admin vs Customer) — `[Authorize(Roles = "Admin")]` on admin-only endpoints
- **Phase 2: Admin seed user** — `admin@test.com` / `admin123` seeded in database with BCrypt hash
- `POST /api/auth/login` — validates email + password against BCrypt hash
- `POST /api/auth/register` — creates new customer account
- `POST /api/auth/forgot-password` — generates temp password, sends via email

### Backend — Google Sign-In
- `POST /api/auth/google-login` endpoint
- Server-side Google ID token verification via `Google.Apis.Auth`
- Auto-creates customer account on first Google login

### Backend — Email
- SendGrid HTTP API integration (works on Railway, port 443)
- Status change email notifications
- Payment reminder emails
- Falls back to console logging if SendGrid key is missing

### Frontend
- React + TypeScript + Vite + Tailwind CSS v4
- Login page (email/password + Google Sign-In button) with form validation
- Registration page with password confirmation
- Dashboard (user's subscriptions, upcoming payments)
- Admin panel (manage all subscriptions, change status, process payments)
- Discover page (browse subscription plans, subscribe as customer, manage catalog as admin)
- Payment gateway page with card form + Luhn validation + brand detection
- Protected routes (Admin-only sections)
- Auth context with JWT token + localStorage persistence
- Navbar with role-based links (Admin link only for admin users)
- Search/filter on subscription tables (Phase 4)
- Toast notifications (success/error snackbar)
- Confirmation dialogs for destructive actions
- Loading skeletons on all data-fetching pages
- Pagination for subscription lists
- Responsive design improvements
- Payment history modal per subscription

### API Endpoints
- `GET/POST/DELETE /api/customers` — Customer CRUD (Admin: getAll, delete. Customer: getById)
- `GET/POST/PUT/DELETE /api/subscriptions` — Subscription CRUD (scoped to own data for customers, all data for admin)
- `GET/POST /api/payments` — Payment read + create
- `POST /api/payments/query-debt/{id}` — Debt query returns exact subscription price
- `GET /api/dashboard` — Dashboard stats
- `POST /api/payment-task/process-overdue` — Process overdue subscriptions
- `POST /api/payment-task/send-reminders` — Send email reminders
- `GET/POST/PUT/DELETE /api/subscriptionplans` — Subscription plan CRUD
- `POST /api/auth/login` — Login
- `POST /api/auth/register` — Register
- `POST /api/auth/google-login` — Google OAuth login
- `POST /api/auth/forgot-password` — Forgot password
- `GET /api/health` — Health check endpoint (Phase 5)

### Infrastructure & Deployment
- Frontend: Cloudflare Pages
- Backend: Railway (.NET + PostgreSQL)
- Google Cloud Console OAuth 2.0 setup
- SendGrid email delivery setup

### Testing
- **Backend: 19 passing** — xUnit + Moq + FluentAssertions
  - PaymentTaskServiceTests (6) — overdue processing scenarios
  - PaymentServiceTests (4) — payment logic, debt query
  - SubscriptionServiceTests (4) — number generation, email triggers
  - ReminderTaskTests (3) — reminder window filtering
  - MockNotificationServiceTests (2) — notification logging
- **Frontend: 24 passing** — Vitest + testing-library
  - AuthContext.test.tsx (6) — auth context behavior
  - Discover.test.tsx (15) — customer and admin views
  - Admin.test.tsx (3) — admin panel rendering

### Monitoring & Observability
- **Structured logging (Serilog)** — configured in Program.cs
- **Application performance monitoring** — Serilog metrics
- **Error tracking (Sentry)** — Sentry integration
- **Email delivery monitoring** — SendGrid delivery tracking (webhook-ready)

---

## Needs Fixing / Known Issues

- Admin seed SQL `ON CONFLICT ("Id") DO NOTHING` didn't update existing admin password — **FIXED** (changed to `DO UPDATE SET`)

---

## Further Steps (Recommended)

### 1. Testing
- Integration tests for API endpoints
- End-to-end tests for critical user flows
- Load testing for background payment processing

### 2. DevOps
- GitHub Actions CI/CD pipeline (frontend tests included)
- Automated database backup
- Staging environment

### 3. Features
- Email queue for async sending
- Email delivery status tracking dashboard
- CSV/PDF export for payments
- Dark mode toggle
- Multi-language support (i18n)

### 4. Security
- Rate limiting on auth endpoints
- Refresh token rotation
- Audit logging for admin actions
- Password strength meter on registration

---

## Test Results Summary

| Suite | Tests | Status |
|-------|-------|--------|
| Backend (xUnit) | 19/19 | ✅ All passing |
| Frontend (Vitest) | 24/24 | ✅ All passing |
| Backend build | — | 0 errors, 0 warnings |
| Frontend build | — | 0 errors, 0 warnings |
