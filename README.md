# HalalBank

Subscription & Auto-Payment Reminder System built with .NET 8 Web API and React.

## Project Setup

### Prerequisites
- .NET 8 SDK
- Node.js 18+
- PostgreSQL (or Docker with PostgreSQL)

### Backend
```bash
cd src/API
dotnet restore
dotnet run
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## Running Automated Tests

### Backend Tests (xUnit + Moq + FluentAssertions)
```bash
# Run all backend tests
dotnet test

# Run with verbose output
dotnet test --verbosity normal

# Run a specific test class
dotnet test --filter "FullyQualifiedName~PaymentTaskServiceTests"
```

**Test count:** 19 tests across 5 files:
| File | Tests | What It Covers |
|------|-------|---------------|
| `PaymentTaskServiceTests.cs` | 6 | Overdue processing: success, failure, skip, error, yearly billing, empty list |
| `PaymentServiceTests.cs` | 4 | Double-payment prevention, debt query, exact price, not-found |
| `SubscriptionServiceTests.cs` | 4 | Number generation, preservation, status change email triggers |
| `ReminderTaskTests.cs` | 3 | 3-day reminder window, empty list, date filtering |
| `MockNotificationServiceTests.cs` | 2 | No throw on send, logs on send |

### Frontend Tests (Vitest + testing-library + happy-dom)
```bash
cd frontend
npm test          # run once
npm run test:ui   # interactive UI mode
```

**Test count:** 24 tests across 3 files:
| File | Tests | What It Covers |
|------|-------|---------------|
| `AuthContext.test.tsx` | 6 | Login/logout, role detection, localStorage persistence |
| `Discover.test.tsx` | 15 | Customer: loading, cards, subscribe, toast, no admin UI. Admin: loading, cards, delete, create, form, API calls |
| `Admin.test.tsx` | 3 | Subscriptions table rendering |

### Full Test Suite
```bash
# Backend
dotnet test

# Frontend
cd frontend && npm test
```

**Current status:** 43/43 passing (19 backend + 24 frontend), build: 0 errors, 0 warnings

---

## Solution Structure

```
src/
├── Domain          # Entities, Enums, Repository Interfaces
├── Application     # DTOs, Mappers, Business Logic Services
├── Infrastructure  # EF Core DbContext, Repositories, Mock External Services
└── API             # Controllers, Middleware, Program.cs
frontend/           # React + TypeScript + Vite
tests/
└── Application.Tests/  # xUnit unit tests
```

## Test Credentials

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| Admin | `admin@test.com` | `admin123` | Full system access |
| Customer 1 | `john.doe@email.com` | `password123` | Has Netflix & Spotify |
| Customer 2 | `jane.smith@email.com` | `password123` | Has Electricity & Internet |
| Customer 3 | `bob.wilson@email.com` | `password123` | Has Cloud Storage |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | C# / .NET 8 Web API, Clean Architecture |
| Frontend | React 18, TypeScript, Vite 6, Tailwind CSS v4 |
| Database | PostgreSQL (Railway), EF Core 8 + Npgsql |
| Auth | BCrypt password hashing, JWT tokens, Google OAuth |
| Email | SendGrid HTTP API |
| Testing | xUnit + Moq + FluentAssertions (backend), Vitest + testing-library (frontend) |
| CI/CD | GitHub Actions |
| Deployment | Railway (backend), Cloudflare Pages (frontend) |

## AI Usage

This project was developed with AI assistance for:
- Code generation (scaffolding, boilerplate)
- API design recommendations
- Business rule implementation guidance
- Validation logic
- Test scenario generation

All AI-generated output was reviewed and adapted to ensure correctness and alignment with project requirements.
