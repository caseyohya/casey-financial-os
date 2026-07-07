-- Casey Financial OS — Banking Platform Schema (App 2)
-- Run AFTER database/schema.sql in Supabase SQL Editor
-- Adds banking tables for manual entry, CSV import, and future Plaid integration

-- ============================================================
-- ENHANCE BANK ACCOUNTS (country, currency, Plaid-ready)
-- ============================================================
ALTER TABLE bank_accounts
  ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'US'
    CHECK (country IN ('US', 'JP')),
  ADD COLUMN IF NOT EXISTS exchange_rate_to_usd NUMERIC(15, 6),
  ADD COLUMN IF NOT EXISTS data_source TEXT NOT NULL DEFAULT 'manual'
    CHECK (data_source IN ('manual', 'csv', 'plaid')),
  ADD COLUMN IF NOT EXISTS plaid_item_id TEXT,
  ADD COLUMN IF NOT EXISTS plaid_account_id TEXT,
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- ============================================================
-- TRANSACTION CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS transaction_categories (
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
CREATE TABLE IF NOT EXISTS import_files (
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
CREATE TABLE IF NOT EXISTS recurring_transactions (
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
CREATE TABLE IF NOT EXISTS bank_balances (
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
-- BANK TRANSACTIONS (replaces legacy transactions table)
-- ============================================================
CREATE TABLE IF NOT EXISTS bank_transactions (
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

-- Migrate legacy transactions if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'transactions'
  ) THEN
    INSERT INTO bank_transactions (
      user_id, account_id, description, amount, currency,
      transaction_type, category_name, transaction_date, data_source, notes, created_at
    )
    SELECT
      user_id,
      account_id,
      description,
      amount,
      'USD',
      CASE WHEN is_income THEN 'income' ELSE 'expense' END,
      category,
      transaction_date,
      'manual',
      notes,
      created_at
    FROM transactions
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================================
-- MONTHLY CASH FLOW (aggregated, recalculated on demand)
-- ============================================================
CREATE TABLE IF NOT EXISTS cash_flow_monthly (
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
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_transaction_categories_user_id ON transaction_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_import_files_user_id ON import_files(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_user_id ON recurring_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_account_id ON recurring_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_bank_balances_user_id ON bank_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_balances_account_id ON bank_balances(account_id);
CREATE INDEX IF NOT EXISTS idx_bank_balances_date ON bank_balances(balance_date);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_user_id ON bank_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_account_id ON bank_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_date ON bank_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_type ON bank_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_category ON bank_transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_cash_flow_monthly_user_id ON cash_flow_monthly(user_id);
CREATE INDEX IF NOT EXISTS idx_cash_flow_monthly_period ON cash_flow_monthly(year, month);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_country ON bank_accounts(country);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_plaid ON bank_accounts(plaid_account_id)
  WHERE plaid_account_id IS NOT NULL;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE transaction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flow_monthly ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own categories" ON transaction_categories
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own categories" ON transaction_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON transaction_categories
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON transaction_categories
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own import files" ON import_files
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own import files" ON import_files
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own import files" ON import_files
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own import files" ON import_files
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own recurring" ON recurring_transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own recurring" ON recurring_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recurring" ON recurring_transactions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own recurring" ON recurring_transactions
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own balances" ON bank_balances
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own balances" ON bank_balances
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own balances" ON bank_balances
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own balances" ON bank_balances
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own bank transactions" ON bank_transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bank transactions" ON bank_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bank transactions" ON bank_transactions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own bank transactions" ON bank_transactions
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own cash flow" ON cash_flow_monthly
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cash flow" ON cash_flow_monthly
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cash flow" ON cash_flow_monthly
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cash flow" ON cash_flow_monthly
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================
CREATE TRIGGER import_files_updated_at BEFORE UPDATE ON import_files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER recurring_transactions_updated_at BEFORE UPDATE ON recurring_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- DEFAULT CATEGORIES FOR NEW USERS
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
