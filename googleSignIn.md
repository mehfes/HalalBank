# HalalBank — Google Sign-In Setup Guide

## Overview

Google Sign-In allows users to log in with their Google account. A new user is automatically created in the database on first login.

---

## Step 1 — Create a Google Cloud Project

1. Go to https://console.cloud.google.com
2. Click the project dropdown at the top → **New Project**
3. Name it `HalalBank` (or anything) → **Create**
4. Make sure the new project is selected

---

## Step 2 — Configure OAuth Consent Screen

1. From the left menu: **APIs & Services** → **OAuth consent screen**
2. Choose **External** → **Create**
3. Fill in:
   - **App name**: `HalalBank`
   - **User support email**: your email
   - **Developer contact info**: your email     
4. Click **Save and Continue**
5. **Scopes**: click **Add or Remove Scopes**, select `.../auth/userinfo.email` and `.../auth/userinfo.profile` → **Add** → **Update** → **Save and Continue**
6. **Test users**: click **Add Users**, add your own Gmail address → **Save and Continue**
7. Back to **Credentials** (next step)

---

## Step 3 — Create OAuth 2.0 Credentials

1. Click **Create Credentials** → **OAuth client ID**
2. **Application type**: **Web application**
3. **Name**: `HalalBank Web Client`
4. **Authorized JavaScript origins**:
   - `http://localhost:5173` (for local dev)
   - `https://halalbank.pages.dev` (your Cloudflare URL)
5. **Authorized redirect URIs** (leave empty — not needed for this flow)
6. Click **Create**
7. A popup shows your **Client ID** and **Client Secret**
   - Copy the **Client ID** — you'll need it in Step 4 and Step 5

---

## Step 4 — Add to Frontend (Cloudflare Pages)

In **Cloudflare Pages** dashboard → your project → **Settings** → **Environment variables**:

| Variable | Value |
|----------|-------|
| `VITE_GOOGLE_CLIENT_ID` | `your-client-id.apps.googleusercontent.com` |

Then go to **Deployments** → trigger a new deployment (or push a commit).

For **local development**, create `frontend/.env`:
```
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

---

## Step 5 — Add to Backend (Railway)

In **Railway** dashboard → your backend service → **Variables**, add:

| Variable | Value |
|----------|-------|
| `GOOGLE_CLIENT_ID` | `your-client-id.apps.googleusercontent.com` |

Then trigger a redeploy.

---

## Step 6 — Redeploy & Test

1. Push your latest code to GitHub (including all changes from this feature)
2. Railway will auto-deploy the backend
3. Go to Cloudflare Pages → trigger a new deploy for the frontend
4. Open the app → **Sign in with Google** button should appear on the login page
5. Click it → choose your Google account → you're logged in

---

## How It Works

```
Browser                          Google                   HalalBank Backend
  │                                │                          │
  ├── Click "Sign in with Google"──┤                          │
  │                                ├── Return ID token ──────┤
  │◄── Google credential ──────────┤                          │
  │                                                           │
  ├── POST /api/auth/google-login { idToken } ───────────────►│
  │                                                           ├── Verify token with Google
  │                                                           ├── Find or create Customer
  │◄── { id, email, firstName, lastName, role } ─────────────┤
  │                                                           │
  └── Store in localStorage, redirect to /dashboard           │
```

- Token is verified server-side using Google's public keys
- If the email doesn't exist in the database, a new Customer is created
- If it already exists, the existing account is used
- A random password is generated for Google-authenticated users (they can't sign in with email/password)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Button doesn't load | `VITE_GOOGLE_CLIENT_ID` is missing or wrong in Cloudflare env vars |
| "Google sign-in failed" after login | `GOOGLE_CLIENT_ID` is missing or wrong in Railway env vars |
| "Origin not allowed" error | Add your exact frontend URL to **Authorized JavaScript origins** in Google Cloud Console |
| Backend returns 400 | Check Railway logs — the Google token might be expired or invalid |

---

## Files Changed

| File | Change |
|------|--------|
| `src/Application/Application.csproj` | Added `Google.Apis.Auth` NuGet package |
| `src/Application/DTOs/CustomerDto.cs` | Added `GoogleLoginRequestDto` |
| `src/Application/Interfaces/IAuthService.cs` | Added `GoogleLoginAsync` method |
| `src/Application/Services/AuthService.cs` | Implemented Google token verification + auto-create user |
| `src/API/Controllers/AuthController.cs` | Added `POST /api/auth/google-login` endpoint |
| `src/API/Program.cs` | Registered `GOOGLE_CLIENT_ID` config |
| `frontend/package.json` | Added `@react-oauth/google` dependency |
| `frontend/src/main.tsx` | Wrapped app with `GoogleOAuthProvider` |
| `frontend/src/contexts/AuthContext.tsx` | Added `loginWithGoogle` method |
| `frontend/src/services/api.ts` | Added `auth.googleLogin` API call |
| `frontend/src/pages/Login.tsx` | Added "Sign in with Google" button |
