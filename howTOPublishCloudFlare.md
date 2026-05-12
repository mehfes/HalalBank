# HalalBank — Cloudflare Deployment Guide

## 💰 Cost: $0 (Everything is Free)

| Question | Answer |
|----------|--------|
| **Do I need to buy a domain?** | **No.** Cloudflare gives you a free `halalbank.pages.dev` URL. |
| **Do I need to buy Cloudflare hosting?** | **No.** Cloudflare Pages free tier: unlimited sites, unlimited bandwidth, 500 builds/month. |
| **Do I need to buy a server for the backend?** | **No.** Railway free tier ($5 credit/month) covers .NET + PostgreSQL. |
| **Do I need a credit card?** | Railway does not require one to start. |
| **Total cost per month?** | **$0.** |

---

## Architecture

```
Cloudflare Pages (Frontend) ──HTTP──► Railway (Backend: .NET 8) ──► Railway PostgreSQL
         │
   halalbank.pages.dev                                         railway.com/project
```

| Component | Hosting | Cost | Why Free |
|-----------|---------|------|----------|
| Frontend (React) | Cloudflare Pages | **$0** | Free tier: unlimited sites & bandwidth |
| Backend (.NET 8) | Railway | **$0** | $5 free credit/month — more than enough |
| Database (PostgreSQL) | Railway (add-on) | **$0** | Included in free credit |
| Domain/URL | Cloudflare Pages (`*.pages.dev`) | **$0** | No custom domain needed |

---

## Prerequisites

- GitHub account with this repo pushed
- Cloudflare account (sign up at [cloudflare.com](https://cloudflare.com) — **free**)
- Railway account (sign up at [railway.com](https://railway.com) — **free, no credit card needed**)

---

## Step 1 — Push Code to GitHub

```bash
cd C:\Users\MehfesS\Desktop\HalalBank

# Check what's pending
git status

# Add everything and commit
git add .
git commit -m "ready for deployment"

# Push to GitHub
git push
```

---

## Step 2 — Deploy Backend to Railway

### 2.1 Create Railway Project

1. Go to [railway.com](https://railway.com)
2. Click **Start a New Project** → **Deploy from GitHub repo**
3. Select your `HalalBank` repository
4. Authorize Railway to access your repo if prompted

### 2.2 Configure Backend

Railway will automatically detect a .NET project. You need to set:

**Root Directory** to `src/API`:
- In the Railway dashboard, click on the deployed service
- Go to **Settings** → **Root Directory** → change to `src/API`

### 2.3 Add PostgreSQL Database

1. In the same Railway project, click **+ New**
2. Select **Database** → **Add PostgreSQL**
3. Wait for it to provision (30 seconds)

Railway automatically sets the `DATABASE_URL` environment variable. The code already reads this.

### 2.4 Set Environment Variables

In Railway dashboard → your backend service → **Variables**:

| Variable | Value |
|----------|-------|
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `PORT` | `8080` |

### 2.5 Trigger Deploy

1. Go to **Deployments** tab
2. Click **Trigger Deploy** (or push a new commit to GitHub)
3. Wait for the build to finish (check the logs)

### 2.6 Get Backend URL

Once deployed, Railway shows a **Generated Domain** like:
```
https://halalbank-api.up.railway.app
```

Copy this URL. You'll need it for the frontend.

---

## Step 3 — Deploy Frontend to Cloudflare Pages

### 3.1 Connect to GitHub

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages** → **Pages**
3. Click **Connect to Git**
4. Select your `HalalBank` repository

### 3.2 Build Configuration

On the **Set up builds and deployments** page:

| Setting | Value |
|---------|-------|
| **Project name** | `halalbank` (or any name) |
| **Production branch** | `main` |
| **Build command** | `cd frontend && npm install && npm run build` |
| **Build output directory** | `frontend/dist` |
| **Root directory** | (leave blank) |

### 3.3 Environment Variables

Click **Environment variables (advanced)** → **Add variable**:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://halalbank-api.up.railway.app/api` |

Replace the URL with your actual Railway backend URL from Step 2.6.

### 3.4 Deploy

Click **Save and Deploy**. Cloudflare will:
1. Clone your repo
2. Run `cd frontend && npm install && npm run build`
3. Deploy the `frontend/dist` folder to `https://halalbank.pages.dev`

Wait 1-2 minutes for the first deployment.

---

## Step 4 — Verify It Works

### 4.1 Open the App

Go to `https://halalbank.pages.dev` (or your Cloudflare Pages URL).

### 4.2 Test Login

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@test.com` | `admin123` |
| Customer | `john.doe@email.com` | `password123` |

### 4.3 Check Database (Optional)

In Railway dashboard:
1. Click on your PostgreSQL database
2. Go to **Data** tab
3. You can browse tables: `Customers`, `Subscriptions`, `Payments`, `SubscriptionPlans`

---

## Step 5 — Run Database Migrations

**No manual step needed.** The code in `Program.cs` calls `db.Database.MigrateAsync()` automatically on every startup. The seed data (3 customers, 5 subscriptions, 4 plans) will be inserted automatically.

---

## Step 6 — (Optional) Set Up Custom Domain on Cloudflare

**Skip this unless you own a domain.** The free `halalbank.pages.dev` URL works perfectly.

If you later buy a domain (e.g., `halalbank.com`):
1. In Cloudflare Pages → your project → **Custom domains**
2. Click **Set up a custom domain** → enter your domain
3. Follow DNS instructions

---

## Step 7 — (Optional) Configure Real Email Sending

For the status change and payment reminder emails to actually send:

### 7.1 Use a Gmail App Password

1. Enable 2-factor authentication on your Gmail account
2. Generate an **App Password** at https://myaccount.google.com/apppasswords
3. In Railway → your backend service → **Variables**, add:

| Variable | Value |
|----------|-------|
| `EmailSettings__SmtpServer` | `smtp.gmail.com` |
| `EmailSettings__SmtpPort` | `587` |
| `EmailSettings__SenderEmail` | `your-email@gmail.com` |
| `EmailSettings__SenderName` | `HalalBank` |
| `EmailSettings__Username` | `your-email@gmail.com` |
| `EmailSettings__Password` | `your-16-char-app-password` |

### 7.2 No Config = Console Log

If SMTP is not configured, emails are logged to the Railway console (check **Deployments** → **Logs**). No errors, just logs.

---

## Troubleshooting

### "Cannot connect to server" error

1. Check the frontend `VITE_API_URL` env var — make sure it ends with `/api`
2. Verify the Railway backend URL is accessible (paste it in browser — you should see a blank page or 404)
3. Check Railway logs for errors

### Backend crashes on startup

1. Go to Railway → **Deployments** → **Logs**
2. Look for errors like `Connection refused` (database not ready)
3. Make sure PostgreSQL is added to the same project

### Database tables not created

1. The `MigrateAsync()` in `Program.cs` runs automatically
2. If it fails, go to Railway → **Variables** → check `DATABASE_URL` exists
3. Manually trigger a new deploy

### Frontend shows blank page

1. Check Cloudflare Pages build logs for errors
2. Make sure **Build command** is `cd frontend && npm install && npm run build`
3. Make sure **Build output directory** is `frontend/dist`

---

## Free Tier Limits (What You Get for $0)

| Service | Free Tier Limit | HalalBank Usage |
|---------|----------------|-----------------|
| **Cloudflare Pages** | Unlimited sites, unlimited bandwidth, 500 builds/month | 1 site, ~5 builds, <1GB bandwidth |
| **Railway** | $5 free credit/month | ~$2-3/month (1 .NET service + PostgreSQL) |
| **Railway PostgreSQL** | Included in free credit | <1GB storage, minimal queries |

You will **not** exceed any free tier limits with this case study project.

---

## Summary

```
GitHub Repo
    │
    ├── Railway (Backend + DB)        — $0/month
    │   ├── .NET 8 Web API
    │   ├── PostgreSQL Database
    │   └── URL: https://halalbank-api.up.railway.app
    │
    └── Cloudflare Pages (Frontend)   — $0/month
        ├── React SPA (built from frontend/)
        ├── URL: https://halalbank.pages.dev
        └── API calls go to Railway via VITE_API_URL
```

**Total cost: $0/month. No domain purchase needed. No credit card required.**
