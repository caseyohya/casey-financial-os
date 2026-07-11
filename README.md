# Casey Financial OS

A secure personal financial dashboard platform built with Next.js, React, TypeScript, Supabase, and Tailwind CSS.

## Features

- **Six integrated modules**: Executive Dashboard, Financial Hub, Banking, Real Estate, Investments, and Tax Intelligence
- **Supabase Auth**: Email/password authentication with protected routes
- **Executive UI**: Dark navy theme with gold accents and clean typography
- **Reusable components**: Dashboard cards, metrics, charts, and forms
- **Manual data entry**: Start tracking your finances without external integrations
- **Investment Platform**: Private equity, oil & gas, startups, precious metals, K-1 tracking, CPA exports
- **Executive Dashboard**: Unified CFO view with net worth, cash flow, FI score, and PDF reports
- **Read-only by design**: No payments, transfers, trading, or transaction execution

## Quick Start

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### Setup

1. Clone the repository:

```bash
git clone https://github.com/caseyohya/casey-financial-os.git
cd casey-financial-os
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase project URL and anon key from [Supabase Dashboard → Project Settings → API](https://supabase.com/dashboard).

4. Set up the database (all six apps):

Apply both migrations in order via Supabase CLI or the SQL Editor:

```bash
# Option A: Supabase CLI (recommended)
supabase link --project-ref <your-project-ref>
supabase db push

# Option B: SQL Editor — paste and run each file:
#   supabase/migrations/20250705000000_casey_financial_os_schema.sql
#   supabase/migrations/20250711000000_app_module_alignment.sql
```

5. Verify all apps are connected:

```bash
npm run db:verify
```

Or open `/api/health/supabase` while the dev server is running.

6. Create Supabase Storage buckets (created automatically by the alignment migration):
   - `property-documents` (private)
   - `investment-documents` (private)

7. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### First Login

1. Visit the homepage and click **Get started**
2. Create an account with email and password
3. Sign in and navigate between the six modules via the sidebar

## Project Structure

```
app/                    # Next.js routes
  (dashboard)/          # Authenticated modules
  login/ signup/        # Auth pages
components/             # UI components
  dashboard/ forms/ charts/ layout/
lib/                    # Supabase, types, utils, calculations
database/               # schema.sql, seed.sql
docs/                   # architecture.md, roadmap.md, security.md
```

## Deployment

Deploy to [Vercel](https://vercel.com):

1. Push to GitHub
2. Import the repo in Vercel
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variables
4. Set Supabase Auth redirect URL to `https://your-domain.vercel.app/auth/callback`

## Documentation

- [Architecture](docs/architecture.md)
- [Roadmap](docs/roadmap.md)
- [Security](docs/security.md)

## License

Private — All rights reserved.
