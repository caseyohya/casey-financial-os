-- Casey Financial OS — Database Schema
-- PostgreSQL / Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BANK ACCOUNTS (manual entry, read-only)
-- ============================================================
CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  institution TEXT NOT NULL DEFAULT '',
  account_type TEXT NOT NULL CHECK (account_type IN ('checking', 'savings', 'credit', 'loan', 'other')),
  balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TRANSACTIONS (manual entry, read-only — no execution)
-- ============================================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  category TEXT NOT NULL DEFAULT 'uncategorized',
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_income BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- REAL ESTATE PROPERTIES (manual entry)
-- ============================================================
CREATE TABLE real_estate_properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  property_type TEXT NOT NULL CHECK (property_type IN ('primary', 'rental', 'commercial', 'land', 'other')),
  purchase_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
  current_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
  mortgage_balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  monthly_rent NUMERIC(15, 2),
  monthly_expenses NUMERIC(15, 2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INVESTMENT HOLDINGS (manual entry, read-only)
-- ============================================================
CREATE TABLE investment_holdings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  asset_type TEXT NOT NULL CHECK (asset_type IN ('stock', 'etf', 'bond', 'crypto', 'mutual_fund', 'other')),
  quantity NUMERIC(15, 6) NOT NULL DEFAULT 0,
  cost_basis NUMERIC(15, 2) NOT NULL DEFAULT 0,
  current_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
  account_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TAX RECORDS (manual entry)
-- ============================================================
CREATE TABLE tax_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tax_year INTEGER NOT NULL,
  filing_status TEXT NOT NULL DEFAULT 'single',
  gross_income NUMERIC(15, 2) NOT NULL DEFAULT 0,
  taxable_income NUMERIC(15, 2) NOT NULL DEFAULT 0,
  federal_tax NUMERIC(15, 2) NOT NULL DEFAULT 0,
  state_tax NUMERIC(15, 2) NOT NULL DEFAULT 0,
  effective_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, tax_year)
);

-- ============================================================
-- NET WORTH SNAPSHOTS (manual / calculated)
-- ============================================================
CREATE TABLE net_worth_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_assets NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_liabilities NUMERIC(15, 2) NOT NULL DEFAULT 0,
  net_worth NUMERIC(15, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_bank_accounts_user_id ON bank_accounts(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_real_estate_user_id ON real_estate_properties(user_id);
CREATE INDEX idx_investment_holdings_user_id ON investment_holdings(user_id);
CREATE INDEX idx_tax_records_user_id ON tax_records(user_id);
CREATE INDEX idx_net_worth_user_id ON net_worth_snapshots(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE real_estate_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE net_worth_snapshots ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only access their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Bank accounts
CREATE POLICY "Users can view own accounts" ON bank_accounts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own accounts" ON bank_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own accounts" ON bank_accounts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own accounts" ON bank_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- Transactions
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON transactions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Real estate
CREATE POLICY "Users can view own properties" ON real_estate_properties
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own properties" ON real_estate_properties
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own properties" ON real_estate_properties
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own properties" ON real_estate_properties
  FOR DELETE USING (auth.uid() = user_id);

-- Investment holdings
CREATE POLICY "Users can view own holdings" ON investment_holdings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own holdings" ON investment_holdings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own holdings" ON investment_holdings
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own holdings" ON investment_holdings
  FOR DELETE USING (auth.uid() = user_id);

-- Tax records
CREATE POLICY "Users can view own tax records" ON tax_records
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tax records" ON tax_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tax records" ON tax_records
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tax records" ON tax_records
  FOR DELETE USING (auth.uid() = user_id);

-- Net worth snapshots
CREATE POLICY "Users can view own snapshots" ON net_worth_snapshots
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own snapshots" ON net_worth_snapshots
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own snapshots" ON net_worth_snapshots
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own snapshots" ON net_worth_snapshots
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER bank_accounts_updated_at BEFORE UPDATE ON bank_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER real_estate_updated_at BEFORE UPDATE ON real_estate_properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER investment_holdings_updated_at BEFORE UPDATE ON investment_holdings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tax_records_updated_at BEFORE UPDATE ON tax_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
