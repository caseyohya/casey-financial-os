# Roadmap

## Phase 1 — Foundation (Current)

- [x] Next.js app shell with TypeScript and Tailwind CSS
- [x] Supabase Auth (email/password login and signup)
- [x] Shared database schema with RLS
- [x] Executive-style dark UI with sidebar navigation
- [x] Six module placeholder pages with demo data
- [x] Reusable dashboard components and charts
- [x] Vercel-ready project structure

## Phase 2 — Manual Data Entry

- [ ] CRUD forms for bank accounts
- [ ] CRUD forms for transactions (read-only display)
- [ ] CRUD forms for real estate properties
- [ ] CRUD forms for investment holdings
- [ ] CRUD forms for tax records
- [ ] Net worth snapshot creation
- [ ] Wire dashboard pages to live Supabase data
- [ ] Data validation and error handling

## Phase 3 — Analytics & Insights

- [ ] Real net worth calculations from live data
- [ ] Cash flow analysis from transactions
- [ ] Portfolio performance tracking
- [ ] Property equity trends
- [ ] Tax liability forecasting
- [ ] Export reports (PDF/CSV)

## Phase 4 — Read-Only Integrations

- [ ] Plaid bank account linking (read-only balances and transactions)
- [ ] Market data API for investment price updates (read-only)
- [ ] Property valuation estimates (read-only)
- [ ] Tax document import (read-only parsing)

## Explicitly Out of Scope

- Payment processing
- Money transfers
- Stock/crypto trading or execution
- Transaction execution of any kind
- Write access to external financial accounts

## Infrastructure

- [ ] CI/CD pipeline with GitHub Actions
- [ ] Staging environment on Vercel
- [ ] Database migration tooling
- [ ] Error monitoring (Sentry)
- [ ] E2E tests (Playwright)
