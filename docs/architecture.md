# Architecture

## Overview

Casey Financial OS is a monolithic Next.js application with six integrated financial modules sharing a single Supabase backend. The platform is designed for manual data entry first, with read-only integrations planned for future phases.

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| UI | React 19, TypeScript, Tailwind CSS 4 |
| Charts | Recharts |
| Auth | Supabase Auth (email/password) |
| Database | PostgreSQL via Supabase |
| Deployment | Vercel |

## Folder Structure

```
/app                          # Next.js App Router
  /(dashboard)                # Authenticated app shell (shared layout)
    /executive-dashboard      # App 6: Unified overview
    /financial-hub            # App 1: Net worth & cash flow
    /banking                  # App 2: Accounts & transactions
    /real-estate              # App 3: Property portfolio
    /investments              # App 4: Holdings & allocation
    /tax                      # App 5: Tax records & planning
  /login, /signup             # Auth pages
  /auth/callback              # OAuth callback handler
/components
  /dashboard                  # MetricCard, DashboardCard, EmptyState
  /forms                      # InputField, Button, Login/Signup forms
  /charts                     # Recharts wrappers
  /layout                     # Sidebar, PageHeader, DashboardLayout
/lib
  /supabase                   # Client, server, middleware helpers
  /calculations               # Net worth, portfolio, tax math
  /types                      # Shared TypeScript interfaces
  /utils                      # Formatting, cn(), navigation config
/database
  schema.sql                  # Full PostgreSQL schema with RLS
  seed.sql                    # Sample data (commented)
/docs
  architecture.md             # This file
  roadmap.md                  # Feature roadmap
  security.md                 # Security model
```

## Authentication Flow

1. User visits `/` (public landing page) or any protected route.
2. Middleware (`middleware.ts`) checks Supabase session via cookies.
3. Unauthenticated users on protected routes → redirect to `/login`.
4. Authenticated users on `/login` or `/signup` → redirect to `/executive-dashboard`.
5. Login/signup uses Supabase `signInWithPassword` / `signUp`.
6. On signup, a database trigger auto-creates a `profiles` row.

## Data Model

All tables enforce Row Level Security (RLS) — users can only access their own data.

| Table | Purpose |
|-------|---------|
| `profiles` | User profile (extends auth.users) |
| `bank_accounts` | Manual bank account balances |
| `transactions` | Manual transaction history |
| `real_estate_properties` | Property holdings |
| `investment_holdings` | Stock/ETF/crypto positions |
| `tax_records` | Annual tax filings |
| `net_worth_snapshots` | Historical net worth data |

## Module Architecture

Each of the six apps is a route group under `/(dashboard)` sharing:

- **Sidebar navigation** — persistent left nav with module links
- **DashboardLayout** — server component that fetches user session
- **Reusable components** — MetricCard, DashboardCard, charts
- **Placeholder data** — demo metrics until manual entry forms are built

## Deployment

1. Create a Supabase project and run `database/schema.sql`.
2. Copy `.env.local.example` to `.env.local` with your Supabase keys.
3. Deploy to Vercel with the same environment variables.
4. Set the Supabase Auth redirect URL to `https://your-domain.com/auth/callback`.

## Design Principles

- **Read-only integrations** — no payment, transfer, trading, or execution
- **Manual data entry first** — forms and CRUD coming in Phase 2
- **Executive UI** — dark navy theme, gold accents, clean typography
- **Scalable structure** — each module can grow independently within shared shell
