# Casey Financial OS

A secure personal financial dashboard platform built with Next.js, React, TypeScript, Supabase, and Tailwind CSS.

## Features

- **Six integrated modules**: Executive Dashboard, Financial Hub, Banking, Real Estate, Investments, and Tax Intelligence
- **Supabase Auth**: Email/password authentication with protected routes
- **Executive UI**: Dark navy theme with gold accents and clean typography
- **Reusable components**: Dashboard cards, metrics, charts, and forms
- **Manual data entry**: Start tracking your finances without external integrations
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

Edit `.env.local` with your Supabase project URL and anon key.

4. Set up the database:

Run `database/schema.sql` in the Supabase SQL Editor.

5. Start the development server:

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
