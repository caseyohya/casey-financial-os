-- Casey Financial OS — Financial Hub Schema (App 1)
-- Run AFTER database/schema.sql when using the modular SQL deploy path.
-- Provides accounts / assets / liabilities / income_sources / expenses used by Financial Hub.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'other',
  currency_code TEXT NOT NULL DEFAULT 'USD',
  country TEXT NOT NULL DEFAULT 'US',
  balance NUMERIC(18, 2) NOT NULL DEFAULT 0,
  institution TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  plaid_account_id TEXT,
  plaid_item_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL DEFAULT 'other',
  category TEXT,
  currency_code TEXT NOT NULL DEFAULT 'USD',
  country TEXT NOT NULL DEFAULT 'US',
  current_value NUMERIC(18, 2) NOT NULL DEFAULT 0,
  acquisition_date DATE,
  acquisition_cost NUMERIC(18, 2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS liabilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  liability_type TEXT NOT NULL DEFAULT 'other',
  category TEXT,
  currency_code TEXT NOT NULL DEFAULT 'USD',
  country TEXT NOT NULL DEFAULT 'US',
  current_balance NUMERIC(18, 2) NOT NULL DEFAULT 0,
  interest_rate NUMERIC(8, 4),
  maturity_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS income_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  income_type TEXT NOT NULL,
  category TEXT,
  currency_code TEXT NOT NULL DEFAULT 'USD',
  country TEXT NOT NULL DEFAULT 'US',
  amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
  frequency TEXT NOT NULL DEFAULT 'monthly',
  is_passive BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  expense_type TEXT NOT NULL,
  category TEXT,
  currency_code TEXT NOT NULL DEFAULT 'USD',
  country TEXT NOT NULL DEFAULT 'US',
  amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
  frequency TEXT NOT NULL DEFAULT 'monthly',
  is_fixed BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS monthly_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  snapshot_month DATE NOT NULL,
  currency_code TEXT NOT NULL DEFAULT 'USD',
  total_assets NUMERIC(18, 2) NOT NULL DEFAULT 0,
  total_liabilities NUMERIC(18, 2) NOT NULL DEFAULT 0,
  net_worth NUMERIC(18, 2) NOT NULL DEFAULT 0,
  total_income NUMERIC(18, 2) NOT NULL DEFAULT 0,
  total_expenses NUMERIC(18, 2) NOT NULL DEFAULT 0,
  cash_flow NUMERIC(18, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, snapshot_month, currency_code)
);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE liabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_snapshots ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY accounts_own ON accounts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY assets_own ON assets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY liabilities_own ON liabilities FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY income_sources_own ON income_sources FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY expenses_own ON expenses FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY monthly_snapshots_own ON monthly_snapshots FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
