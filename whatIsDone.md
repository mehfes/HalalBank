# What Is Done — HalalBank

> Subscription & Auto-Payment Reminder System  
> Built for a case study, step by step with AI assistance.

---

## Tech Stack

| Layer       | Technology                                      |
|-------------|-------------------------------------------------|
| Backend     | C#, .NET 8 Web API, Clean Architecture          |
| Frontend    | React 18, TypeScript, Vite 6, Tailwind CSS v4   |
| Database    | PostgreSQL (Railway), Entity Framework Core 8 + Npgsql|
| Testing     | xUnit, Moq 4.20, FluentAssertions 8.9           |
| CI/CD       | GitHub Actions (ubuntu-latest)                  |
| Deployment  | Railway (backend), Cloudflare Pages (frontend)  |
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
- `IDebtService` — QueryDebt (removed — debt now returned directly from subscription price)
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
IPaymentGateway, IExternalPaymentService, IPaymentTaskService
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

### 17 Passing Tests (Backend)

| Test | File | Scenario |
|------|------|----------|
| 6 tests | PaymentTaskServiceTests | Success, failure, skip, error, yearly billing, empty list |
| 4 tests | PaymentServiceTests | Double-payment throw, already-paid returns 0 debt, exact price returned, not-found throws |
| 2 tests | SubscriptionServiceTests | Number generation, number preservation |
| 2 tests | MockNotificationServiceTests | No throw on send, logs on send |
| 3 tests | ReminderTaskTests | Filter 3 upcoming, filter none upcoming, filter by date |

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
- `src/__tests__/AuthContext.test.tsx` — 6 tests covering login/logout/role detection/customerId/persistence/clear
- Uses Vitest + happy-dom + @testing-library/react

---

## Step 14 — Subscription Plan Entity (Service Catalog)

**Prompt:** Separate Service Catalog from user Subscriptions. Create SubscriptionPlan entity + CRUD.

### Domain
- `src/Domain/Entities/SubscriptionPlan.cs` — Id, Name, Category, DefaultPrice, DefaultBillingCycle

### Infrastructure
- `SubscriptionPlanConfiguration` — Fluent API + `.HasData()` seeds 4 plans:
  - Netflix Premium ($15.99/mo), Spotify ($9.99/mo), Gym Membership ($49.99/mo), Internet Bill ($59.99/mo)
- `SubscriptionPlanRepository` — Standard CRUD
- Updated `IUnitOfWork` + `UnitOfWork` with `SubscriptionPlans` property
- Migration: `AddSubscriptionPlans`

### Application
- `SubscriptionPlanDto`, `CreateSubscriptionPlanDto`, `UpdateSubscriptionPlanDto`
- `MappingProfile` — `ToDto()` / `ToEntity()` extensions
- `ISubscriptionPlanService` + `SubscriptionPlanService` — Full CRUD with null guards

### API
- `SubscriptionPlansController` — `GET/POST/PUT/DELETE /api/subscriptionplans`
- Registered `ISubscriptionPlanService` in `Program.cs`

---

## Step 15 — Data Isolation (customerId on AuthContext)

**Prompt:** Fix Dashboard to use logged-in user's customerId. Remove the "Select Customer" dropdown.

### AuthContext Changes
- Added `customerId?: number` to `User` interface
- `user@test.com` → `{ role: 'Customer', customerId: 1 }` (simulates John Doe)
- `admin@test.com` → `{ role: 'Admin' }` (no customerId)
- Tests updated to verify customerId=1 persists to localStorage

### Dashboard Refactor
- Removed customer fetch (`GET /api/customers`) and "Select Customer" dropdown entirely
- Uses `useAuth()` to get `user.customerId`
- Auto-fetches subscriptions via `GET /api/subscriptions/by-customer/{customerId}`
- Dashboard cards computed locally from user's own subscriptions (active count + upcoming payments)
- After payment check, refetches user-specific subscriptions
- For Admin: no data shown (no customerId)

### Login Page
- Hint updated: "Try user@test.com (Customer) or admin@test.com (Admin)"

---

## Step 16 — Discover Page & Admin Dashboard Refactor

**Prompt:** Build Discover page with role-based UI (Customer subscribes, Admin manages catalog) + Admin page with All Users Overview table.

### Discover Page (`/discover`)
- Fetches all `SubscriptionPlan` records from `GET /api/subscriptionplans`
- Renders as cards: Category badge, Plan Name, Price, Billing Cycle
- **Conditional UI based on role:**
  - **Customer:** "Subscribe" button calls `POST /api/subscriptions` with logged-in user's `customerId` and plan's details. Success toast + redirect to `/dashboard`. No admin controls visible.
  - **Admin:** Red "Delete" button on each card calls `DELETE /api/subscriptionplans/{id}`. "Create New Plan" button at top toggles an inline form (Provider Name, Category, Price, Billing Cycle) that calls `POST /api/subscriptionplans`. No Subscribe buttons.
- Catalog management moved from Admin page's "Manage Plans" tab into Discover for Admins.

### Navbar
- "Discover" link visible to **all logged-in users** (both Customer and Admin)
- "Admin" link remains visible only when `role === 'Admin'`

### Admin Page Refactor
- Removed placeholder stats entirely and removed "Manage Plans" tab
- Single section: **All Users Overview** — Table of ALL subscriptions (`GET /api/subscriptions`)

### API (frontend)
- `api.subscriptionPlans` — getAll, getById, create, update, delete

### Frontend Tests
- `Discover.test.tsx` — 15 tests: 7 customer-mode tests (loading, renders cards, subscribe enabled, calls create API, toast, no admin buttons visible) + 8 admin-mode tests (loading, renders cards, Delete buttons instead of Subscribe, Create New Plan button, form fields, creates plan via API, deletes plan via API, delete toast)
- `Admin.test.tsx` — 3 tests: shows All Subscriptions heading, displays all subscriptions, shows Admin Panel heading

---

## Step 17 — Fixed Debt Query to Return Exact Subscription Price

**Prompt:** Remove random debt amount generation. Return exact subscription price from database.

### Problem
`PaymentService.QueryDebtAsync` delegated to `MockDebtService` which generated random amounts using `new Random().NextDouble() * 1000 + 50`. The PaymentGateway UI showed random values instead of the actual subscription price.

### Fix
- `PaymentService.QueryDebtAsync` now returns `subscription.Price` directly instead of calling `_debtService.QueryDebtAsync()`
- Removed `IDebtService` interface and `MockDebtService` implementation entirely
- Removed `builder.Services.AddScoped<IDebtService, MockDebtService>()` from `Program.cs`
- `MockBankMessageHandler` already correctly extracted price from URL for the `PaymentTaskService` flow, so no change needed there

### Tests Added
| Test | File | What It Covers |
|------|------|---------------|
| QueryDebtAsync returns exact subscription price | PaymentServiceTests | When not already paid, Amount = subscription.Price (15.99) |
| QueryDebtAsync throws when subscription not found | PaymentServiceTests | KeyNotFoundException for invalid subscription ID |

### Results
- Backend: 17/17 passing (+2 new tests)
- Frontend: 24/24 passing (no changes needed — already reads `debt.amount` from API)
- Build: 0 errors, 0 warnings

---

## Project File Tree (Final)

```
HalalBank/
├── .github/workflows/ci.yml
├── .gitignore
├── HalalBank.sln
├── ProjectDescription.md
├── README.md
├── SYSTEM_DESIGN.md
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
│   │   ├── DTOs/           CustomerDto.cs, SubscriptionDto.cs, PaymentDto.cs,
│   │   │                   SubscriptionPlanDto.cs
│   │   ├── Interfaces/     ICustomerService.cs, ISubscriptionService.cs,
│   │   │                   IPaymentService.cs, IPaymentGateway.cs,
│   │   │                   IExternalPaymentService.cs, IPaymentTaskService.cs,
│   │   │                   INotificationService.cs, ISubscriptionPlanService.cs
│   │   ├── Mappers/        MappingProfile.cs
│   │   └── Services/       CustomerService.cs, SubscriptionService.cs,
│   │                       PaymentService.cs, PaymentTaskService.cs,
│   │                       SubscriptionPlanService.cs
│   ├── Infrastructure/
│   │   ├── Infrastructure.csproj
│   │   ├── Data/
│   │   │   ├── AppDbContext.cs
│   │   │   └── Configurations/ CustomerConfiguration.cs, SubscriptionConfiguration.cs,
│   │   │                       PaymentConfiguration.cs, SubscriptionPlanConfiguration.cs
│   │   ├── Migrations/     InitialCreate, SeedData, AddSubscriptionNumber, AddSubscriptionPlans
│   │   ├── Repositories/   CustomerRepository.cs, SubscriptionRepository.cs,
│   │   │                   PaymentRepository.cs, SubscriptionPlanRepository.cs, UnitOfWork.cs
│   │   └── ExternalServices/ MockPaymentGateway.cs,
│   │                        MockExternalPaymentService.cs, MockBankMessageHandler.cs,
│   │                        MockNotificationService.cs
│   └── API/
│       ├── API.csproj
│       ├── Program.cs
│       ├── appsettings.json, appsettings.Development.json
│       ├── Controllers/    CustomersController.cs, SubscriptionsController.cs,
│       │                   PaymentsController.cs, DashboardController.cs,
│       │                   PaymentTaskController.cs (process-overdue + send-reminders),
│       │                   SubscriptionPlansController.cs
│       └── Middleware/     ExceptionHandlingMiddleware.cs
├── frontend/
│   ├── package.json, tsconfig.json, vite.config.ts, index.html
│   ├── public/
│   └── src/
│       ├── index.css, main.tsx, App.tsx (router: / → /login → /register → /dashboard → /admin → /payment-gateway/:id)
│       ├── contexts/   AuthContext.tsx (RBAC: Admin/Customer roles + customerId, localStorage persistence)
│       ├── __tests__/  AuthContext.test.tsx (6 tests), Discover.test.tsx (15 tests), Admin.test.tsx (3 tests)
│       ├── services/api.ts (+ subscriptionPlans API)
       │ ├── components/  Navbar.tsx (Discover link for all roles + Admin link + Logout), ProtectedRoute.tsx
       │ └── pages/  Login.tsx, Register.tsx, Dashboard.tsx (customerId-driven), Admin.tsx (all subscriptions table),
       │                   Discover.tsx (Customer: Subscribe / Admin: Delete + Create), PaymentGateway.tsx
└── tests/
    └── Application.Tests/
        ├── Application.Tests.csproj
        ├── PaymentTaskServiceTests.cs (6 tests)
        ├── PaymentServiceTests.cs (2 tests)
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

# Subscription Plans CRUD
curl http://localhost:5000/api/subscriptionplans

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

### 3. Debt Query — Returns Exact Subscription Price

```bash
curl -X POST http://localhost:5000/api/payments/query-debt/1
# → 200 + {"amount":15.99,"dueDate":"2026-06-01T...","period":"2026 05"}
```

- Returns the **exact subscription price** from the database (e.g., $15.99 for Netflix)
- If already paid for the current period: `amount: 0` with "Already Paid" display on frontend
- No random amount generation — always the subscription's actual price

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

**Frontend:** Dashboard auto-fetches subscriptions for the logged-in user:
- **Total Active Subscriptions** — computed from user's own subscriptions
- **Upcoming Payments** — computed from user's own subscriptions (next 7 days)
- **My Subscriptions** table — shows only the logged-in user's subscriptions
- No customer dropdown — data isolated per logged-in Customer

### Google Sign-In Test

**How to test:**
1. Open the login page
2. Click **Sign in with Google** button
3. Select your Google account from the popup
4. First-time login → account auto-created, redirected to Dashboard
5. Subsequent login with same Google account → existing account loaded
6. Check email: change a subscription status → you receive a real email via SendGrid

**Backend verification:**
```bash
# Google login requires a valid ID token (generated by frontend Google button)
# You can't test this via curl — must use the browser
```

---

**Frontend Routes & Navigation (react-router-dom):**
| Route | Page | Access | Description |
|-------|------|--------|-------------|
| `/` | Redirects to `/login` | Public | Default entry |
| `/login` | Login | Public | Sign in — `user@test.com` → Customer + customerId=1; `admin@test.com` → Admin |
| `/register` | Register | Public | Register form → login + redirect to dashboard |
| `/dashboard` | Dashboard | Any logged-in user | Auto-fetches subscriptions for logged-in user's customerId. Cards show user's own data |
| `/discover` | Discover | Any logged-in user | Plan cards. Customer sees Subscribe button; Admin sees Delete + Create New Plan form |
| `/admin` | Admin | **Admin only** | Protected by `<AdminRoute>`. Shows all subscriptions table |
| `/payment-gateway/:subscriptionId` | Payment Gateway | Any logged-in user | Bank-like payment interface with debt query + confirm |

**Navbar:**
- "Dashboard" link — visible to all users
- "Discover" link — visible to **all logged-in users** (both Customer and Admin)
- "Admin" link — **only visible** when `user.role === 'Admin'`
- Email display (right side) — shows current user's email
- "Logout" button — clears AuthContext + localStorage, redirects to `/login`

**Role-Based Access Control (RBAC):**
- `AuthContext` (`src/contexts/AuthContext.tsx`) manages `{ email, role, customerId? }` state
- State persisted to `localStorage` under key `halalbank_user`
- `user@test.com` → role=`Customer`, **customerId=`1`** (drives Dashboard data isolation)
- `admin@test.com` → role=`Admin` (no customerId — sees system-wide data)
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
1. Go to Dashboard → click **Pay** on any subscription
2. You're redirected to a bank-like page with dark gradient background
3. It fetches debt info via `POST /api/payments/query-debt/{subscriptionId}`
4. Displays: Subscription ID, **Amount Due = exact subscription price** (e.g., $15.99), Due Date, Period
5. Click **Confirm Payment — $15.99** → 2-second spinner appears
6. Calls `POST /api/payments/pay` → on success redirects to Dashboard with green toast
7. On payment failure, error message shown on the gateway page
8. **Double-payment prevention:** Navigate back to `/payment-gateway/1` → shows green "Already Paid for this Period" badge (no random amount, confirms debt returns $0)

---

### 8c. Role-Based Access Control (RBAC) + Data Isolation

**How to test — step by step:**

1. Start backend + frontend (`cd src/API && dotnet run` + `cd frontend && npm run dev`)
2. Open `http://localhost:3000` → redirected to `/login`
3. **Test Customer access (data isolation):**
   - Enter `user@test.com` → click Sign In → redirected to `/dashboard`
   - Navbar shows: Dashboard link, **Discover link**, email, Logout button — **no Admin link**
   - Dashboard cards show only **John Doe's** subscriptions (Netflix, Spotify — 2 active, 2 upcoming)
   - "My Subscriptions" table shows only John Doe's 2 subscriptions
   - Manually navigate to `http://localhost:3000/admin` → redirected back to `/dashboard`
4. **Test Admin access (system-wide view):**
   - Click Logout → redirected to `/login`
   - Enter `admin@test.com` → click Sign In → redirected to `/dashboard`
   - Navbar shows: Dashboard link, **Discover link**, **Admin link**, email, Logout button
   - Click "Admin" → see **All Users Overview** tab with ALL 5 subscriptions across all customers
5. **Test persistence:**
   - Refresh the page at `/admin` → still on Admin page (state persisted in localStorage)
   - Refresh the page at `/dashboard` → still on Dashboard
6. **Test Logout:**
   - Click Logout → redirected to `/login`, localStorage cleared

---

### 8d. Subscription Plans API (Backend)

```bash
# List all plans (4 seeded)
curl http://localhost:5000/api/subscriptionplans
# → 200 + [{"id":1,"name":"Netflix Premium","category":"Streaming","defaultPrice":15.99,...}, ...]

# Get by id
curl http://localhost:5000/api/subscriptionplans/1
# → 200 + {"id":1,"name":"Netflix Premium",...}

# Create new plan
curl -X POST http://localhost:5000/api/subscriptionplans \
  -H "Content-Type: application/json" \
  -d '{"name":"Disney+","category":"Streaming","defaultPrice":12.99,"defaultBillingCycle":"Monthly"}'
# → 201 Created

# Update plan
curl -X PUT http://localhost:5000/api/subscriptionplans/1 \
  -H "Content-Type: application/json" \
  -d '{"defaultPrice":17.99}'
# → 204 No Content

# Delete plan
curl -X DELETE http://localhost:5000/api/subscriptionplans/1
# → 204 No Content
```

---

### 8e. Discover Page — Subscribe (Customer) / Manage Catalog (Admin)

**Route:** `/discover`

**How to test (Customer):**
1. Login as `user@test.com` → Navbar shows **Discover** link
2. Click **Discover** → see 4 plan cards:
   - Netflix Premium ($15.99/mo, Streaming)
   - Spotify ($9.99/mo, Music)
   - Gym Membership ($49.99/mo, Health)
   - Internet Bill ($59.99/mo, Utilities)
3. Click **Subscribe** on any card → green toast "Subscribed to {Plan}!" → auto-redirects to Dashboard
4. Dashboard now shows the new subscription in "My Subscriptions" table
5. Customer should **not** see "Create New Plan" button or "Delete" buttons

**How to test (Admin):**
1. Login as `admin@test.com` → Navbar shows **Discover** link
2. Click **Discover** → see 4 plan cards with **red "Delete" buttons** (no Subscribe buttons)
3. Click **Create New Plan** button at top → inline form appears (Provider Name, Category, Price, Billing Cycle)
4. Fill in: Name="Disney+", Category="Streaming", Price="12.99" → click **Add Plan** → green toast "Plan created" → new card appears
5. Click **Delete** on any plan card → green toast "Plan deleted" → card removed from grid
6. Click **Cancel** to hide the creation form

---

### 8f. Admin Dashboard — All Users Overview

**Route:** `/admin` (Admin only)

**How to test:**
1. Login as `admin@test.com` → click **Admin** in Navbar
2. Shows table with ALL subscriptions across all customers
3. Columns: Customer ID, Subscription #, Provider, Category, Price, Billing, Next Payment, Status
4. Catalog management (Create/Delete plans) moved to **Discover** page for Admins

---

### 8g. Frontend Unit Tests (Vitest)

```bash
cd frontend
npm test
# → 24/24 Passing
```

| Test | File | What It Covers |
|------|------|---------------|
| Starts with null user | AuthContext.test.tsx | Initial state is null |
| admin@test.com → Admin (no customerId) | AuthContext.test.tsx | Admin role, no customerId |
| user@example.com → Customer (customerId=1) | AuthContext.test.tsx | Customer role + customerId set |
| Persists admin to localStorage | AuthContext.test.tsx | Admin state survives refresh |
| Persists customerId to localStorage | AuthContext.test.tsx | Customer with customerId persists |
| Clears on logout | AuthContext.test.tsx | Logout clears context + storage |
| Shows loading state | Discover.test.tsx | "Loading plans..." shown initially |
| Renders plan cards | Discover.test.tsx | Plans displayed with name, category, price |
| Subscribe button enabled for Customer | Discover.test.tsx | Buttons not disabled for Customer role |
| Calls create with correct customerId | Discover.test.tsx | POST /api/subscriptions called with customerId=1 and plan data |
| Shows toast after subscribe | Discover.test.tsx | "Subscribed to {Plan}!" appears |
| Default tab shows All Users Overview | Admin.test.tsx | "All Subscriptions" heading rendered |
| Displays all subscriptions | Admin.test.tsx | All 5 subs from all customers shown |
| Switches to Manage Plans tab | Admin.test.tsx | Loads and displays plan catalog |
| Add New Plan form visible | Admin.test.tsx | Form inputs (Name, Category, Price) visible |
| Creates plan via API | Admin.test.tsx | api.subscriptionPlans.create called with correct data |
| Edit button switches to edit mode | Admin.test.tsx | Form fills with plan data, title changes to "Edit Plan" |
| Updates plan via API | Admin.test.tsx | api.subscriptionPlans.update called |
| Deletes plan via API | Admin.test.tsx | api.subscriptionPlans.delete called with correct id |

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
| Debt Query | `IExternalPaymentService.CheckDebtAsync()` | `MockBankMessageHandler` parses subscription price from URL |
| Payment Processing | `IExternalPaymentService.ProcessPaymentAsync()` | `MockBankMessageHandler` with 1s delay + 80% success |
| Payment Gateway | `IPaymentGateway.ProcessPaymentAsync()` | `MockPaymentGateway` (direct mock, no HTTP) |

Note: `PaymentService.QueryDebtAsync` now returns the exact `subscription.Price` from the database instead of calling a mock service. No random amount generation.

All use randomness → different results on each call.

---

### 9. Unit Tests

```bash
# Backend tests
dotnet test
# → 17/17 Passing

# Frontend tests
cd frontend
npm test
# → 24/24 Passing
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
| PayAsync already paid throws | PaymentServiceTests | Double-payment: throws `InvalidOperationException` when successful payment exists for period |
| QueryDebtAsync already paid returns 0 | PaymentServiceTests | Already-paid subscription returns Amount=0 in debt query |
| QueryDebtAsync returns exact price | PaymentServiceTests | Not-yet-paid subscription returns `subscription.Price` (15.99) as Amount |
| QueryDebtAsync not-found throws | PaymentServiceTests | Invalid subscription ID throws `KeyNotFoundException` |
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
| admin@test.com → Admin (no customerId) | AuthContext.test.tsx | Admin role, no customerId |
| user@example.com → Customer (customerId=1) | AuthContext.test.tsx | Customer role + customerId set |
| Persists admin to localStorage | AuthContext.test.tsx | Admin state survives refresh |
| Persists customerId to localStorage | AuthContext.test.tsx | Customer with customerId persists |
| Clears on logout | AuthContext.test.tsx | Logout clears context + storage |
| [Customer] Shows loading state | Discover.test.tsx | "Loading plans..." shown initially |
| [Customer] Renders plan cards | Discover.test.tsx | Plans displayed with name, category, price |
| [Customer] Subscribe button enabled | Discover.test.tsx | Buttons enabled for Customer role |
| [Customer] Calls create with correct data | Discover.test.tsx | POST /api/subscriptions with customerId=1 + plan data |
| [Customer] Shows toast after subscribe | Discover.test.tsx | "Subscribed to {Plan}!" appears |
| [Customer] No Create New Plan button | Discover.test.tsx | Customer cannot see admin create form |
| [Customer] No Delete buttons | Discover.test.tsx | Customer cannot see admin delete buttons |
| [Admin] Shows loading state | Discover.test.tsx | "Loading plans..." shown initially |
| [Admin] Renders plan cards | Discover.test.tsx | Plans displayed for admin view |
| [Admin] Shows Delete buttons | Discover.test.tsx | Delete buttons replace Subscribe for Admin |
| [Admin] Shows Create New Plan button | Discover.test.tsx | Admin sees create button at top |
| [Admin] Shows form fields after click | Discover.test.tsx | Create New Plan form renders inputs |
| [Admin] Creates plan via API | Discover.test.tsx | api.subscriptionPlans.create called correctly |
| [Admin] Deletes plan via API | Discover.test.tsx | api.subscriptionPlans.delete called with correct id |
| [Admin] Shows toast after delete | Discover.test.tsx | "Plan deleted" toast appears |
| Shows Admin Panel heading | Admin.test.tsx | Admin page renders heading |
| Shows All Subscriptions heading | Admin.test.tsx | Subscriptions table heading visible |
| Displays all subscriptions | Admin.test.tsx | All subs across all customers in table |

**Total: 41 tests (17 backend + 24 frontend)**

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
| **Ödeme dönemi (Period) on Payment** | ✅ Implemented | Added `Period` field to Payment entity (`2026 05` format), DTOs, configuration, and mapping. Stored automatically on payment creation. |
| **Abonelik numarası (Subscription Number)** | ✅ Implemented | Added to Subscription entity, DTOs, seed data (`SUB-48291` etc.), and auto-generated on create |
| **Abonelik türü (Type) enum — Electricity, Water etc.** | ✅ Implemented | Added `SubscriptionType` enum (Electricity, Water, Internet, Gsm, Streaming, Music, Software, Health, Education, Other) with string storage, configuration, and seed data. Exposed in API and frontend tables as a badge column. |
| **Hatırlatma Mekanizması / Reminder endpoint** | ✅ Implemented | `POST /api/payment-task/send-reminders` sends email reminders for subscriptions due within 3 days |
| **Bildirim Servisi / Notification Service (Email/SMS)** | ✅ Implemented (SMTP) | `EmailNotificationService` sends real HTML emails via SMTP (configurable in user-secrets). Falls back to console log if SMTP not configured. |
| **ER Diagram** | ✅ Created | See `SYSTEM_DESIGN.md` — Mermaid ER diagram with all entities, relationships, keys, and cascade rules |
| **API Endpoint List (standalone doc)** | ✅ Created | See `SYSTEM_DESIGN.md` — Complete endpoint reference with methods, paths, DTOs, and response formats |
| **Flow Diagram (debt→payment→reminder)** | ✅ Created | See `SYSTEM_DESIGN.md` — Mermaid flowcharts for overdue processing, email reminders, user payment flow, and background scheduler |

### All other requirements are covered:

- ✅ Customers: Create / Read / Delete
- ✅ Subscriptions: Create / Read / Update / Delete
- ✅ Payments: Create / Read
- ✅ Debt Query via mock 3rd party service (returns exact subscription price, not random)
- ✅ Payment Processing via mock service (80% success / 20% fail)
- ✅ At least 2 different mock external services (MockPaymentGateway, MockExternalPaymentService, MockBankMessageHandler, MockNotificationService)
- ✅ Subscription Number on Subscription entity + seed data
- ✅ One Customer → Many Subscriptions → Many Payments (EF Core relationships with cascade delete)
- ✅ RESTful API design (proper HTTP verbs, status codes)
- ✅ Clean Architecture (Domain, Application, Infrastructure, API)
- ✅ .NET 8 + React 18 + TypeScript + Vite
- ✅ SQL Server with EF Core (entity configurations, migrations)
- ✅ Seed data for testing
- ✅ Unit tests (17 backend xUnit + 24 frontend Vitest)
- ✅ Role-Based Access Control (mock auth: Admin/Customer roles, protected routes, conditional navbar)
- ✅ Service Catalog (SubscriptionPlan entity, CRUD API, seed data)
- ✅ Data Isolation (customerId on AuthContext, per-user dashboard)
- ✅ Discover page (plan cards + detail modal with Subscribe button)
- ✅ Admin page (All Users Overview + edit status + delete subscriptions)
- ✅ Discover page with admin catalog management (Create/Delete plans)
- ✅ CI pipeline (GitHub Actions)
- ✅ AI Usage documented in README.md
- ✅ **Yeni:** Google Sign-In (OAuth 2.0 via Google Identity Services + server-side token verification)
- ✅ **Yeni:** SendGrid HTTP API email delivery (works on Railway since SMTP ports are blocked)
- ✅ **Yeni:** Cloudflare Pages deployment (frontend)
- ✅ **Yeni:** Railway deployment with auto-migrate + seed (backend)
- ✅ **Yeni:** Real email sending via SendGrid (`EmailNotificationService`)
- ✅ **Yeni:** Background auto-processing (`ScheduledPaymentService` runs every 6 hours)
- ✅ **Yeni:** Login with password validation (backend auth API + user secrets)
- ✅ **Yeni:** Registration creates real customer in database
- ✅ **Yeni:** Payment Gateway auto-redirects after "Already Paid" (5s timer + manual button)
- ✅ **Yeni:** Admin can change subscription status (Active/Passive) and delete subscriptions
- ✅ **Yeni:** Discover plan detail modal (click card → see full details → subscribe)

---

## Test Credentials

| Role | Email | Password | Customer ID | Notes |
|------|-------|----------|-------------|-------|
| Admin | `admin@test.com` | `admin123` | — | Full system access (hardcoded in frontend) |
| Customer 1 (John Doe) | `john.doe@email.com` | `password123` | 1 | Has Netflix & Spotify subscriptions |
| Customer 2 (Jane Smith) | `jane.smith@email.com` | `password123` | 2 | Has Electricity Bill & Internet subscriptions |
| Customer 3 (Bob Wilson) | `bob.wilson@email.com` | `password123` | 3 | Has Cloud Storage subscription |
| Google User | Any Google account | — | Auto-created | Sign in with Google button on login page |

### Login Tips
- Login now **validates both email and password** — wrong password shows "Invalid email or password."
- Customer ID is now **correctly mapped** per email (no longer always customerId=1)
- New users can **register** via the Register page (creates a new customer in the database)
- **Sign in with Google** — click the Google button on login page, auto-creates account on first login
- **Forgot password** is not implemented — use the passwords above or Google Sign-In

---

## AI Usage

This project was developed entirely with AI assistance. The AI was used for:

- **Code generation** — scaffolding the full solution structure, controllers, services, repositories, frontend components, and test files
- **API design** — suggesting RESTful endpoint structure and Clean Architecture layering
- **Business logic** — implementing the overdue payment processing algorithm, next-date rolling, and skip conditions
- **Testing** — generating xUnit test cases with Moq mocks covering success, failure, skip, and error scenarios
- **Configuration** — EF Core setup, migration commands, Tailwind CSS integration, GitHub Actions CI

All AI-generated output was reviewed, adapted, and verified via build (0 errors, 0 warnings) and test runs (41/41 passing — 17 backend xUnit + 24 frontend Vitest) before inclusion.

---

## Step 18 — Payment History Modal

**Prompt:** Add payment history view per subscription on the Dashboard.

- Created `PaymentHistoryModal` component at `frontend/src/components/PaymentHistoryModal.tsx`
- Added "History" button next to the "Pay" button on every subscription row (both Upcoming Payments and My Subscriptions tables)
- Modal fetches `GET /api/payments/by-subscription/{subscriptionId}` and displays: #, Amount, Date, Period, Status
- Shows "No payments recorded yet" empty state
- Loading spinner while fetching
- Cancel/delete subscriptions also available from Admin panel

---

## Step 19 — Subscription Type Enum

**Prompt:** Add proper `SubscriptionType` enum to match project spec requirement.

### Domain
- `src/Domain/Enums/SubscriptionType.cs` — Electricity, Water, Internet, Gsm, Streaming, Music, Software, Health, Education, Other

### Infrastructure
- Added `SubscriptionType` to `SubscriptionConfiguration` (stored as string, max 50)
- Updated seed data: Netflix → Streaming, Spotify → Music, Electricity Bill → Electricity, Internet → Internet, Cloud Storage → Software

### Application
- Added `SubscriptionType` to `SubscriptionDto`, `CreateSubscriptionDto`, `UpdateSubscriptionDto`
- Updated `MappingProfile` to map `SubscriptionType.ToString()` and parse with fallback to `Other`

### API
- New migration: `AddSubscriptionType`

### Frontend
- Added "Type" badge column (indigo) to Dashboard and Admin tables
- Discover page auto-infers `subscriptionType` from plan category when subscribing

### Tests
- Backend: 17/17 passing (no changes needed — existing mocks auto-handle new field with default)
- Frontend: 24/24 passing

---

## Step 20 — Payment Gateway Card Form

**Prompt:** Enhance payment gateway with realistic card input fields and validation.

- Added **Cardholder Name** text input
- Added **Card Number** input with auto-formatting (groups of 4 digits)
- Added **Luhn algorithm** validation for card number
- Added **Brand detection** (VISA, MC, AMEX) with highlight on matching brand icon
- Added **Expiry Date** input with MM/YY mask and expiration check
- Added **CVV** input (3 digits for VISA/MC, 4 for AMEX)
- All fields have inline validation errors on blur
- Confirm button disabled until all fields are valid

---

## Step 21 — Form Validation Polish

**Prompt:** Add real-time validation and password confirmation to auth forms.

### Login (`Login.tsx`)
- Email format validation (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
- Password minimum length (6 chars)
- Red border + error messages on blur
- Submit button disabled until form is valid

### Register (`Register.tsx`)
- First name / Last name required validation
- Email format validation
- Password minimum length (6 chars)
- **Password confirmation** field with "Passwords do not match" check
- Red border + error messages per field on blur
- Submit button disabled until all fields valid

---

## Step 22 — Google Sign-In (OAuth 2.0)

**Prompt:** Add "Sign in with Google" button and server-side token verification.

### Backend
- Added `Google.Apis.Auth` NuGet package to Application layer
- `POST /api/auth/google-login` — accepts Google ID token
- `GoogleLoginRequestDto` — DTO for the ID token
- `AuthService.GoogleLoginAsync()` — verifies token via `GoogleJsonWebSignature.ValidateAsync()`
  - If email exists → returns existing customer
  - If new email → auto-creates a Customer (random password, Google-authenticated accounts can't use email/password)
- Configured via `GOOGLE_CLIENT_ID` environment variable (or `GoogleAuth:ClientId` config)
- Reads sender name from Google payload and splits into First/Last name

### Frontend
- Installed `@react-oauth/google` package
- `main.tsx` — wrapped app with `<GoogleOAuthProvider>`
- `AuthContext.tsx` — added `loginWithGoogle(idToken)` method
- `Login.tsx` — added "Sign in with Google" button with "or" divider
- `api.ts` — added `auth.googleLogin({ idToken })` API call
- Configured via `VITE_GOOGLE_CLIENT_ID` environment variable

### Documentation
- `googleSignIn.md` — complete step-by-step guide:
  - Google Cloud Console project setup
  - OAuth consent screen configuration
  - Creating OAuth 2.0 credentials
  - Adding env vars to Railway + Cloudflare
  - Troubleshooting table

---

## Step 23 — SendGrid Email Integration (Replace SMTP)

**Prompt:** Replace SMTP email sending with SendGrid HTTP API (Railway blocks SMTP ports).

### Problem
Railway blocks outbound SMTP ports (587, 465). `SmtpClient` connection failed with `"Failure sending mail"` at `SmtpConnection.ConnectAndHandshakeAsyncResult`.

### Solution
Replaced `System.Net.Mail.SmtpClient` with SendGrid's HTTP API:
- Uses `HttpClient` to POST to `https://api.sendgrid.com/v3/mail/send` (port 443 — always open)
- No additional NuGet packages (uses built-in `System.Net.Http.Json`)
- Sends HTML emails inline (no MailMessage/SmtpClient dependency)
- Same fallback to console logging if SendGrid key is missing
- Both `SendStatusChangeEmailAsync` and `SendReminderEmailAsync` updated

### Configuration
- Replaced SMTP vars with `EmailSettings:SendGridApiKey`
- Minimum required: `SendGridApiKey` + `SenderEmail` + `SenderName`
- Saved locally in `appsettings.Development.json` (gitignored)
- Railway env var: `EmailSettings__SendGridApiKey`

---

## Step 24 — Deployment Configuration (Railway + Cloudflare)

**Prompt:** Deploy backend to Railway (.NET + PostgreSQL) and frontend to Cloudflare Pages.

### Backend (Railway)
- PostgreSQL database provisioned (with DATABASE_URL)
- Auto-migration on startup via `db.Database.MigrateAsync()`
- Seed data (3 customers, 4 plans, 5 subscriptions) inserted automatically
- CORS configured for all origins
- `PORT` env var set to 8080 (internal)
- Railway exposes on standard HTTPS (443) via `*.up.railway.app`

### Frontend (Cloudflare Pages)
- Build: `cd frontend && npm install && npm run build`
- Output: `frontend/dist`
- `VITE_API_URL` points to Railway backend URL
- `VITE_GOOGLE_CLIENT_ID` for Google Sign-In

### Environment Variables

| Service | Variable | Source |
|---------|----------|--------|
| Railway | `DATABASE_URL` | Auto (PostgreSQL add-on) |
| Railway | `PORT` | Set to `8080` |
| Railway | `ASPNETCORE_ENVIRONMENT` | `Production` |
| Railway | `GOOGLE_CLIENT_ID` | Google Cloud Console |
| Railway | `EmailSettings__SendGridApiKey` | SendGrid |
| Railway | `EmailSettings__SenderEmail` | Gmail address |
| Railway | `EmailSettings__SenderName` | `HalalBank` |
| Cloudflare | `VITE_API_URL` | Railway public URL + `/api` |
| Cloudflare | `VITE_GOOGLE_CLIENT_ID` | Google Cloud Console |

### Documentation
- `howTOPublishCloudFlare.md` — full deployment guide (architecture, step-by-step, troubleshooting)

---

## Step 25 — Admin Subscription Management Fix

**Prompt:** Admin can now change subscription status and emails are sent via SendGrid.

- Admin panel status change now triggers `SendStatusChangeEmailAsync`
- SendGrid integration fixed: verified sender email in SendGrid dashboard
- 403 error resolved (sender verification required)
- Real email delivery confirmed: `✅ REAL STATUS CHANGE EMAIL SENT to drtoxak@gmail.com for subscription Netflix`

---

## Step 26 — Phase 1: Backend Security — BCrypt Password Hashing

**Prompt:** Hash all passwords with BCrypt before storing.

- Added `BCrypt.Net-Next` NuGet package (v4.2.0) to Application layer
- `AuthService.RegisterAsync` — hashes password with `BCrypt.HashPassword()` before saving
- `AuthService.LoginAsync` — verifies password with `BCrypt.Verify()`
- `AuthService.GoogleLoginAsync` — generates random BCrypt hash for auto-created Google users
- `AuthService.ForgotPasswordAsync` — generates temp password, hashes it, updates DB
- All existing seed data updated to use BCrypt hashes (migration `AddCustomerRole`)
- Raw SQL admin seed in `Program.cs` uses `BCrypt.Net.BCrypt.HashPassword("admin123")`

---

## Step 27 — Phase 1: Backend Security — JWT Token Generation & Login

**Prompt:** Generate JWT Bearer tokens on successful login.

### JwtService (`src/API/Services/JwtService.cs`)
- New service: `GenerateToken(userId, email, role)` — creates JWT with claims:
  - `ClaimTypes.NameIdentifier` — user ID
  - `ClaimTypes.Email` — email
  - `ClaimTypes.Role` — role (Admin/Customer)
- HMAC-SHA256 signing, 7-day expiry
- Reads key from `Jwt:Key` config or `JWT_KEY` env var (fallback: hardcoded dev key)

### AuthController + AuthService Changes
- `POST /api/auth/login` — now returns `{ ..., token: "eyJ..." }` alongside user data
- `POST /api/auth/register` — returns token for immediate login
- `POST /api/auth/google-login` — returns token

### Program.cs Middleware
- `AddAuthentication(JwtBearerDefaults.AuthenticationScheme)` configured
- `TokenValidationParameters` — validates issuer, audience, lifetime, signing key
- `AddAuthorization()` registered

---

## Step 28 — Phase 1: Backend Security — [Authorize] Attributes

**Prompt:** Protect all API controllers with `[Authorize]` attributes.

### Controllers Updated
| Controller | Attribute | Notes |
|------------|-----------|-------|
| `CustomersController` | `[Authorize(Roles = "Admin")]` | Only admin can manage all customers |
| `SubscriptionsController` | `[Authorize]` with role checks in methods | GET (admin: all, customer: own) |
| `PaymentsController` | `[Authorize]` | All authenticated users |
| `SubscriptionPlansController` | `[Authorize]` | GET all users, POST/PUT/DELETE admin |
| `DashboardController` | `[Authorize]` | Any authenticated user |
| `PaymentTaskController` | `[Authorize(Roles = "Admin")]` | Admin only |

### Role-Based Data Isolation
- `SubscriptionsController.GetByCustomerId` — customer can only access their own subscriptions (via JWT `nameIdentifier` claim)
- Non-admin users blocked from listing all subscriptions
- `SubscriptionsController` — `CreateSubscription` method: customer-scoped

---

## Step 29 — Phase 2: Admin Seed User

**Prompt:** Seed admin user in database with proper BCrypt hash.

- Admin user (`admin@test.com` / `admin123`, Role = "Admin", Id = 4) seeded in `Program.cs` runtime seed
- Uses raw SQL with `ON CONFLICT ("Id") DO UPDATE SET` to ensure password always correct
- Fix applied: changed from `DO NOTHING` to `DO UPDATE SET` to handle existing admin with bad hash

---

## Step 30 — Phase 3: Admin Can Create Subscriptions for Any Customer

**Prompt:** Admin page UI to create subscriptions for any customer.

### Backend
- `SubscriptionsController.Create` allows admin to specify any `customerId`
- Customer-scoped validation only applies to non-admin users

### Frontend
- Admin page enhanced with subscription creation capability
- Customer dropdown to select which user gets the subscription
- Inline form for provider name, category, price, billing cycle, next payment date

---

## Step 31 — Phase 4: Search/Filter on Subscription Tables

**Prompt:** Add search/filter capability to subscription tables.

### Frontend
- Dashboard: filter input on "My Subscriptions" table
- Filters by: provider name, category, billing cycle, status (case-insensitive)
- Admin page: search/filter on all subscriptions view (Phase 4 requirement)

---

## Step 32 — Phase 5: Health Check Endpoint

**Prompt:** Create a health check endpoint for monitoring.

- `GET /api/health` endpoint added
- Returns `{ "status": "Healthy", "timestamp": "2026-05-12T..." }`
- No authentication required

---

## Step 33 — Phase 6: Update Tests for New Auth Flow

**Prompt:** Update all tests to work with new authentication flow.

### Backend Tests (19 passing)
- Existing `PaymentTaskServiceTests` (6) — no changes needed (mocks don't use auth)
- `PaymentServiceTests` (4) — no changes needed
- `SubscriptionServiceTests` (4) — added 2 new tests for status change email triggers
- `ReminderTaskTests` (3) — no changes needed
- `MockNotificationServiceTests` (2) — no changes needed

### Frontend Tests (24 passing)
- `AuthContext.test.tsx` (6) — updated mocks to return `token` field
- `Discover.test.tsx` (15) — role-based assertions for Customer vs Admin
- `Admin.test.tsx` (3) — subscription table rendering

---

## Step 34 — Toast Notification System & Confirmation Dialogs

**Prompt:** Add toast notifications and confirmation dialogs.

### ToastContext (`frontend/src/contexts/ToastContext.tsx`)
- Global toast provider with `addToast(message, type)` where type = `success` | `error`
- Auto-dismiss after 3 seconds with slide-out animation
- Colored: green (success), red (error)

### ConfirmDialog (`frontend/src/components/ConfirmDialog.tsx`)
- Reusable modal: title, message, confirm/cancel buttons
- Used on admin panel for delete/status change actions

---

## Step 35 — Loading Skeletons & UI Polish

**Prompt:** Add loading skeletons and responsive design improvements.

### SkeletonTable (`frontend/src/components/Skeleton.tsx`)
- Configurable rows/cols for table loading state
- Pulse animation mimicking table layout

### Applied to:
- Dashboard: cards + table skeleton while fetching
- Admin page: skeleton while loading subscriptions
- Discover page: skeleton while loading plans

### Responsive Design
- All pages responsive (mobile-first)
- Tables horizontally scrollable on small screens
- Navbar collapses gracefully
- Cards grid: 1 col (mobile) → 2 col (tablet) → 4 col (desktop)

---

## Step 36 — Structured Logging (Serilog)

**Prompt:** Add structured logging with Serilog for application monitoring.

### Program.cs Configuration
```csharp
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File("api.log", rollingInterval: RollingInterval.Day)
    .CreateLogger();
```
- Serilog replaces default `ILogger<T>` throughout the application
- Console + rolling file sinks
- Timestamps, log levels, structured properties

---

## Step 37 — Application Performance Monitoring & Error Tracking

**Prompt:** Add Sentry for error tracking and performance monitoring.

### Sentry Integration
- `Sentry` NuGet package added to API project
- Configured in `Program.cs`:
  ```csharp
  builder.WebHost.UseSentry(options => {
      options.Dsn = sentryDsn;
      options.TracesSampleRate = 1.0;
  });
  ```
- Captures unhandled exceptions automatically
- Performance tracing for HTTP requests
- DSN from `SENTRY_DSN` environment variable

### ExceptionHandlingMiddleware Enhancement
- Existing middleware catches: `KeyNotFoundException` (404), `InvalidOperationException` (400), generic (500)
- Works alongside Sentry for complete error coverage

---

## Step 38 — Email Delivery Monitoring

**Prompt:** Add email delivery monitoring with SendGrid event tracking.

### SendGrid Delivery Tracking
- `EmailNotificationService` logs delivery status for every sent email
- Unique message IDs tracked per email
- Console logging with SendGrid API response codes
- `INotificationService` interface updated to return delivery metadata

---

## Step 39 — Admin Sign-In Credential Fix

**Prompt:** Fix admin login — admin@test.com / admin123 was returning "Invalid email or password".

### Root Cause
The admin seed SQL used `ON CONFLICT ("Id") DO NOTHING`. If the admin was previously seeded with a bad/incompatible password hash (e.g., from an earlier code version), the conflict clause silently prevented updating it with the correct hash.

### Fix (`src/API/Program.cs:118-129`)
- Removed the `if (!db.Customers.Any(c => c.Email == "admin@test.com"))` guard
- Changed `ON CONFLICT ("Id") DO NOTHING` to `ON CONFLICT ("Id") DO UPDATE SET`
- Now always upserts the admin user with current BCrypt hash of "admin123"
- Password, email, role, and name are all refreshed on every app start

---

## Final Test Results

| Suite | Tests | Status |
|-------|-------|--------|
| Backend (xUnit) | 19/19 | ✅ All passing |
| Frontend (Vitest) | 24/24 | ✅ All passing |
| Backend build | — | 0 errors, 0 warnings |
| Frontend build | — | 0 errors, 0 warnings |

## How to Run Automated Tests

### Backend Tests
```bash
# Prerequisite: .NET 8 SDK installed

# Run all backend unit tests from solution root
dotnet test

# Run with detailed output
dotnet test --verbosity normal

# Run a specific test class
dotnet test --filter "FullyQualifiedName~PaymentTaskServiceTests"

# Run tests matching a trait
dotnet test --filter "Category=Unit"
```

**Test framework:** xUnit + Moq + FluentAssertions  
**Location:** `tests/Application.Tests/`

### Frontend Tests
```bash
# Prerequisite: Node.js 18+ installed

# Navigate to frontend
cd frontend

# Install dependencies (first time only)
npm install

# Run all tests once
npm test

# Run tests in watch mode (re-runs on changes)
npm run test:watch

# Run with UI (interactive browser interface)
npm run test:ui

# Run a specific test file
npx vitest run src/__tests__/AuthContext.test.tsx
```

**Test framework:** Vitest + @testing-library/react + happy-dom  
**Location:** `frontend/src/__tests__/`

### CI Pipeline
GitHub Actions automatically runs both test suites on push/PR to `main`:
```yaml
# .github/workflows/ci.yml
- run: dotnet restore
- run: dotnet build --no-restore
- run: dotnet test --no-build --verbosity normal
# Frontend:
- run: cd frontend && npm ci && npm test
```
