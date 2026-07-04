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
-- BANK ACCOUNTS (manual entry, read-only, Plaid-ready)
-- ============================================================
CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  institution TEXT NOT NULL DEFAULT '',
  account_type TEXT NOT NULL CHECK (account_type IN ('checking', 'savings', 'credit', 'loan', 'other')),
  balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  country TEXT NOT NULL DEFAULT 'US' CHECK (country IN ('US', 'JP')),
  exchange_rate_to_usd NUMERIC(15, 6),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  data_source TEXT NOT NULL DEFAULT 'manual' CHECK (data_source IN ('manual', 'csv', 'plaid')),
  plaid_item_id TEXT,
  plaid_account_id TEXT,
  last_synced_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TRANSACTION CATEGORIES
-- ============================================================
CREATE TABLE transaction_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  transaction_type TEXT NOT NULL
    CHECK (transaction_type IN ('income', 'expense', 'transfer', 'investment')),
  color TEXT DEFAULT '#64748b',
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, name)
);

-- ============================================================
-- IMPORT FILES (CSV upload tracking)
-- ============================================================
CREATE TABLE import_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
  filename TEXT NOT NULL,
  file_size INTEGER,
  column_mapping JSONB,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'mapped', 'imported', 'failed')),
  row_count INTEGER NOT NULL DEFAULT 0,
  imported_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RECURRING TRANSACTIONS
-- ============================================================
CREATE TABLE recurring_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  exchange_rate_to_usd NUMERIC(15, 6),
  transaction_type TEXT NOT NULL
    CHECK (transaction_type IN ('income', 'expense', 'transfer', 'investment')),
  category_id UUID REFERENCES transaction_categories(id) ON DELETE SET NULL,
  frequency TEXT NOT NULL DEFAULT 'monthly'
    CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
  next_occurrence DATE,
  last_occurrence DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  data_source TEXT NOT NULL DEFAULT 'manual'
    CHECK (data_source IN ('manual', 'csv', 'plaid')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BANK BALANCES (balance history)
-- ============================================================
CREATE TABLE bank_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
  balance NUMERIC(15, 2) NOT NULL,
  balance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  currency TEXT NOT NULL DEFAULT 'USD',
  exchange_rate_to_usd NUMERIC(15, 6),
  notes TEXT,
  data_source TEXT NOT NULL DEFAULT 'manual'
    CHECK (data_source IN ('manual', 'csv', 'plaid')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BANK TRANSACTIONS (manual entry, read-only — no execution)
-- ============================================================
CREATE TABLE bank_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  exchange_rate_to_usd NUMERIC(15, 6),
  transaction_type TEXT NOT NULL DEFAULT 'expense'
    CHECK (transaction_type IN ('income', 'expense', 'transfer', 'investment')),
  category_id UUID REFERENCES transaction_categories(id) ON DELETE SET NULL,
  category_name TEXT NOT NULL DEFAULT 'uncategorized',
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  recurring_transaction_id UUID REFERENCES recurring_transactions(id) ON DELETE SET NULL,
  import_file_id UUID REFERENCES import_files(id) ON DELETE SET NULL,
  external_id TEXT,
  data_source TEXT NOT NULL DEFAULT 'manual'
    CHECK (data_source IN ('manual', 'csv', 'plaid')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MONTHLY CASH FLOW (aggregated)
-- ============================================================
CREATE TABLE cash_flow_monthly (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  currency TEXT NOT NULL DEFAULT 'USD',
  total_income NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_expenses NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_transfers NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_investments NUMERIC(15, 2) NOT NULL DEFAULT 0,
  net_cash_flow NUMERIC(15, 2) NOT NULL DEFAULT 0,
  exchange_rate_to_usd NUMERIC(15, 6),
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, year, month, currency)
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
CREATE INDEX idx_bank_accounts_country ON bank_accounts(country);
CREATE INDEX idx_transaction_categories_user_id ON transaction_categories(user_id);
CREATE INDEX idx_import_files_user_id ON import_files(user_id);
CREATE INDEX idx_recurring_transactions_user_id ON recurring_transactions(user_id);
CREATE INDEX idx_bank_balances_user_id ON bank_balances(user_id);
CREATE INDEX idx_bank_balances_account_id ON bank_balances(account_id);
CREATE INDEX idx_bank_balances_date ON bank_balances(balance_date);
CREATE INDEX idx_bank_transactions_user_id ON bank_transactions(user_id);
CREATE INDEX idx_bank_transactions_account_id ON bank_transactions(account_id);
CREATE INDEX idx_bank_transactions_date ON bank_transactions(transaction_date);
CREATE INDEX idx_bank_transactions_type ON bank_transactions(transaction_type);
CREATE INDEX idx_cash_flow_monthly_user_id ON cash_flow_monthly(user_id);
CREATE INDEX idx_cash_flow_monthly_period ON cash_flow_monthly(year, month);
CREATE INDEX idx_real_estate_user_id ON real_estate_properties(user_id);
CREATE INDEX idx_investment_holdings_user_id ON investment_holdings(user_id);
CREATE INDEX idx_tax_records_user_id ON tax_records(user_id);
CREATE INDEX idx_net_worth_user_id ON net_worth_snapshots(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flow_monthly ENABLE ROW LEVEL SECURITY;
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

-- Transaction categories
CREATE POLICY "Users can view own categories" ON transaction_categories
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own categories" ON transaction_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON transaction_categories
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON transaction_categories
  FOR DELETE USING (auth.uid() = user_id);

-- Import files
CREATE POLICY "Users can view own import files" ON import_files
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own import files" ON import_files
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own import files" ON import_files
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own import files" ON import_files
  FOR DELETE USING (auth.uid() = user_id);

-- Recurring transactions
CREATE POLICY "Users can view own recurring" ON recurring_transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own recurring" ON recurring_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recurring" ON recurring_transactions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own recurring" ON recurring_transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Bank balances
CREATE POLICY "Users can view own balances" ON bank_balances
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own balances" ON bank_balances
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own balances" ON bank_balances
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own balances" ON bank_balances
  FOR DELETE USING (auth.uid() = user_id);

-- Bank transactions
CREATE POLICY "Users can view own bank transactions" ON bank_transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bank transactions" ON bank_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bank transactions" ON bank_transactions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own bank transactions" ON bank_transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Cash flow monthly
CREATE POLICY "Users can view own cash flow" ON cash_flow_monthly
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cash flow" ON cash_flow_monthly
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cash flow" ON cash_flow_monthly
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cash flow" ON cash_flow_monthly
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
CREATE TRIGGER import_files_updated_at BEFORE UPDATE ON import_files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER recurring_transactions_updated_at BEFORE UPDATE ON recurring_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- DEFAULT TRANSACTION CATEGORIES ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION seed_default_transaction_categories()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO transaction_categories (user_id, name, transaction_type, color, is_system) VALUES
    (NEW.id, 'Salary', 'income', '#10b981', TRUE),
    (NEW.id, 'Freelance', 'income', '#059669', TRUE),
    (NEW.id, 'Investment Income', 'income', '#34d399', TRUE),
    (NEW.id, 'Other Income', 'income', '#6ee7b7', TRUE),
    (NEW.id, 'Housing', 'expense', '#ef4444', TRUE),
    (NEW.id, 'Food & Dining', 'expense', '#f97316', TRUE),
    (NEW.id, 'Transportation', 'expense', '#eab308', TRUE),
    (NEW.id, 'Utilities', 'expense', '#a855f7', TRUE),
    (NEW.id, 'Healthcare', 'expense', '#ec4899', TRUE),
    (NEW.id, 'Entertainment', 'expense', '#8b5cf6', TRUE),
    (NEW.id, 'Shopping', 'expense', '#6366f1', TRUE),
    (NEW.id, 'Other Expense', 'expense', '#64748b', TRUE),
    (NEW.id, 'Account Transfer', 'transfer', '#3b82f6', TRUE),
    (NEW.id, 'Stock Purchase', 'investment', '#d4a853', TRUE),
    (NEW.id, 'Bond Purchase', 'investment', '#c49a47', TRUE),
    (NEW.id, 'Other Investment', 'investment', '#a67c2e', TRUE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_profile_created_seed_categories
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION seed_default_transaction_categories();
CREATE TRIGGER real_estate_updated_at BEFORE UPDATE ON real_estate_properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER investment_holdings_updated_at BEFORE UPDATE ON investment_holdings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tax_records_updated_at BEFORE UPDATE ON tax_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
