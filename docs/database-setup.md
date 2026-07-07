# Casey Financial OS — Database Setup

This guide covers deploying the Supabase/PostgreSQL database for all six Casey Financial OS applications.

## Overview

| Component | Path |
|-----------|------|
| Schema migration | `database/schema.sql` |
| Seed data | `database/seed.sql` |
| TypeScript types | `database/types/database.types.ts` |
| Supabase CLI migration | `supabase/migrations/20250705000000_casey_financial_os_schema.sql` |

### Applications Supported

1. **Financial Hub** — accounts, assets, liabilities, income, expenses, snapshots
2. **Banking Platform** — bank accounts, balances, transactions, imports
3. **Real Estate Platform** — properties, mortgages, tenants, income/expenses
4. **Investment Platform** — investments, entities, distributions, capital calls
5. **Tax Intelligence Platform** — tax years, forms, FBAR, Schedule E, K-1
6. **Executive Dashboard** — nine aggregation views

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) (`npm i -g supabase`)
- [Docker](https://www.docker.com/) (for local development)
- Node.js 18+ (for TypeScript type generation)

## Option A: Local Development with Supabase CLI

### 1. Initialize and start

```bash
cd /path/to/casey-financial-os
supabase init   # skip if supabase/ already exists
supabase start
```

### 2. Apply schema

```bash
supabase db reset
```

`supabase db reset` runs all migrations in `supabase/migrations/` and then `supabase/seed.sql` if present. To use the project seed file:

```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f database/schema.sql
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f database/seed.sql
```

### 3. Verify

```bash
supabase status
```

Note the **API URL** (`http://127.0.0.1:54321`) and **anon key** for frontend configuration.

### 4. Test login (seed user)

| Field | Value |
|-------|-------|
| Email | `casey@example.com` |
| Password | `testpassword123` |
| User ID | `a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11` |

## Option B: Supabase Cloud Project

### 1. Create project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Link locally: `supabase link --project-ref <your-project-ref>`

### 2. Push migration

```bash
supabase db push
```

Or run `database/schema.sql` in the **SQL Editor** in the Supabase dashboard.

### 3. Run seed (development only)

In the SQL Editor, paste and run `database/seed.sql`. **Do not run seed in production.**

### 4. Configure Auth

In **Authentication → Providers**, enable Email. Disable anonymous sign-in.

In **Authentication → Policies**, ensure email confirmation settings match your environment.

## Generate TypeScript Types

After the schema is applied to a running Supabase instance:

```bash
supabase gen types typescript --local > database/types/database.types.ts
```

For a remote project:

```bash
supabase gen types typescript --project-id <your-project-ref> > database/types/database.types.ts
```

A hand-authored copy is included at `database/types/database.types.ts` for use before connecting to Supabase.

### Using types in your app

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database/types/database.types';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Typed query example
const { data } = await supabase
  .from('accounts')
  .select('*')
  .eq('currency_code', 'USD');
```

## Security Model

### Row Level Security (RLS)

Every table has RLS enabled. User-owned tables enforce `auth.uid() = user_id` for SELECT, INSERT, UPDATE, and DELETE.

| Table | Policy |
|-------|--------|
| `profiles` | `auth.uid() = id` |
| `currencies` | SELECT only for `authenticated` role (system reference) |
| All other tables | `auth.uid() = user_id` |

### What is NOT included

- No public/anonymous access to financial tables
- No transaction execution or money movement tables
- No trading/order execution features
- Read-only financial aggregation and manual entry only

### Plaid preparation

Nullable columns reserved for future read-only Plaid integration:

- `accounts.plaid_account_id`, `accounts.plaid_item_id`
- `bank_accounts.plaid_account_id`, `bank_accounts.plaid_item_id`, `bank_accounts.plaid_access_token_ref`
- `bank_transactions.plaid_transaction_id`

## Table Relationships

```mermaid
erDiagram
  auth_users ||--|| profiles : "id"
  auth_users ||--o{ accounts : "user_id"
  auth_users ||--o{ assets : "user_id"
  auth_users ||--o{ bank_accounts : "user_id"
  bank_accounts ||--o{ bank_balances : "bank_account_id"
  bank_accounts ||--o{ bank_transactions : "bank_account_id"
  auth_users ||--o{ properties : "user_id"
  properties ||--o{ property_mortgages : "property_id"
  properties ||--o{ property_tenants : "property_id"
  properties ||--o{ property_income : "property_id"
  auth_users ||--o{ investments : "user_id"
  investment_entities ||--o{ investments : "entity_id"
  investments ||--o{ investment_transactions : "investment_id"
  auth_users ||--o{ tax_years : "user_id"
  tax_years ||--o{ tax_income_items : "tax_year_id"
  tax_years ||--o{ tax_deductions : "tax_year_id"
  documents ||--o{ property_documents : "document_id"
  documents ||--o{ investment_documents : "document_id"
  documents ||--o{ tax_documents : "document_id"
```

### Domain summary

| Domain | Parent | Children |
|--------|--------|----------|
| Core | `auth.users` | `profiles`, `documents`, `exchange_rates`, `audit_logs` |
| Financial Hub | `auth.users` | `accounts`, `assets`, `liabilities`, `income_sources`, `expenses`, `monthly_snapshots` |
| Banking | `bank_accounts` | `bank_balances`, `bank_transactions`, `recurring_transactions`, `import_files` |
| Real Estate | `properties` | mortgages, tenants, income, expenses, valuations, depreciation, documents |
| Investments | `investments` | transactions, distributions, capital calls, valuations, tax items, documents |
| Tax | `tax_years` | income/expense items, deductions, foreign accounts, FBAR, 8938, Schedule E, K-1 |

## Executive Dashboard Views

| View | Purpose |
|------|---------|
| `executive_net_worth_summary` | Assets, liabilities, net worth by currency |
| `executive_cash_flow_summary` | Monthly income, expenses, cash flow |
| `executive_asset_allocation` | Allocation percentages across asset types |
| `executive_liquidity_summary` | Cash balances across bank and hub accounts |
| `executive_passive_income_summary` | Passive vs active income, rental and distribution YTD |
| `executive_tax_summary` | Tax year income, deductions, foreign account totals |
| `executive_real_estate_summary` | Property values, mortgages, rental P&L |
| `executive_investment_summary` | Portfolio value, cost basis, unrealized gains |
| `executive_financial_independence_summary` | FI coverage ratio and 25× rule estimate |

All views use `security_invoker = TRUE` so RLS on underlying tables applies.

## Test Queries

Run these in the SQL Editor while authenticated as the seed user, or via `psql` with a JWT.

### 1. Verify RLS — own data visible

```sql
SET request.jwt.claim.sub = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
SET ROLE authenticated;

SELECT count(*) AS account_count FROM public.accounts;
-- Expected: 2
```

### 2. Net worth summary

```sql
SELECT * FROM public.executive_net_worth_summary
WHERE user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
```

### 3. Cash flow

```sql
SELECT * FROM public.executive_cash_flow_summary
WHERE user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
ORDER BY snapshot_month DESC;
```

### 4. Asset allocation

```sql
SELECT * FROM public.executive_asset_allocation
WHERE user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
ORDER BY total_value DESC;
```

### 5. Banking transactions

```sql
SELECT bt.description, bt.amount, bt.currency_code, tc.name AS category
FROM public.bank_transactions bt
LEFT JOIN public.transaction_categories tc ON tc.id = bt.category_id
WHERE bt.user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
ORDER BY bt.transaction_date DESC;
```

### 6. Real estate portfolio

```sql
SELECT * FROM public.executive_real_estate_summary
WHERE user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
```

### 7. Tax summary

```sql
SELECT * FROM public.executive_tax_summary
WHERE user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
ORDER BY tax_year DESC;
```

### 8. Financial independence

```sql
SELECT * FROM public.executive_financial_independence_summary
WHERE user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
```

### 9. RLS isolation — should return 0 rows for other users

```sql
SET request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
SET ROLE authenticated;

SELECT count(*) FROM public.accounts;
-- Expected: 0
```

## Storage (Documents)

Document metadata is stored in `documents.file_path`. Configure a Supabase Storage bucket:

1. Create bucket `financial-documents` (private)
2. Add storage policy: users can only access files under their `user_id/` prefix
3. Store files at `{user_id}/{document_id}/{filename}`

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # server-side only
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| RLS blocks inserts | Ensure `user_id` matches `auth.uid()` in the JWT |
| Profile not created on signup | Verify `on_auth_user_created` trigger exists |
| Seed user login fails | Re-run seed; check `auth.users` row exists |
| View returns empty | Confirm underlying tables have data for that `user_id` |
| Type generation fails | Run `supabase start` or link to remote project first |
