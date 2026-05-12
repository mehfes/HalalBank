# HalalBank — Project Status

## Done (Implemented)

### Backend — Core
- .NET 8 Web API with clean architecture (Domain, Application, Infrastructure, API)
- PostgreSQL database with EF Core + auto-migration on startup
- Customer CRUD
- Subscription CRUD with status management (Active/Passive/Suspended/Cancelled)
- Payment processing with mock bank API simulation
- Scheduled payment processing (background service checks overdue subscriptions)
- Dashboard stats (active count, upcoming payments)
- Exception handling middleware
- Seed data (3 customers, 4 subscription plans, 5 subscriptions)

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
- React + TypeScript + Vite + Tailwind CSS
- Login page (email/password + Google Sign-In button)
- Registration page
- Dashboard (user's subscriptions, upcoming payments)
- Admin panel (manage all subscriptions, change status, process payments)
- Discover page (browse subscription plans)
- Payment gateway page
- Protected routes (Admin-only sections)
- Auth context with localStorage persistence

### Infrastructure & Deployment
- Frontend: Cloudflare Pages
- Backend: Railway (.NET + PostgreSQL)
- Google Cloud Console OAuth 2.0 setup
- SendGrid email delivery setup

---

## Needs Fixing / Known Issues

### Security (Critical)
- **No password hashing** — stored and compared in plain text (`AuthService.cs`)
- **No backend authorization** — zero `[Authorize]` attributes, any endpoint is open
- **Admin login is hardcoded in frontend** — `admin@test.com`/`admin123` exists only in AuthContext.tsx
- **No JWT/session tokens** — user identity stored as plain JSON in localStorage
- **All API endpoints are public** — anyone can read/write customers, subscriptions, payments

### Missing Features
- **No delete confirmation dialogs** on admin panel
- **No loading skeletons** on pages
- **No search/filter** on subscriptions or customers

---

## Further Steps (Recommended)

### 1. Backend Authentication
- Add JWT token generation on login
- Add `[Authorize]` attributes to all controllers
- Add role-based authorization (Admin vs Customer)
- Store admin credentials properly in database

### 2. Password Security
- Hash passwords with BCrypt or ASP.NET Identity PasswordHasher
- Add password strength validation on registration

### 3. Admin Features
- Create admin user in database seed data
- Admin panel UI for creating subscriptions for any customer
- Admin panel UI for CRUD on all entities

### 4. Email Improvements
- HTML email templates (already partially done)
- Add email queue for async sending
- Add email delivery status tracking

### 5. Frontend Polish
- Loading skeletons while data fetches
- Toast notifications for success/error
- Confirmation dialogs for destructive actions
- Responsive design improvements
- Pagination for subscription lists

### 6. Testing
- Unit tests for Google auth flow
- Unit tests for email notification service
- Integration tests for API endpoints
- End-to-end tests for critical user flows

### 7. DevOps
- GitHub Actions CI/CD pipeline
- Automated database migration on deploy
- Health check endpoint
- Structured logging (Serilog/ELK)

### 8. Monitoring
- Application performance monitoring
- Error tracking (Sentry/App Insights)
- Email delivery monitoring
