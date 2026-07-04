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

- [x] CRUD forms for bank accounts (App 2 — Banking Platform)
- [x] CRUD forms for transactions (read-only display)
- [x] Manual balance history tracking
- [x] CSV import with column mapping
- [x] Transaction categorization (income, expense, transfer, investment)
- [x] Monthly cash flow and spending by category
- [x] Recurring expense tracking
- [x] U.S. (USD) and Japan (JPY) support with manual exchange rates
- [x] Filters by account, month, category, country, currency
- [x] Banking summary CSV export
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

- [ ] Plaid bank account linking (read-only balances and transactions) — schema ready (`plaid_item_id`, `plaid_account_id`, `external_id` fields)
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
