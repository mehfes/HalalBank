# What Is Done — HalalBank

> Subscription & Auto-Payment Reminder System  
> Built for a case study, step by step with AI assistance.

---

## Tech Stack

| Layer       | Technology                                      |
|-------------|-------------------------------------------------|
| Backend     | C#, .NET 8 Web API, Clean Architecture          |
| Frontend    | React 18, TypeScript, Vite 6, Tailwind CSS v4   |
| Database    | MS SQL Server (LocalDB), Entity Framework Core 8|
| Testing     | xUnit, Moq 4.20, FluentAssertions 8.9           |
| CI/CD       | GitHub Actions (ubuntu-latest)                  |
| IDE         | VS Code / CLI                                   |

---

## Step 1 — Project Initialization & Git

**Prompt:** Initialize GitHub repo + create Clean Architecture solution.

- Created `HalalBank.sln`
- `.gitignore` for .NET + React projects
- Git repo initialized

### Solution Structure

```
HalalBank/
├── .gitignore
├── HalalBank.sln
├── README.md
├── src/
│   ├── Domain/            (Entities, Enums, Interfaces)
│   ├── Application/       (DTOs, Mappers, Service Interfaces, Business Logic)
│   ├── Infrastructure/    (EF Core DbContext, Repositories, Mock External Services)
│   └── API/               (Controllers, Middleware, Program.cs)
├── frontend/              (React + Vite + TypeScript)
└── tests/
    └── Application.Tests/ (xUnit + Moq + FluentAssertions)
```

### Project References

```
API → Infrastructure → Application → Domain
```

---

## Step 2 — Domain Entities & Enums

**Prompt:** Define core entities per specification.

### Customer
```
Id, FirstName, LastName, Email, CreatedDate
```

### Subscription
```
Id, CustomerId, ProviderName (Netflix, Spotify, etc.), Category,
Price, BillingCycle (Monthly/Yearly), NextPaymentDate, Status (Active/Passive)
```

### Payment
```
Id, SubscriptionId, Amount, PaymentDate, Status (Success/Fail)
```

### Enums
- `BillingCycle` → Monthly, Yearly
- `PaymentStatus` → Success, Fail
- `SubscriptionStatus` → Active, Passive

### Repository Interfaces (Domain layer)
- `ICustomerRepository` — GetById, GetAll, Add, Delete
- `ISubscriptionRepository` — GetById, GetByCustomerId, GetOverdue, GetAll, GetActiveCount, GetUpcomingPayments, Add, Update, Delete
- `IPaymentRepository` — GetById, GetBySubscriptionId, GetAll, Add
- `IUnitOfWork` — Customers, Subscriptions, Payments, SaveChangesAsync

---

## Step 3 — EF Core & Database Setup

**Prompt:** Configure EF Core with SQL Server, entity configurations, provide migration command.

### Entity Configurations (Fluent API)
- **CustomerConfiguration** — Id PK, FirstName(100), LastName(100), Email(200)
- **SubscriptionConfiguration** — Id PK, ProviderName(200), Category(100), Price(decimal18,2), BillingCycle string(20), Status string(20); FK → Customer (Cascade)
- **PaymentConfiguration** — Id PK, Amount(decimal18,2), Status string(20); FK → Subscription (Cascade)

### Initial Migration
```bash
dotnet ef migrations add InitialCreate --project src\Infrastructure --startup-project src\API
```

### Transient Failure Retry (added later)
```csharp
options.UseSqlServer(connStr, sqlOptions => sqlOptions.EnableRetryOnFailure())
```

---

## Step 4 — Application Layer (DTOs, Mappers, Services)

**Prompt:** Implement DTOs, mappers, and business logic services.

### DTOs
- `CustomerDto`, `CreateCustomerDto`
- `SubscriptionDto`, `CreateSubscriptionDto`, `UpdateSubscriptionDto`
- `PaymentDto`, `CreatePaymentDto`, `DebtResponseDto`

### MappingProfile (Extension Methods)
- `ToDto()` / `ToEntity()` for each DTO pair
- Manual mapping (no AutoMapper dependency)

### Service Interfaces
- `ICustomerService` — GetById, GetAll, Create, Delete
- `ISubscriptionService` — GetById, GetByCustomerId, GetAll, GetActiveCount, GetUpcomingPayments, Create, Update, Delete
- `IPaymentService` — GetById, GetBySubscriptionId, GetAll, QueryDebt, Pay
- `IDebtService` — QueryDebt (mock external)
- `IPaymentGateway` — ProcessPayment (mock external)

### Service Implementations
- **CustomerService** — Full CRUD
- **SubscriptionService** — Full CRUD + active count + upcoming payments
- **PaymentService** — Debt query + payment processing
- **PaymentTaskService** — Automated overdue processing (see Step 9)

---

## Step 5 — Infrastructure Layer (Repositories, External Services)

**Prompt:** Implement EF Core repositories and mock external services.

### Repositories
- `CustomerRepository` — Standard EF Core CRUD
- `SubscriptionRepository` — Includes Customer navigation, overdue query, active count, upcoming payments range
- `PaymentRepository` — Includes Subscription navigation, ordered by PaymentDate desc
- `UnitOfWork` — Lazy-loaded repositories, single SaveChangesAsync

### Mock External Services
- `MockDebtService` — Returns random debt amount (1/3 chance of zero)
- `MockPaymentGateway` — Returns success if amount > 0

---

## Step 6 — API Controllers

**Prompt:** Generate RESTful controllers with proper HTTP verbs.

### Controller Endpoints

#### `GET /api/customers` — List all customers
#### `GET /api/customers/{id}` — Get customer by ID
#### `POST /api/customers` — Create customer
#### `DELETE /api/customers/{id}` — Delete customer

#### `GET /api/subscriptions` — List all subscriptions
#### `GET /api/subscriptions/{id}` — Get by ID
#### `GET /api/subscriptions/by-customer/{customerId}` — Get by customer
#### `POST /api/subscriptions` — Create subscription
#### `PUT /api/subscriptions/{id}` — Update subscription
#### `DELETE /api/subscriptions/{id}` — Delete subscription

#### `GET /api/payments` — List all payments
#### `GET /api/payments/{id}` — Get by ID
#### `GET /api/payments/by-subscription/{subscriptionId}` — Get by subscription
#### `POST /api/payments/query-debt/{subscriptionId}` — Query debt from mock
#### `POST /api/payments/pay` — Process a payment

#### `GET /api/dashboard` — Dashboard stats (active count + upcoming 7 days)
#### `POST /api/payment-task/process-overdue` — Trigger manual payment check

### Middleware
- `ExceptionHandlingMiddleware` — Catches KeyNotFoundException (404), InvalidOperationException (400), and generic exceptions (500)

### Program.cs DI Registration
```csharp
IUnitOfWork, ICustomerService, ISubscriptionService, IPaymentService,
IDebtService, IPaymentGateway, IExternalPaymentService, IPaymentTaskService
IHttpClientFactory ("MockBankApi" named client with MockBankMessageHandler)
CORS (AllowAll)
Swagger (Development only)
```

---

## Step 7 — Mock External Payment Service (HttpClient Factory Pattern)

**Prompt:** Create IExternalPaymentService with CheckDebt + ProcessPayment, use HttpClient factory pattern.

### Interface + Response DTOs
```csharp
IExternalPaymentService
├── Task<CheckDebtResponse> CheckDebtAsync(int subscriptionId)
│   └── CheckDebtResponse.Amount (decimal)
└── Task<ProcessPaymentResponse> ProcessPaymentAsync(decimal amount)
    └── ProcessPaymentResponse.IsSuccess (bool)
    └── ProcessPaymentResponse.TransactionId (string)
```

### MockBankMessageHandler
- Custom `HttpMessageHandler` that sits in the HTTP pipeline
- Simulates 1 second network delay on every call
- `/debt/*` endpoint → random amount (1/3 chance of zero)
- `/payment/*` endpoint → 80% success / 20% fail

### MockExternalPaymentService
- Injected with `IHttpClientFactory`
- Creates named client `"MockBankApi"` which uses `MockBankMessageHandler`
- Makes real HTTP GET/POST calls through the mock pipeline
- Demonstrates professional `IHttpClientFactory` pattern even in mock scenario

---

## Step 8 — PaymentTaskService (Automated Overdue Processing)

**Prompt:** Implement business logic that checks overdue subscriptions, queries debt, processes payments, and rolls next payment date.

### Algorithm

```
1. Query all Active subscriptions where NextPaymentDate ≤ UtcNow
2. For each subscription:
   a. Call CheckDebtAsync → get current debt
   b. If amount ≤ 0 → skip (no debt)
   c. Call ProcessPaymentAsync(amount)
   d. If payment fails → log failure, continue
   e. Create Payment record (Status = Success)
   f. Update NextPaymentDate:
      - Monthly → AddMonths(1)
      - Yearly  → AddYears(1)
3. SaveChangesAsync once for all mutations
```

### PaymentTaskResult
```
CheckedCount, PaidCount, FailedCount, SkippedCount, Details[]
```

---

## Step 9 — Frontend (React + Tailwind CSS)

**Prompt:** Create Vite React app with Tailwind, Dashboard, Customer subscription table, Trigger payment check button.

### Setup
- Vite 6 + React 18 + TypeScript
- Tailwind CSS v4 (via `@tailwindcss/vite` plugin)
- Proxy `/api` → `http://localhost:5000`

### UI Components (Single Page App)

#### Header
- Title "HalalBank" + subtitle

#### Dashboard Cards
- **Total Active Subscriptions** — emerald counter
- **Upcoming Payments (7 days)** — amber counter

#### Upcoming Payments Table
- Provider, Category, Amount, Due Date, Billing Cycle

#### Customer Subscriptions Section
- Dropdown selector populated from `GET /api/customers`
- Table showing Provider, Category, Price, Billing, NextPaymentDate (overdue dates in red), Status badge (Active/Passive)

#### Manual Payment Check Button
- Calls `POST /api/payment-task/process-overdue`
- Spinner during processing
- Result summary (Checked/Paid/Failed/Skipped counts)
- Detail log with per-subscription messages

---

## Step 10 — Seed Data

**Prompt:** Add seed data for testing (3 customers, 5 subscriptions with overdue dates).

### Seed Customers (via .HasData in CustomerConfiguration)
| Id | Name | Email |
|----|------|-------|
| 1 | John Doe | john.doe@email.com |
| 2 | Jane Smith | jane.smith@email.com |
| 3 | Bob Wilson | bob.wilson@email.com |

### Seed Subscriptions (via .HasData in SubscriptionConfiguration)
| Id | Customer | Provider | Price | NextPaymentDate | Cycle |
|----|----------|----------|-------|-----------------|-------|
| 1 | John Doe | Netflix | $15.99 | 2026-05-10 (yesterday) | Monthly |
| 2 | John Doe | Spotify | $9.99 | 2026-05-10 (yesterday) | Monthly |
| 3 | Jane Smith | Electricity Bill | $120.00 | 2026-05-11 (today) | Monthly |
| 4 | Jane Smith | Internet | $59.99 | 2026-05-11 (today) | Monthly |
| 5 | Bob Wilson | Cloud Storage | $99.99 | 2026-05-10 (yesterday) | Yearly |

### Migration
```bash
dotnet ef migrations add SeedData --project src\Infrastructure --startup-project src\API
dotnet ef database update --project src\Infrastructure --startup-project src\API
```

All 5 subscriptions are overdue (NextPaymentDate ≤ today) so they will be picked up by the Manual Payment Check.

---

## Step 11 — Unit Tests (xUnit + Moq + FluentAssertions)

**Prompt:** Create test project with automated tests for PaymentTaskService using AAA pattern.

### Test Project
- `tests/Application.Tests/` — xUnit, net8.0
- Packages: Moq 4.20, FluentAssertions 8.9
- References: Application, Domain

### 6 Passing Tests

| Test | Scenario | Key Assertions |
|------|----------|---------------|
| 1 | Debt exists + payment succeeds | PaidCount=1, Payment.AddAsync called, NextPaymentDate +1 month, SaveChangesAsync called |
| 2 | Payment fails (IsSuccess=false) | FailedCount=1, No Payment.AddAsync, No UpdateAsync, SaveChangesAsync still called |
| 3 | No debt (amount=0) | SkippedCount=1, ProcessPaymentAsync never called, No SaveChangesAsync |
| 4 | External service throws | FailedCount=1, error in Details, No payment created |
| 5 | Yearly billing cycle | NextPaymentDate +1 year |
| 6 | No overdue subscriptions | All counts=0, No external calls, No SaveChangesAsync |

### Mock Architecture
```
PaymentTaskService
  ├── IUnitOfWork (Mock)
  │   ├── Subscriptions → Mock<ISubscriptionRepository>
  │   └── Payments → Mock<IPaymentRepository>
  └── IExternalPaymentService (Mock)
```

All tests follow Arrange-Act-Assert pattern with FluentAssertions `Should()` syntax.

---

## Step 12 — CI/CD (GitHub Actions)

**Prompt:** Create CI workflow that restores, builds, and tests on push/PR to main.

### `.github/workflows/ci.yml`

```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request: { branches: [main] }
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4 with { dotnet-version: 8.0.x }
      - run: dotnet restore
      - run: dotnet build --no-restore
      - run: dotnet test --no-build --verbosity normal
# (frontend tests can be added with: cd frontend && npm test)
```

---

## Step 13 — Role-Based Access Control (Mock Auth)

**Prompt:** Add RBAC via React Context: AuthContext, role-based Navbar, ProtectedRoute, Admin stats.

### AuthContext
- `src/contexts/AuthContext.tsx` — provides `{ user, login, logout }` via React Context
- Persists to `localStorage` under key `halalbank_user`
- `login(email)`: `admin@test.com` → role=`Admin`; any other email → role=`Customer`
- `logout()`: clears state + localStorage

### ProtectedRoute
- `src/components/ProtectedRoute.tsx` — `<AdminRoute>` wrapper
- If user is not Admin → redirects to `/dashboard`
- Wraps `/admin` route in `App.tsx`

### Navbar Changes
- "Admin" link only renders when `user.role === 'Admin'`
- Shows current user email
- Logout button clears context + redirects to `/login`

### Admin Page
- Placeholder stats: System Status (Operational), Total Mock Revenue ($47,892), Registered Users (3), System Overview table

### Frontend Tests (Vitest)
- `src/__tests__/AuthContext.test.tsx` — 5 tests covering login/logout/role detection/persistence
- Uses Vitest + happy-dom + @testing-library/react

---

## Project File Tree (Final)

```
HalalBank/
├── .github/workflows/ci.yml
├── .gitignore
├── HalalBank.sln
├── ProjectDescription.md
├── README.md
├── whatIsDone.md
├── src/
│   ├── Domain/
│   │   ├── Domain.csproj
│   │   ├── Entities/       Customer.cs, Subscription.cs, Payment.cs
│   │   ├── Enums/          BillingCycle.cs, PaymentStatus.cs, SubscriptionStatus.cs
│   │   └── Interfaces/     ICustomerRepository.cs, ISubscriptionRepository.cs,
│   │                       IPaymentRepository.cs, IUnitOfWork.cs
│   ├── Application/
│   │   ├── Application.csproj
│   │   ├── DTOs/           CustomerDto.cs, SubscriptionDto.cs, PaymentDto.cs
│   │   ├── Interfaces/     ICustomerService.cs, ISubscriptionService.cs,
│   │   │                   IPaymentService.cs, IDebtService.cs, IPaymentGateway.cs,
│   │   │                   IExternalPaymentService.cs, IPaymentTaskService.cs
│   │   ├── Mappers/        MappingProfile.cs
│   │   └── Services/       CustomerService.cs, SubscriptionService.cs,
│   │                       PaymentService.cs, PaymentTaskService.cs
│   ├── Infrastructure/
│   │   ├── Infrastructure.csproj
│   │   ├── Data/
│   │   │   ├── AppDbContext.cs
│   │   │   └── Configurations/ CustomerConfiguration.cs, SubscriptionConfiguration.cs,
│   │   │                       PaymentConfiguration.cs
│   │   ├── Migrations/     InitialCreate, SeedData
│   │   ├── Repositories/   CustomerRepository.cs, SubscriptionRepository.cs,
│   │   │                   PaymentRepository.cs, UnitOfWork.cs
│   │   └── ExternalServices/ MockDebtService.cs, MockPaymentGateway.cs,
│   │                        MockExternalPaymentService.cs, MockBankMessageHandler.cs,
│   │                        MockNotificationService.cs
│   └── API/
│       ├── API.csproj
│       ├── Program.cs
│       ├── appsettings.json, appsettings.Development.json
│       ├── Controllers/    CustomersController.cs, SubscriptionsController.cs,
│       │                   PaymentsController.cs, DashboardController.cs,
│   │                   PaymentTaskController.cs (process-overdue + send-reminders)
│       └── Middleware/     ExceptionHandlingMiddleware.cs
├── frontend/
│   ├── package.json, tsconfig.json, vite.config.ts, index.html
│   ├── public/
│   └── src/
│       ├── index.css, main.tsx, App.tsx (router: / → /login → /register → /dashboard → /admin → /payment-gateway/:id)
│       ├── contexts/   AuthContext.tsx (RBAC: Admin/Customer roles, localStorage persistence)
│       ├── __tests__/  AuthContext.test.tsx (5 Vitest tests)
│       ├── services/api.ts
│       ├── components/  Navbar.tsx (conditional Admin link + Logout), ProtectedRoute.tsx
│       └── pages/  Login.tsx, Register.tsx, Dashboard.tsx, Admin.tsx, PaymentGateway.tsx
└── tests/
    └── Application.Tests/
        ├── Application.Tests.csproj
        ├── PaymentTaskServiceTests.cs (6 tests)
        ├── SubscriptionServiceTests.cs (2 tests)
        ├── MockNotificationServiceTests.cs (2 tests)
        └── ReminderTaskTests.cs (3 tests)
```

---

## How to Run

```bash
# Backend
cd src/API
dotnet run

# Frontend (separate terminal)
cd frontend
npm run dev

# Backend tests
dotnet test

# Frontend tests
cd frontend
npm test

# Database migration
dotnet ef database update --project src\Infrastructure --startup-project src\API

# Trigger payment check
curl -X POST http://localhost:5000/api/payment-task/process-overdue

# Send email reminders
curl -X POST http://localhost:5000/api/payment-task/send-reminders

# Payment Gateway UI (open in browser after frontend starts)
# Navigate to http://localhost:3000/payment-gateway/1
```

---

---

## howToTest

How to test every feature required in `ProjectDescription.md`.

---

### 1. Customer Management — Create / Read / Delete

**Backend (curl / Postman / Swagger UI at `http://localhost:5000/swagger`)**

```bash
# Create
curl -X POST http://localhost:5000/api/customers \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@test.com"}'
# → 201 Created + customer object with id

# Read all
curl http://localhost:5000/api/customers
# → 200 + array (includes 3 seed customers)

# Read by id
curl http://localhost:5000/api/customers/1
# → 200 + John Doe

# Delete
curl -X DELETE http://localhost:5000/api/customers/1
# → 204 No Content
```

**Frontend:** Customer dropdown on Dashboard page is populated from `GET /api/customers`.

---

### 2. Subscription Management — Create / Read / Update / Delete

```bash
# Create (John Doe has customerId=1)
curl -X POST http://localhost:5000/api/subscriptions \
  -H "Content-Type: application/json" \
  -d '{"customerId":1,"providerName":"Disney+","category":"Streaming","price":10.99,"billingCycle":"Monthly","nextPaymentDate":"2026-06-15T00:00:00Z"}'
# → 201 Created

# Read all
curl http://localhost:5000/api/subscriptions
# → 200 + array (includes 5 seed subscriptions)

# Read by customer
curl http://localhost:5000/api/subscriptions/by-customer/1
# → John Doe's subscriptions (Netflix, Spotify)

# Update
curl -X PUT http://localhost:5000/api/subscriptions/1 \
  -H "Content-Type: application/json" \
  -d '{"price":19.99,"status":"Passive"}'
# → 204 No Content

# Delete
curl -X DELETE http://localhost:5000/api/subscriptions/1
# → 204 No Content
```

**Frontend:** Select a customer from the dropdown → their subscriptions appear in the table with status badges (Active/Passive), overdue dates in red.

---

### 3. Debt Query — 3rd Party Mock Service

```bash
curl -X POST http://localhost:5000/api/payments/query-debt/1
# → 200 + {"amount":123.45,"dueDate":"2026-06-01T...","period":"2026 05"}
```

- Run multiple times → amount varies randomly
- ~1/3 chance of getting `amount: 0` (no debt)
- This calls the `IExternalPaymentService.CheckDebtAsync()` which goes through `HttpClient` → `MockBankMessageHandler` → returns mock JSON

---

### 4. Payment Operations — Create / Read

```bash
# Read payment history
curl http://localhost:5000/api/payments/by-subscription/1
# → 200 + array of payments for this subscription (empty initially)

# Process a manual payment
curl -X POST http://localhost:5000/api/payments/pay \
  -H "Content-Type: application/json" \
  -d '{"subscriptionId":3,"amount":120.00}'
# → 201 Created + payment object (Status = "Success" or "Fail")
```

- Payment goes through `IExternalPaymentService.ProcessPaymentAsync()` → 1s simulated network delay
- ~80% chance of success, ~20% chance of failure

---

### 5. Manual Payment Check (Process Overdue)

The core business logic that ties everything together.

```bash
curl -X POST http://localhost:5000/api/payment-task/process-overdue
# → 200 + {
#       "checkedCount": 5,
#       "paidCount": 3,
#       "failedCount": 0,
#       "skippedCount": 2,
#       "details": [
#         "Subscription 1 (Netflix): Paid $15.99...",
#         "Subscription 2 (Spotify): No debt.",
#         "Subscription 3 (Electricity Bill): Paid $120.00...",
#         ...
#       ]
#     }
```

**What happens:**
1. Finds all Active subscriptions where `NextPaymentDate ≤ today` (5 seed subs)
2. For each: queries debt → if debt exists, processes payment
3. If payment succeeds: creates `Payment` record + rolls `NextPaymentDate` (+1 month for Monthly, +1 year for Yearly)
4. Results are saved in one `SaveChangesAsync` call

**To retest after first run:** Run again — paid subscriptions now have rolled dates, so they won't be picked up again. Create new subscriptions with past dates to re-test.

**Frontend:** Click "Trigger Manual Payment Check" button → spinner → result summary displayed.

---

### 6. Dashboard — Summary & Display

```bash
curl http://localhost:5000/api/dashboard
# → 200 + {
#       "totalActiveSubscriptions": 5,
#       "upcomingPayments": [  /* subscriptions with NextPaymentDate within next 7 days */ ]
#     }
```

**Frontend:** Dashboard page shows two cards:
- **Total Active Subscriptions** — count from `GET /api/dashboard`
- **Upcoming Payments** — count + table with Provider, Category, Amount, Due Date, Billing Cycle

**Frontend Routes & Navigation (react-router-dom):**
| Route | Page | Access | Description |
|-------|------|--------|-------------|
| `/` | Redirects to `/login` | Public | Default entry |
| `/login` | Login | Public | Sign in — `admin@test.com` → Admin role, any other → Customer role |
| `/register` | Register | Public | Register form → login + redirect to dashboard |
| `/dashboard` | Dashboard | Any logged-in user | Full dashboard with cards, tables, payment check |
| `/admin` | Admin | **Admin only** | Protected by `<AdminRoute>` — Customer users redirected to `/dashboard` |
| `/payment-gateway/:subscriptionId` | Payment Gateway | Any logged-in user | Bank-like payment interface with debt query + confirm |

**Navbar:**
- "Dashboard" link — visible to all users
- "Admin" link — **only visible** when `user.role === 'Admin'`
- Email display (right side) — shows current user's email
- "Logout" button — clears AuthContext + localStorage, redirects to `/login`

**Role-Based Access Control (RBAC):**
- `AuthContext` (`src/contexts/AuthContext.tsx`) manages `{ email, role }` state
- State persisted to `localStorage` under key `halalbank_user`
- Login: `admin@test.com` → role=`Admin`; any other email → role=`Customer`
- `ProtectedRoute.tsx` (`<AdminRoute>`) wraps `/admin`: if user is not Admin, redirects to `/dashboard`
- Logout clears context + localStorage

---

### 7. Subscription-Based Payment History

```bash
curl http://localhost:5000/api/payments/by-subscription/1
# → 200 + array of payments filtered by subscriptionId

curl http://localhost:5000/api/payments
# → 200 + all payments across all subscriptions
```

---

### 8a. Email Reminder — Send Reminders

```bash
curl -X POST http://localhost:5000/api/payment-task/send-reminders
# → 200 + {"remindersSent": 5}
```

- Checks all **Active** subscriptions where `NextPaymentDate` is within the next 3 days
- For each, calls `INotificationService.SendReminderEmailAsync()` which logs to console via `ILogger`
- Returns count of reminders sent

**Frontend:** No dedicated UI — verify in backend terminal output for log lines like:
```
📧 REMINDER EMAIL SENT --- To: john.doe@email.com | Subject: Upcoming Payment Reminder for Netflix ...
```

---

### 8b. Payment Gateway UI (React)

**Route:** `/payment-gateway/:subscriptionId`

**How to test:**
1. Go to Dashboard → select a customer → click **Pay** on any subscription
2. You're redirected to a bank-like page with dark gradient background
3. It fetches debt info via `POST /api/payments/query-debt/{subscriptionId}`
4. Displays: Subscription ID, Amount Due, Due Date, Period
5. Click **Confirm Payment — $XXX.XX** → 2-second spinner appears
6. Calls `POST /api/payments/pay` → on success redirects to Dashboard with green toast
7. On payment failure, error message shown on the gateway page

---

### 8c. Role-Based Access Control (RBAC) — Mock Auth

**How to test — step by step:**

1. Start backend + frontend (`cd src/API && dotnet run` + `cd frontend && npm run dev`)
2. Open `http://localhost:3000` → redirected to `/login`
3. **Test Customer access:**
   - Enter `user@example.com` → click Sign In → redirected to `/dashboard`
   - Navbar shows: Dashboard link, email, Logout button — **no Admin link**
   - Manually navigate to `http://localhost:3000/admin` → redirected back to `/dashboard`
4. **Test Admin access:**
   - Click Logout → redirected to `/login`
   - Enter `admin@test.com` → click Sign In → redirected to `/dashboard`
   - Navbar shows: Dashboard link, **Admin link**, email, Logout button
   - Click "Admin" → see Admin page with System Status, Total Mock Revenue ($47,892), etc.
5. **Test persistence:**
   - Refresh the page at `/admin` → still on Admin page (state persisted in localStorage)
   - Refresh the page at `/dashboard` → still on Dashboard
6. **Test Logout:**
   - Click Logout → redirected to `/login`, localStorage cleared

---

### 8d. Frontend Unit Tests (Vitest)

```bash
cd frontend
npm test
# → 5/5 Passing
```

| Test | File | What It Covers |
|------|------|---------------|
| Starts with null user | AuthContext.test.tsx | Initial state is null |
| admin@test.com → Admin | AuthContext.test.tsx | Role detection logic |
| any other email → Customer | AuthContext.test.tsx | Role detection logic |
| Persists to localStorage | AuthContext.test.tsx | State survives refresh |
| Clears on logout | AuthContext.test.tsx | Logout clears context + storage |

---

### 8c. Subscription Number

- Auto-generated as `SUB-XXXXX` (random 5 digits) when creating a new subscription without one
- Preserved if explicitly provided in the request body
- Displayed in all subscription tables (frontend and API responses)

---

### 8. Third-Party Mock Services

The system interacts with **3 mock external services** (requirement was at least 2):

| Service | Interface | Implementation |
|---------|-----------|----------------|
| Debt Query | `IExternalPaymentService.CheckDebtAsync()` | `MockBankMessageHandler` returns JSON via HTTP |
| Payment Processing | `IExternalPaymentService.ProcessPaymentAsync()` | `MockBankMessageHandler` with 1s delay + 80% success |
| Legacy Debt Query | `IDebtService.QueryDebtAsync()` | `MockDebtService` (direct mock, no HTTP) |
| Legacy Payment Gateway | `IPaymentGateway.ProcessPaymentAsync()` | `MockPaymentGateway` (direct mock, no HTTP) |

All use randomness → different results on each call.

---

### 9. Unit Tests

```bash
# Backend tests
dotnet test
# → 13/13 Passing

# Frontend tests
cd frontend
npm test
# → 5/5 Passing
```

**Backend tests (xUnit + Moq + FluentAssertions):**

| Test | File | What It Covers |
|------|------|---------------|
| Success: debt + payment | PaymentTaskServiceTests | Full happy path: payment created, date rolled +1 month |
| Failure: payment fails | PaymentTaskServiceTests | External returns false → no payment record, failure counted |
| Skip: no debt | PaymentTaskServiceTests | Amount = 0 → skipped, no external payment called |
| Error: exception thrown | PaymentTaskServiceTests | External throws → caught gracefully, failure counted |
| Yearly billing | PaymentTaskServiceTests | Date rolled +1 year instead of +1 month |
| Empty overdue list | PaymentTaskServiceTests | No subscriptions → all counts zero, no calls made |
| SubscriptionNumber auto-generated | SubscriptionServiceTests | When no number provided → generates `SUB-XXXXX` |
| SubscriptionNumber preserved | SubscriptionServiceTests | When number provided → saved as-is |
| Notification does not throw | MockNotificationServiceTests | `SendReminderEmailAsync` completes without exception |
| Notification logs at Info | MockNotificationServiceTests | `LogInformation` is called exactly once |
| Reminders for 3 upcoming subs | ReminderTaskTests | 3 subs due within 3 days → 3 reminders sent |
| Reminders when none upcoming | ReminderTaskTests | No upcoming → 0 reminders sent |
| Reminders filter by date range | ReminderTaskTests | Subs outside 3-day window are excluded |

**Frontend tests (Vitest + happy-dom + @testing-library/react):**

| Test | File | What It Covers |
|------|------|---------------|
| Starts with null user | AuthContext.test.tsx | Initial state is null |
| admin@test.com → Admin | AuthContext.test.tsx | Role detection: correct role assigned |
| any other email → Customer | AuthContext.test.tsx | Role detection: non-admin email |
| Persists to localStorage | AuthContext.test.tsx | State survives page refresh |
| Clears on logout | AuthContext.test.tsx | Logout clears context + storage |

**Total: 18 tests (13 backend + 5 frontend)**

---

### 10. CI Pipeline

Push to `main` or open a PR targeting `main` → GitHub Actions triggers:
```yaml
- dotnet restore
- dotnet build --no-restore
- dotnet test --no-build --verbosity normal
```

---

## Missed / Different from Original ProjectDescription

| Requirement | Status | Explanation |
|-------------|--------|-------------|
| **Ödeme dönemi (Period) on Payment** | ❌ Not implemented | Original spec had `Period` field on Payment. Removed per later user simplification of Payment entity to `{Id, SubscriptionId, Amount, PaymentDate, Status}`. |
| **Abonelik numarası (Subscription Number)** | ✅ Implemented | Added to Subscription entity, DTOs, seed data (`SUB-48291` etc.), and auto-generated on create |
| **Abonelik türü (Type) enum — Electricity, Water etc.** | ❌ Replaced with `Category` (string) | The user later re-specified the Subscription entity and `Category` is a free-text field instead of a constrained enum. |
| **Hatırlatma Mekanizması / Reminder endpoint** | ✅ Implemented | `POST /api/payment-task/send-reminders` sends email reminders for subscriptions due within 3 days |
| **Bildirim Servisi / Notification Service (Email/SMS)** | ✅ Implemented (mock) | `MockNotificationService` logs email content via `ILogger` — simulates external email/SMS service |
| **ER Diagram** | ❌ Not created | Required per "Sistem Tasarım Dokümanları" section |
| **API Endpoint List (standalone doc)** | 🟡 Partial | Endpoints exist and are documented in this file, but no separate API specification document was produced |
| **Flow Diagram (debt→payment→reminder)** | ❌ Not created | Required per "Sistem Tasarım Dokümanları" section |

### All other requirements are covered:

- ✅ Customers: Create / Read / Delete
- ✅ Subscriptions: Create / Read / Update / Delete
- ✅ Payments: Create / Read
- ✅ Debt Query via mock 3rd party service
- ✅ Payment Processing via mock service
- ✅ At least 2 different mock external services (actually 5: MockDebtService, MockPaymentGateway, MockExternalPaymentService, MockBankMessageHandler, MockNotificationService)
- ✅ Subscription Number on Subscription entity + seed data
- ✅ One Customer → Many Subscriptions → Many Payments (EF Core relationships with cascade delete)
- ✅ RESTful API design (proper HTTP verbs, status codes)
- ✅ Clean Architecture (Domain, Application, Infrastructure, API)
- ✅ .NET 8 + React 18 + TypeScript + Vite
- ✅ SQL Server with EF Core (entity configurations, migrations)
- ✅ Seed data for testing
- ✅ Unit tests (13 backend xUnit + 5 frontend Vitest)
- ✅ Role-Based Access Control (mock auth: Admin/Customer roles, protected routes, conditional navbar)
- ✅ CI pipeline (GitHub Actions)
- ✅ AI Usage documented in README.md

---

## AI Usage

This project was developed entirely with AI assistance. The AI was used for:

- **Code generation** — scaffolding the full solution structure, controllers, services, repositories, frontend components, and test files
- **API design** — suggesting RESTful endpoint structure and Clean Architecture layering
- **Business logic** — implementing the overdue payment processing algorithm, next-date rolling, and skip conditions
- **Testing** — generating xUnit test cases with Moq mocks covering success, failure, skip, and error scenarios
- **Configuration** — EF Core setup, migration commands, Tailwind CSS integration, GitHub Actions CI

All AI-generated output was reviewed, adapted, and verified via build (0 errors, 0 warnings) and test runs (18/18 passing — 13 backend xUnit + 5 frontend Vitest) before inclusion.
