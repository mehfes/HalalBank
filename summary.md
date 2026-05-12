# HalalBank — Interview Summary

> A comprehensive walkthrough of the Subscription & Auto-Payment Reminder System  
> Use this to prepare for interview questions about architecture, design decisions, implementation details, and trade-offs.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture & Design Decisions](#2-architecture--design-decisions)
3. [Terminology Explained](#3-terminology-explained)
4. [How Each Feature Was Implemented](#4-how-each-feature-was-implemented)
5. [How to Add a New Feature (Pattern)](#5-how-to-add-a-new-feature-pattern)
6. [Potential Interview Questions & Answers](#6-potential-interview-questions--answers)
7. [Key Technical Decisions & Trade-offs](#7-key-technical-decisions--trade-offs)

---

## 1. Project Overview

### What is HalalBank?

A **subscription management & auto-payment reminder system** built as a case study. Think of it as a simplified banking dashboard where users can:

- Register subscriptions (Netflix, electricity bill, gym, etc.)
- Query debt from mock third-party services
- Pay subscriptions with mock payment processing
- Receive email reminders for upcoming payments
- Admins can manage all users and subscriptions

### Tech Stack at a Glance

| Layer | Technology | Why |
|-------|-----------|-----|
| **Backend** | C# .NET 8 Web API | Requirement — modern, fast, cross-platform |
| **Architecture** | Clean Architecture (DDD-style) | Separation of concerns, testability, industry standard |
| **Frontend** | React 18 + TypeScript + Vite + Tailwind v4 | Requirement — modern SPA, type-safe, fast build |
| **Database** | PostgreSQL (on Railway) | Requirement (PostgreSQL variant), hosted on Railway |
| **ORM** | Entity Framework Core 8 | Standard .NET ORM, migrations, LINQ |
| **Auth** | BCrypt + JWT + Google OAuth | Password hashing, stateless tokens, Google Sign-In |
| **Email** | SendGrid HTTP API | Works on Railway (SMTP blocked), real email delivery |
| **Testing** | xUnit + Moq + FluentAssertions + Vitest | Unit testing both layers |
| **CI/CD** | GitHub Actions + Railway + Cloudflare Pages | Automated deploy pipeline |

---

## 2. Architecture & Design Decisions

### 2.1 Why Monolith, Not Microservices?

**Common interview trap:** Having many controllers (Customers, Subscriptions, Payments, Auth, Plans) does NOT make this a microservice.

**Monolith =** Single process, single deployable artifact (one DLL), shared database.

```
┌─────────────────────────────────────────────────────┐
│  One Process :5000                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │Customers │ │Subscrib. │ │Payments  │ │Auth    │ │
│  │Controller│ │Controller│ │Controller│ │Controll│ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
│  ┌─────────────────────────────────────────────────┐ │
│  │           Shared Database (PostgreSQL)           │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Microservices would require:** Separate processes, separate databases, network communication between services, independent deployment pipelines, distributed transaction handling.

**Why monolith was the right choice here:**
- Focused domain scope (subscription management only)
- No need for independent scaling of sub-domains
- Easier to develop, debug, test, and deploy
- Clean Architecture already provides logical separation — if the system grows, extracting a service is straightforward
- Avoids distributed transaction complexity (no need for Saga patterns, event buses, etc.)

### 2.2 Why Clean Architecture (4 Layers)?

```
┌─────────────────────────────────────────────────────────┐
│  API Layer (Presentation)                                 │
│  Controllers · Middleware · JwtService · Program.cs      │
│  Depends on: Application, Infrastructure                 │
├─────────────────────────────────────────────────────────┤
│  Application Layer (Business Logic)                       │
│  Services · DTOs · Mappers · Interfaces                  │
│  Depends on: Domain                                      │
├─────────────────────────────────────────────────────────┤
│  Infrastructure Layer (Data Access + External Services)   │
│  EF Core DbContext · Repositories · SendGrid · Mock APIs │
│  Depends on: Application, Domain                         │
├─────────────────────────────────────────────────────────┤
│  Domain Layer (Core Entities)                             │
│  Entities · Enums · Repository Interfaces                │
│  Depends on: Nothing (no external dependencies)          │
└─────────────────────────────────────────────────────────┘
```

**Dependency rule:** Inner layers know nothing about outer layers. Domain doesn't even know EF Core exists. This means:
- You could swap EF Core for Dapper or raw ADO.NET without touching Domain or Application
- You could swap PostgreSQL for SQL Server by changing only Infrastructure
- Unit tests mock the interfaces, not the database

### 2.3 Why Two-Tier (Not Three-Tier)?

```
Two-Tier:  [React SPA] ←→ [API + Database]
Three-Tier: [React SPA] ←→ [API Server] ←→ [Database Server]
```

HalalBank is **two-tier** because:
- **Client tier:** React SPA (runs in browser on Cloudflare Pages)
- **Server tier:** .NET API + PostgreSQL (both on Railway, in the same project)

In a strict three-tier architecture, the API server and database would be on separate machines. Here they're on the same Railway project (same region), so it's functionally two-tier. The database is a separate managed service (Railway PostgreSQL add-on), so you could argue it's 2.5-tier. Not important for interview — what matters is you understand the distinction.

### 2.4 Why SPA with Multi-Page Routing?

**Not a contradiction.** The frontend is a React SPA (single JavaScript bundle downloaded once) with **client-side routing** via `react-router-dom`. It has multiple distinct routes:

| Route | Page | Description |
|-------|------|-------------|
| `/login` | Login | Email/password + Google Sign-In |
| `/register` | Register | Create new account |
| `/dashboard` | Dashboard | User's subscriptions, upcoming payments |
| `/discover` | Discover | Browse plans, subscribe (customer) or manage catalog (admin) |
| `/admin` | Admin | Full subscription management (admin only) |
| `/payment-gateway/:id` | Payment Gateway | Card form with Luhn validation |

**Why not a traditional multi-page app (MPA)?** SPAs provide faster navigation after initial load, smoother UX, and the backend only serves JSON (not HTML). The trade-off is worse initial SEO (not relevant for a bank-like app).

### 2.5 Why REST (Not GraphQL/gRPC)?

- **REST** is simpler, cacheable, and stateless — perfect for a CRUD-heavy app like this
- **GraphQL** would be overkill (no complex nested data queries needed)
- **gRPC** is designed for high-performance internal service-to-service communication, not browser-to-API (requires gRPC-Web proxy)

---

## 3. Terminology Explained

### 3.1 Monolithic vs Microservice Architecture

| Monolithic | Microservice |
|------------|-------------|
| Single codebase, single deployable | Multiple services, each deployable independently |
| Shared database | Each service has its own database |
| Simpler development, debugging, testing | Complex orchestration, distributed transactions |
| Better for small-medium domains | Better for large, independently scalable domains |

**Interview answer:** "HalalBank is a monolith because all functionality (auth, customers, subscriptions, payments, plans) runs in a single .NET process with a shared PostgreSQL database. The Clean Architecture layers are logical separations within the same process, not physical service boundaries. If this grew to need independent scaling of payment processing, we could extract `PaymentTaskService` into a separate worker service communicating via a message queue."

### 3.2 Mock APIs (Third-Party Service Simulation)

**What:** Services that simulate real external APIs during development/testing.

**Why:** You can't call a real bank API during development. Mock services return realistic responses without actual side effects.

**In HalalBank, we have 3 mock services:**

| Mock Service | What It Does | How It Works |
|-------------|-------------|--------------|
| `MockPaymentGateway` | Direct payment processing | No HTTP — just returns `success: true` if amount > 0 |
| `MockExternalPaymentService` | Debt query + payment via HTTP | Uses `IHttpClientFactory` + `MockBankMessageHandler` — simulates 1s network delay, 80% success / 20% failure |
| `MockBankMessageHandler` | Custom HTTP handler | Intercepts HTTP calls to `http://mockbank.local`, parses subscription price from URL path, generates random transaction IDs |

**Why two payment mocks?** The requirement was "at least 2 different third-party REST service interactions." We have:
1. **Debt query service** (`CheckDebtAsync`) — returns exact subscription price
2. **Payment processing service** (`ProcessPaymentAsync`) — 80% success / 20% fail
3. Email notification service (optional but implemented with real SendGrid)

### 3.3 JWT (JSON Web Token)

**What:** A stateless token containing JSON claims (userId, email, role), cryptographically signed.

**How it works in HalalBank:**
```
Login → Backend validates password → creates JWT with claims:
  { nameIdentifier: 4, email: "admin@test.com", role: "Admin" }
  → signed with HMAC-SHA256 → "eyJhbGciOiJIUzI1NiIs..."

Every subsequent request → Frontend sends:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

Backend validates signature + expiry → populates HttpContext.User
  → [Authorize(Roles = "Admin")] checks the role claim
```

**Why JWT over session cookies?**
- Stateless — no server-side session storage needed
- Decoupled — frontend and backend can be on different domains (Cloudflare + Railway)
- Mobile-friendly — works with mobile apps without cookie management
- Self-contained — user identity is in the token itself

### 3.4 BCrypt Password Hashing

**Why not MD5/SHA256?** Those are fast — designed for checksums, not passwords. BCrypt is deliberately slow and includes a random salt.

```
BCrypt.HashPassword("admin123") 
→ "$2a$11$XUpNUQrDg84IpI9Fdrd3.uTBHDpCy2Og/Eaf4396yew/kQZKC7toS"

This hash contains:
  $2a  → algorithm version
  $11  → cost factor (2^11 iterations = ~100ms per hash)
  salt (22 chars) + hash (31 chars)
```

BCrypt.Verify extracts the salt from the stored hash, re-hashes the input, and compares. This means two hashes of the same password look completely different (due to random salt).

### 3.5 Entity Framework Core Migrations

**What:** Version control for database schema. Each migration is a C# class that describes schema changes (create table, add column, seed data).

**Workflow:**
```bash
dotnet ef migrations add AddCustomerRole    # Creates migration file
dotnet ef database update                    # Applies to database
# OR (in HalalBank):
db.Database.MigrateAsync()  # Auto-applies on startup
```

**Seed data** (HasData): Data that gets inserted during migration — customers 1-3, subscription plans, and subscriptions.

**Runtime seed** (Program.cs): Additional seed logic that runs after migrations — admin user creation with upsert logic.

### 3.6 CORS (Cross-Origin Resource Sharing)

**Why needed:** Frontend (Cloudflare Pages at `halalbank.pages.dev`) and Backend (Railway at `halalbank-api.up.railway.app`) are on different origins. Browsers block cross-origin requests by default.

**How HalalBank handles it:**
```csharp
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});
```

For a production app, you'd restrict to specific origins. For a case study, AllowAnyOrigin is acceptable.

---

## 4. How Each Feature Was Implemented

### 4.1 Authentication (Login + JWT + BCrypt)

**Files involved:**
- `src/Application/Services/AuthService.cs` — LoginAsync, RegisterAsync, GoogleLoginAsync, ForgotPasswordAsync
- `src/API/Controllers/AuthController.cs` — HTTP endpoints
- `src/API/Services/JwtService.cs` — Token generation
- `src/API/Program.cs` — JWT middleware configuration
- `frontend/src/contexts/AuthContext.tsx` — login/logout state management
- `frontend/src/pages/Login.tsx` — Login UI

**Flow:**
```
1. User enters email + password → clicks Sign In
2. Frontend validates (email regex, password >= 6 chars)
3. POST /api/auth/login { email, password }
4. Backend looks up user by email → if null: "Invalid email or password"
5. BCrypt.Verify(password, storedHash) → if false: "Invalid email or password"
6. JwtService.GenerateToken(userId, email, role) → returns JWT
7. Response: { id, email, firstName, lastName, role, token }
8. Frontend stores user + token in localStorage → navigates to /dashboard
9. Every subsequent API call: Authorization: Bearer {token}
```

### 4.2 Google Sign-In (OAuth 2.0)

**How it was added:**

1. **Backend:** Added `Google.Apis.Auth` NuGet package. Created `POST /api/auth/google-login` endpoint that accepts an `idToken`. Uses `GoogleJsonWebSignature.ValidateAsync()` to verify the token server-side. If email exists → login. If new → auto-create customer.

2. **Frontend:** Installed `@react-oauth/google`. Wrapped app with `<GoogleOAuthProvider>`. Added Google Sign-In button on login page. On success, sends the credential (ID token) to backend.

3. **Configuration:** `GOOGLE_CLIENT_ID` env var on both Railway (backend) and Cloudflare (frontend). Created OAuth credentials in Google Cloud Console with authorized JavaScript origins for both `localhost` and production URL.

**Security note:** The ID token is verified server-side, not just client-side. This prevents someone from forging a login by calling the API directly with a fake token.

### 4.3 Role-Based Access Control (Admin vs Customer)

**How it was implemented:**

**Backend:**
- `Customer.Role` column — `"Admin"` or `"Customer"` (string)
- JWT includes `ClaimTypes.Role` claim
- `[Authorize(Roles = "Admin")]` on admin-only controllers (Customers, PaymentTask)
- `[Authorize]` on user-facing controllers with role checks in methods

**Frontend:**
- `AuthContext.user.role` — set from API response
- `AdminRoute` component — wraps `/admin` route, redirects non-admin to `/dashboard`
- Navbar — "Admin" link only renders when `user.role === 'Admin'`
- Discover page — conditional rendering: Customer sees "Subscribe", Admin sees "Delete" + "Create New Plan"

**Data isolation:** Customers can only see their own subscriptions. Admin sees all subscriptions across all users. This is enforced both on the backend (by checking JWT `nameIdentifier` claim) and frontend (by passing `customerId` from AuthContext).

### 4.4 Subscription Management (CRUD + Search/Filter)

**How search/filter was added:**
```tsx
// Dashboard.tsx — client-side filtering
const [subSearch, setSubSearch] = useState('')
const filteredSubs = subSearch
  ? subscriptions.filter(s =>
      s.providerName.toLowerCase().includes(subSearch.toLowerCase()) ||
      s.category.toLowerCase().includes(subSearch.toLowerCase()) ||
      s.billingCycle.toLowerCase().includes(subSearch.toLowerCase()) ||
      s.status.toLowerCase().includes(subSearch.toLowerCase())
    )
  : subscriptions
```

**Why client-side filtering?** The subscription data per user is small (typically < 20 items). Server-side filtering would add complexity (query parameters, SQL WHERE clauses) with no benefit at this scale. If a user had thousands of subscriptions, we'd move filtering to the database.

### 4.5 Payment Processing & Debt Query

**The "Payment Period" concept (critical for interview):**

Each subscription has a `NextPaymentDate`. When a payment succeeds:
1. A `Payment` record is created with `Period = "YYYY MM"` (e.g., "2026 05")
2. The subscription's `NextPaymentDate` is rolled forward (+1 month for monthly, +1 year for yearly)
3. Double-payment prevention: If a successful payment already exists for the current period (`NextPaymentDate`'s `YYYY MM`), `QueryDebtAsync` returns `amount: 0`

**Why this matters:** A subscription is created once. Each month, the user checks debt → pays → payment recorded with period → next payment date rolls. The subscription entity itself doesn't change — it's the payment history that grows.

### 4.6 Background Payment Processing (ScheduledPaymentService)

**What:** A `BackgroundService` that runs every 6 hours.
**How:**
```
Every 6 hours:
1. Query ALL Active subscriptions where NextPaymentDate ≤ UtcNow
2. For each: query debt → if debt > 0, process payment
3. If payment succeeds: create Payment record, roll NextPaymentDate
4. Send email reminders for subscriptions due within 3 days
```

**Why in-process?** No external job scheduler (Hangfire, Quartz) needed for this scale. The service runs inside the same ASP.NET process. For production, you'd extract this to avoid blocking app shutdown or competing with HTTP requests for resources.

### 4.7 Payment Gateway UI (Card Form with Luhn Validation)

**Route:** `/payment-gateway/:subscriptionId`

**Features:**
- Cardholder name input
- Card number with auto-formatting (groups of 4 digits)
- Luhn algorithm validation (mod 10 check)
- Brand detection (VISA starts with 4, MC starts with 5, AMEX starts with 34/37)
- Expiry date with MM/YY mask and expiration check
- CVV (3 digits for VISA/MC, 4 for AMEX)
- All fields validate on blur with inline error messages

**How Luhn validation works:**
```
1. From right to left, double every second digit
2. If doubling produces > 9, subtract 9
3. Sum all digits
4. If total % 10 == 0 → valid card number
```

### 4.8 Email Integration (SendGrid)

**Why not SMTP?** Railway blocks outbound SMTP ports (587, 465). SendGrid HTTP API uses port 443 (HTTPS) which is always open.

**How it works:**
```csharp
// Instead of SmtpClient (blocked on Railway), use HttpClient:
var payload = new {
    personalizations = new[] { new { to = new[] { new { email } }, subject } },
    from = new { email = senderEmail, name = senderName },
    content = new[] { new { type = "text/html", value = body } }
};
await _httpClient.PostAsJsonAsync("https://api.sendgrid.com/v3/mail/send", payload);
```

**Fallback:** If SendGrid API key is missing, logs to console instead of sending.

---

## 5. How to Add a New Feature (Pattern)

This is a common interview question: "How would you add X to this project?"

### 5.1 Adding a New Entity (e.g., "Categories")

**Step-by-step:**

1. **Domain layer** — Create `Category.cs` entity + `ICategoryRepository.cs` interface
2. **Infrastructure layer** — Create `CategoryConfiguration.cs` (Fluent API) + `CategoryRepository.cs` + add to `AppDbContext` and `UnitOfWork`
3. **Application layer** — Create `CategoryDto.cs`, `CreateCategoryDto.cs`, update `MappingProfile.cs`, create `ICategoryService.cs` + `CategoryService.cs`
4. **API layer** — Create `CategoriesController.cs` with CRUD endpoints, register in `Program.cs`
5. **Create migration:** `dotnet ef migrations add AddCategories`
6. **Frontend** — Add API methods in `api.ts`, create React component, add route in `App.tsx`

**The pattern is always:** Domain → Infrastructure → Application → API → Frontend

### 5.2 Adding a New API Endpoint (e.g., Export Subscriptions as CSV)

**Backend only:**
1. Add method to `ISubscriptionService` + `SubscriptionService`
2. Add action in `SubscriptionsController`
3. Register in `Program.cs` if new service

**Example:**
```csharp
// SubscriptionsController.cs
[HttpGet("export-csv")]
[Authorize(Roles = "Admin")]
public async Task<IActionResult> ExportCsv()
{
    var csv = await _subscriptionService.ExportCsvAsync();
    return File(Encoding.UTF8.GetBytes(csv), "text/csv", "subscriptions.csv");
}
```

### 5.3 Adding a Third-Party Integration (e.g., Slack Notifications)

1. Create `ISlackNotificationService` interface in Application layer
2. Implement `SlackNotificationService` in Infrastructure layer using `HttpClient`
3. Register: `builder.Services.AddScoped<ISlackNotificationService, SlackNotificationService>()`
4. Inject into any service that needs it
5. Add environment variable for webhook URL

---

## 6. Potential Interview Questions & Answers

### Q: "Why did you choose PostgreSQL over SQL Server?"

The requirement allowed PostgreSQL. I chose PostgreSQL because:
- **Railway offers it as a managed add-on** — zero-config deployment, auto-backups
- **It's free** on Railway's free tier
- **EF Core + Npgsql** provides full migration support, just like SQL Server
- **JSON support** (PostgreSQL has native JSON, though we didn't use it here)

If the requirement had specified SQL Server, I would have used `UseSqlServer()` instead of `UseNpgsql()` — only the Infrastructure layer changes.

### Q: "How do you prevent double payments?"

In `PaymentService.PayAsync`:
1. Get subscription by ID
2. Calculate current period: `NextPaymentDate.ToString("yyyy MM")`
3. Check if any successful Payment exists for this subscription + period
4. If exists → throw `InvalidOperationException("Already paid for this period.")`
5. If not → proceed with payment

On the frontend, `PaymentGateway.tsx` calls `query-debt` first. If debt returns `amount: 0`, it shows "Already Paid" and auto-redirects.

### Q: "How does the debt query work?"

`PaymentService.QueryDebtAsync`:
1. Query subscription by ID
2. If not found → throw `KeyNotFoundException`
3. Check if already paid for current period (NextPaymentDate's YYYY MM)
4. If paid → return `{ amount: 0, ... }`
5. If not paid → return `{ amount: subscription.Price, ... }`

The amount is always the **exact subscription price** from the database — no random generation.

### Q: "How are tests structured? What do they test?"

**Backend (xUnit + Moq):** Services are tested with mocked repositories and external services. Each test follows Arrange-Act-Assert pattern with FluentAssertions.

Example test pattern:
```csharp
[Fact]
public async Task ProcessOverdueSubscriptionsAsync_WhenDebtExistsAndPaymentSucceeds_ShouldCreatePaymentAndRollNextDate()
{
    // Arrange
    var mockRepo = new Mock<ISubscriptionRepository>();
    mockRepo.Setup(r => r.GetOverdueAsync()).ReturnsAsync(overdueSubs);
    // ... setup other mocks

    var service = new PaymentTaskService(mockUnitOfWork.Object, mockPaymentService.Object);

    // Act
    var result = await service.ProcessOverdueSubscriptionsAsync();

    // Assert
    result.PaidCount.Should().Be(1);
    result.CheckedCount.Should().Be(1);
}
```

**Frontend (Vitest):** Components and context are tested with mocked API responses. Tests cover role-based rendering, API call behavior, and localStorage persistence.

### Q: "What would you improve if you had more time?"

1. **Integration tests** — Currently we have unit tests only. Integration tests with `TestContainers` (a real PostgreSQL in Docker) would catch database-level issues.
2. **Rate limiting** — Auth endpoints should be rate-limited to prevent brute force attacks.
3. **Refresh token rotation** — JWT has 7-day expiry. A refresh token flow would allow seamless re-authentication without re-entering password.
4. **Email queue** — Currently sends synchronously. A background queue (in-memory or RabbitMQ) would prevent email delays from blocking API responses.
5. **Pagination** — Admin's "all subscriptions" endpoint returns everything. Adding skip/take pagination would be necessary at scale.
6. **Dark mode** — The UI has no dark mode toggle, which would improve UX.

### Q: "How does the background service work in a monolith?"

`ScheduledPaymentService` extends `BackgroundService`:
```csharp
protected override async Task ExecuteAsync(CancellationToken stoppingToken)
{
    while (!stoppingToken.IsCancellationRequested)
    {
        using (var scope = _serviceScopeFactory.CreateScope())
        {
            var taskService = scope.ServiceProvider.GetRequiredService<IPaymentTaskService>();
            await taskService.ProcessOverdueSubscriptionsAsync();
            await taskService.SendRemindersAsync();
        }
        await Task.Delay(TimeSpan.FromHours(6), stoppingToken);
    }
}
```

It creates a DI scope (because scoped services can't be injected into singletons directly). Runs every 6 hours. The `using (var scope)` pattern ensures proper disposal of DbContext after each run.

### Q: "How is data isolated between customers?"

**Backend enforcement:**
```csharp
// SubscriptionsController.cs
[HttpGet("by-customer/{customerId}")]
public async Task<IActionResult> GetByCustomerId(int customerId)
{
    var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
    var role = User.FindFirstValue(ClaimTypes.Role);

    if (role != "Admin" && userId != customerId)
        return Forbid();  // Customer can only see own subscriptions

    var subs = await _subscriptionService.GetByCustomerIdAsync(customerId);
    return Ok(subs);
}
```

**Frontend enforcement:**
- AuthContext stores `customerId`
- Dashboard calls `api.subscriptions.getByCustomerId(user.customerId)`
- AdminRoute redirects non-admin users away from `/admin`

### Q: "How did you handle the subscription rollover (next payment date)?"

After a successful payment:
```csharp
if (subscription.BillingCycle == "Monthly")
    subscription.NextPaymentDate = subscription.NextPaymentDate.AddMonths(1);
else if (subscription.BillingCycle == "Yearly")
    subscription.NextPaymentDate = subscription.NextPaymentDate.AddYears(1);
```

This means the subscription entity itself doesn't change — only its `NextPaymentDate` advances. The payment history records each payment with its period (`YYYY MM` format).

### Q: "Walk me through the full payment flow from the user's perspective."

1. User logs in → sees Dashboard with subscriptions
2. Clicks "Pay" on Netflix subscription → navigates to `/payment-gateway/1`
3. Page calls `POST /api/payments/query-debt/1` → returns `{ amount: 15.99, dueDate, period }`
4. User fills card details (card number with Luhn validation, expiry, CVV, name)
5. Clicks "Confirm Payment — $15.99" → 2-second spinner (simulated processing)
6. Calls `POST /api/payments/pay { subscriptionId: 1, amount: 15.99 }`
7. Backend checks: not already paid → calls `MockExternalPaymentService.ProcessPaymentAsync(15.99)`
8. 80% chance success → creates Payment record (Status: Success, Period: "2026 05")
9. Rolls NextPaymentDate from 2026-06-10 to 2026-07-10
10. Frontend gets 201 Created → redirects to Dashboard with green toast "Payment completed!"
11. If user tries to pay again for the same period → debt query returns `amount: 0`

---

## 7. Key Technical Decisions & Trade-offs

| Decision | Chosen Approach | Alternative | Why This Won |
|----------|----------------|-------------|--------------|
| **Database** | PostgreSQL | SQL Server | Free on Railway, same EF Core experience |
| **Auth** | JWT + BCrypt | ASP.NET Identity | Lighter weight, stateless, educational value |
| **Frontend framework** | React | Vue, Angular | Industry standard, ecosystem, TypeScript support |
| **CSS** | Tailwind CSS v4 | Bootstrap, CSS Modules | Utility-first, fast prototyping, small bundle |
| **Payment mock** | 2 mocks (direct + HTTP) | Single mock | Meets requirement of 2+ third-party services |
| **Background jobs** | In-process Hosted Service | Hangfire, Quartz | No external dependencies, good enough for this scale |
| **Email** | SendGrid HTTP API | SMTP, MailKit | Works on Railway (port 443), no blocked ports |
| **API design** | REST | GraphQL, gRPC | Simpler, cacheable, matches CRUD requirements |
| **Architecture** | Monolithic | Microservices | Simpler deployment, no distributed complexity |
| **Testing** | Unit tests only | + Integration + E2E | Time constraint, unit tests cover business logic |

---

## Quick Reference: Key Files to Know

| File | Purpose | What to Say in Interview |
|------|---------|------------------------|
| `Program.cs` | App startup, DI, middleware, seed data | "This is the composition root — everything is wired here" |
| `AuthService.cs` | Login validation, BCrypt, Google auth | "This handles all authentication flows" |
| `JwtService.cs` | Token generation | "Creates JWT with userId, email, role claims" |
| `PaymentTaskService.cs` | Automated overdue processing | "Core business logic — checks debt, processes payments, rolls dates" |
| `ScheduledPaymentService.cs` | Background 6-hour cycle | "BackgroundService that runs overdue check + reminders" |
| `ExceptionHandlingMiddleware.cs` | Global error handling | "Catches exceptions and returns consistent JSON error responses" |
| `AppDbContext.cs` | EF Core DbContext | "Configures entities, applies configurations" |
| `AuthContext.tsx` | Frontend auth state | "Manages login/logout, stores JWT in localStorage" |
| `api.ts` | API client | "Single entry point for all backend calls, adds Bearer token header" |
| `Login.tsx` | Login UI | "Email/password form + Google button, form validation" |

---

## Architecture Diagram (Simplified for Whiteboard)

```
[Browser: React SPA]
    ↕ HTTP/JSON + Bearer JWT
[Cloudflare Pages]
    ↕ HTTPS
[Railway: .NET 8 Web API]
    ├── [PostgreSQL (EF Core)]
    ├── [SendGrid (Email)]
    ├── [Mock Payment Service (in-process)]
    └── [Google Auth API (outbound)]
```

**Data flow for a payment:**
```
User → Login → JWT → Dashboard → Click Pay → PaymentGateway → 
  query-debt → show amount → ConfirmPayment → pay → 
  Backend checks debt → processes via MockPaymentService → 
  creates Payment record → rolls NextPaymentDate → 
  returns success → redirects to Dashboard with toast
```

---

*HalalBank — Case Study Summary for Interview Preparation*
*Built with .NET 8 + React + PostgreSQL, May 2026*
