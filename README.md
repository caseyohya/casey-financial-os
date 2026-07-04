# Casey Financial OS - App 1: Financial Hub

A modern personal finance dashboard built with Next.js + Supabase for the Casey Financial Operating System.

## Overview

This application provides a clean, executive-style dashboard to track:
- **Net Worth** = Total Assets - Total Liabilities
- **Total Assets** - All your holdings aggregated
- **Total Liabilities** - All your debts aggregated
- **Monthly Income** - Normalized from various frequencies
- **Monthly Expenses** - Normalized from various frequencies

## Features

### Core Functionality
- 📊 Executive-dashboard styling with dark theme
- 💰 Real-time financial metrics calculations
- 📝 Manual data entry forms for:
  - Assets (savings, investments, real estate, vehicles, etc.)
  - Liabilities (mortgages, loans, credit cards)
  - Income sources (salary, side income, passive income)
  - Expenses (by category and frequency)
- 📋 Sortable and searchable data lists
- 🔄 Automatic frequency normalization (weekly/bi-weekly/monthly/yearly → monthly)

### Database Tables

```sql
-- profiles: User profile information
-- accounts: Bank and investment accounts
-- assets: Asset holdings
-- liabilities: Debt tracking
-- income_sources: Income streams
-- expenses: Expense tracking
```

## Setup

### Prerequisites
- Node.js 18+
- Supabase account (https://supabase.com)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/caseyohya/casey-financial-os.git
cd casey-financial-os
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase:
   - Create a new Supabase project
   - Copy your project URL and anon key
   - Create the database tables (see schema below)

4. Configure environment:
```bash
cp .env.local.example .env.local
```

Update `.env.local` with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

Execute these SQL queries in your Supabase SQL editor to set up the schema:

```sql
-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Assets table
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  value DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Liabilities table
CREATE TABLE liabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  liability_type TEXT NOT NULL,
  balance DECIMAL(15, 2) NOT NULL,
  interest_rate DECIMAL(5, 2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Income sources table
CREATE TABLE income_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  frequency TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Expenses table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  frequency TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- (Optional) Accounts table for future use
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  account_type TEXT NOT NULL,
  balance DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS with custom executive theme
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **Form Handling**: Native React hooks

## Future Enhancements

- [ ] Plaid integration for bank account syncing
- [ ] Transaction history tracking
- [ ] Budget planning and forecasting
- [ ] Financial goals and milestones
- [ ] Multi-user family accounts
- [ ] API endpoints for mobile app
- [ ] Data export (CSV, PDF reports)
- [ ] Charts and visualizations
- [ ] Historical net worth tracking

## License

MIT
