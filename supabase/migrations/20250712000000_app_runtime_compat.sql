-- Casey Financial OS — App Runtime Compatibility Layer
-- Aligns the unified migration schema with columns/tables expected by the app code.
-- Safe to re-run: uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS patterns.

-- =============================================================================
-- A. BANKING — match BankingPlatform / lib/types (account_id, currency, balance…)
-- =============================================================================

ALTER TABLE public.bank_accounts
  ADD COLUMN IF NOT EXISTS institution TEXT,
  ADD COLUMN IF NOT EXISTS balance NUMERIC(18, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS exchange_rate_to_usd NUMERIC(15, 6),
  ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notes TEXT;

UPDATE public.bank_accounts
SET institution = COALESCE(institution, bank_name, '')
WHERE institution IS NULL OR institution = '';

UPDATE public.bank_accounts
SET currency = COALESCE(currency, currency_code::TEXT, 'USD')
WHERE currency IS NULL;

ALTER TABLE public.transaction_categories
  ADD COLUMN IF NOT EXISTS transaction_type TEXT DEFAULT 'expense';

ALTER TABLE public.bank_balances
  ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.bank_accounts (id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS exchange_rate_to_usd NUMERIC(15, 6),
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'manual';

UPDATE public.bank_balances
SET account_id = COALESCE(account_id, bank_account_id)
WHERE account_id IS NULL;

UPDATE public.bank_balances
SET currency = COALESCE(currency, currency_code::TEXT, 'USD')
WHERE currency IS NULL;

ALTER TABLE public.bank_transactions
  ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.bank_accounts (id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS exchange_rate_to_usd NUMERIC(15, 6),
  ADD COLUMN IF NOT EXISTS category_name TEXT DEFAULT 'uncategorized',
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS recurring_transaction_id UUID,
  ADD COLUMN IF NOT EXISTS import_file_id UUID,
  ADD COLUMN IF NOT EXISTS external_id TEXT,
  ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'manual';

UPDATE public.bank_transactions
SET account_id = COALESCE(account_id, bank_account_id)
WHERE account_id IS NULL;

UPDATE public.bank_transactions
SET currency = COALESCE(currency, currency_code::TEXT, 'USD')
WHERE currency IS NULL;

ALTER TABLE public.recurring_transactions
  ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.bank_accounts (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS exchange_rate_to_usd NUMERIC(15, 6),
  ADD COLUMN IF NOT EXISTS transaction_type TEXT DEFAULT 'expense',
  ADD COLUMN IF NOT EXISTS next_occurrence DATE,
  ADD COLUMN IF NOT EXISTS last_occurrence DATE,
  ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS notes TEXT;

UPDATE public.recurring_transactions
SET account_id = COALESCE(account_id, bank_account_id)
WHERE account_id IS NULL;

UPDATE public.recurring_transactions
SET currency = COALESCE(currency, currency_code::TEXT, 'USD')
WHERE currency IS NULL;

UPDATE public.recurring_transactions
SET next_occurrence = COALESCE(next_occurrence, next_date)
WHERE next_occurrence IS NULL;

ALTER TABLE public.import_files
  ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.bank_accounts (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS filename TEXT,
  ADD COLUMN IF NOT EXISTS file_size INTEGER,
  ADD COLUMN IF NOT EXISTS column_mapping JSONB,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS row_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS imported_count INTEGER DEFAULT 0;

UPDATE public.import_files
SET account_id = COALESCE(account_id, bank_account_id)
WHERE account_id IS NULL;

UPDATE public.import_files
SET filename = COALESCE(filename, file_name, 'import.csv')
WHERE filename IS NULL;

UPDATE public.import_files
SET imported_count = COALESCE(imported_count, records_imported, 0);

CREATE TABLE IF NOT EXISTS public.cash_flow_monthly (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  currency TEXT NOT NULL DEFAULT 'USD',
  total_income NUMERIC(18, 2) NOT NULL DEFAULT 0,
  total_expenses NUMERIC(18, 2) NOT NULL DEFAULT 0,
  net_cash_flow NUMERIC(18, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, year, month, currency)
);

ALTER TABLE public.cash_flow_monthly ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY cash_flow_monthly_own ON public.cash_flow_monthly
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- B. REAL ESTATE — match Property types / actions
-- =============================================================================

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS land_value NUMERIC(18, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS building_value NUMERIC(18, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS loan_balance NUMERIC(18, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS interest_rate NUMERIC(8, 4),
  ADD COLUMN IF NOT EXISTS monthly_rent NUMERIC(18, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hoa_monthly NUMERIC(18, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS taxes_annual NUMERIC(18, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS insurance_annual NUMERIC(18, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS maintenance_monthly NUMERIC(18, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vacancy_rate_percent NUMERIC(5, 2) DEFAULT 0;

UPDATE public.properties
SET currency = COALESCE(currency, currency_code::TEXT, 'USD')
WHERE currency IS NULL;

CREATE TABLE IF NOT EXISTS public.property_owners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES public.properties (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  owner_name TEXT NOT NULL,
  ownership_percent NUMERIC(5, 2) NOT NULL DEFAULT 100,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.property_owners ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY property_owners_own ON public.property_owners
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.property_mortgages
  ADD COLUMN IF NOT EXISTS lender TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS original_amount NUMERIC(18, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS term_months INTEGER DEFAULT 360,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notes TEXT;

UPDATE public.property_mortgages
SET lender = COALESCE(NULLIF(lender, ''), lender_name, '')
WHERE lender IS NULL OR lender = '';

UPDATE public.property_mortgages
SET original_amount = COALESCE(NULLIF(original_amount, 0), loan_amount, 0);

UPDATE public.property_mortgages
SET currency = COALESCE(currency, currency_code::TEXT, 'USD')
WHERE currency IS NULL;

ALTER TABLE public.property_income
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS is_vacancy_period BOOLEAN DEFAULT FALSE;

UPDATE public.property_income
SET currency = COALESCE(currency, currency_code::TEXT, 'USD')
WHERE currency IS NULL;

ALTER TABLE public.property_expenses
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

UPDATE public.property_expenses
SET currency = COALESCE(currency, currency_code::TEXT, 'USD')
WHERE currency IS NULL;

UPDATE public.property_expenses
SET category = COALESCE(category, expense_type, 'other')
WHERE category IS NULL;

ALTER TABLE public.property_documents
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS file_path TEXT,
  ADD COLUMN IF NOT EXISTS file_size INTEGER,
  ADD COLUMN IF NOT EXISTS mime_type TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ DEFAULT NOW();

-- Allow direct file metadata without requiring documents junction row
ALTER TABLE public.property_documents
  ALTER COLUMN document_id DROP NOT NULL;

CREATE TABLE IF NOT EXISTS public.property_monthly_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES public.properties (id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  rental_income NUMERIC(18, 2) NOT NULL DEFAULT 0,
  other_income NUMERIC(18, 2) NOT NULL DEFAULT 0,
  operating_expenses NUMERIC(18, 2) NOT NULL DEFAULT 0,
  mortgage_payment NUMERIC(18, 2) NOT NULL DEFAULT 0,
  noi NUMERIC(18, 2) NOT NULL DEFAULT 0,
  cash_flow NUMERIC(18, 2) NOT NULL DEFAULT 0,
  occupancy_rate NUMERIC(5, 2) DEFAULT 100,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (property_id, year, month)
);

ALTER TABLE public.property_monthly_summary ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY property_monthly_summary_own ON public.property_monthly_summary
    FOR ALL USING (
      property_id IN (SELECT id FROM public.properties WHERE user_id = auth.uid())
    )
    WITH CHECK (
      property_id IN (SELECT id FROM public.properties WHERE user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- C. INVESTMENTS — match Investment types / actions
-- =============================================================================

ALTER TABLE public.investments
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'other_private',
  ADD COLUMN IF NOT EXISTS invested_capital NUMERIC(18, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ownership_percent NUMERIC(8, 4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS tax_basis NUMERIC(18, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS remaining_basis NUMERIC(18, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS idc_deduction_total NUMERIC(18, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS purchase_date DATE;

UPDATE public.investments
SET currency = COALESCE(currency, currency_code::TEXT, 'USD')
WHERE currency IS NULL;

UPDATE public.investments
SET invested_capital = COALESCE(NULLIF(invested_capital, 0), cost_basis, 0);

UPDATE public.investments
SET status = CASE
  WHEN status IS NOT NULL AND status <> '' THEN status
  WHEN is_active THEN 'active'
  ELSE 'exited'
END;

UPDATE public.investments
SET purchase_date = COALESCE(purchase_date, acquisition_date);

ALTER TABLE public.investment_entities
  ADD COLUMN IF NOT EXISTS ein TEXT;

UPDATE public.investment_entities
SET ein = COALESCE(ein, tax_id);

ALTER TABLE public.investment_transactions
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

UPDATE public.investment_transactions
SET currency = COALESCE(currency, currency_code::TEXT, 'USD')
WHERE currency IS NULL;

ALTER TABLE public.investment_distributions
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

UPDATE public.investment_distributions
SET currency = COALESCE(currency, currency_code::TEXT, 'USD')
WHERE currency IS NULL;

ALTER TABLE public.investment_capital_calls
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

UPDATE public.investment_capital_calls
SET currency = COALESCE(currency, currency_code::TEXT, 'USD')
WHERE currency IS NULL;

ALTER TABLE public.precious_metals
  ADD COLUMN IF NOT EXISTS investment_id UUID REFERENCES public.investments (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS quantity NUMERIC(18, 6) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS spot_value NUMERIC(18, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

UPDATE public.precious_metals
SET quantity = COALESCE(NULLIF(quantity, 0), weight_oz, 0);

UPDATE public.precious_metals
SET spot_value = CASE
  WHEN COALESCE(spot_value, 0) > 0 THEN spot_value
  WHEN COALESCE(quantity, weight_oz, 0) > 0 THEN COALESCE(current_value, 0) / NULLIF(COALESCE(quantity, weight_oz), 0)
  ELSE COALESCE(current_value, 0)
END;

UPDATE public.precious_metals
SET currency = COALESCE(currency, currency_code::TEXT, 'USD')
WHERE currency IS NULL;

ALTER TABLE public.investment_documents
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS file_path TEXT,
  ADD COLUMN IF NOT EXISTS file_size INTEGER,
  ADD COLUMN IF NOT EXISTS mime_type TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.investment_documents
  ALTER COLUMN document_id DROP NOT NULL;

CREATE TABLE IF NOT EXISTS public.investment_monthly_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investment_id UUID NOT NULL REFERENCES public.investments (id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  invested_capital NUMERIC(18, 2) NOT NULL DEFAULT 0,
  current_value NUMERIC(18, 2) NOT NULL DEFAULT 0,
  distributions NUMERIC(18, 2) NOT NULL DEFAULT 0,
  contributions NUMERIC(18, 2) NOT NULL DEFAULT 0,
  unrealized_gain NUMERIC(18, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (investment_id, year, month)
);

ALTER TABLE public.investment_monthly_summary ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY investment_monthly_summary_own ON public.investment_monthly_summary
    FOR ALL USING (
      investment_id IN (SELECT id FROM public.investments WHERE user_id = auth.uid())
    )
    WITH CHECK (
      investment_id IN (SELECT id FROM public.investments WHERE user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- D. TAX — match Tax Intelligence module (year, status, checklist docs)
-- =============================================================================

ALTER TABLE public.tax_years
  ADD COLUMN IF NOT EXISTS year INTEGER,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS usd_to_jpy_rate NUMERIC(12, 6),
  ADD COLUMN IF NOT EXISTS jpy_to_usd_rate NUMERIC(12, 8);

UPDATE public.tax_years
SET year = COALESCE(year, tax_year)
WHERE year IS NULL;

UPDATE public.tax_years
SET status = CASE
  WHEN status IS NOT NULL AND status <> '' THEN status
  WHEN is_filed THEN 'filed'
  ELSE 'draft'
END;

ALTER TABLE public.tax_documents
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS document_type TEXT DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS file_path TEXT,
  ADD COLUMN IF NOT EXISTS file_size INTEGER,
  ADD COLUMN IF NOT EXISTS mime_type TEXT,
  ADD COLUMN IF NOT EXISTS is_required BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS is_received BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ;

ALTER TABLE public.tax_documents
  ALTER COLUMN document_id DROP NOT NULL;

UPDATE public.tax_documents
SET name = COALESCE(name, description, form_type, 'Document')
WHERE name IS NULL;

UPDATE public.tax_documents
SET document_type = COALESCE(document_type, form_type, 'other')
WHERE document_type IS NULL;

ALTER TABLE public.tax_accounts
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'US',
  ADD COLUMN IF NOT EXISTS balance NUMERIC(18, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_balance NUMERIC(18, 2),
  ADD COLUMN IF NOT EXISTS is_foreign BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS notes TEXT;

UPDATE public.tax_accounts
SET currency = COALESCE(currency, currency_code::TEXT, 'USD')
WHERE currency IS NULL;

-- Legacy executive tax source (kept for dashboard aggregation)
CREATE TABLE IF NOT EXISTS public.tax_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  tax_year INTEGER NOT NULL,
  filing_status TEXT NOT NULL DEFAULT 'single',
  gross_income NUMERIC(18, 2) NOT NULL DEFAULT 0,
  taxable_income NUMERIC(18, 2) NOT NULL DEFAULT 0,
  federal_tax NUMERIC(18, 2) NOT NULL DEFAULT 0,
  state_tax NUMERIC(18, 2) NOT NULL DEFAULT 0,
  effective_rate NUMERIC(8, 4) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, tax_year)
);

ALTER TABLE public.tax_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY tax_records_own ON public.tax_records
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.net_worth_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_assets NUMERIC(18, 2) NOT NULL DEFAULT 0,
  total_liabilities NUMERIC(18, 2) NOT NULL DEFAULT 0,
  net_worth NUMERIC(18, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.net_worth_snapshots ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY net_worth_snapshots_own ON public.net_worth_snapshots
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- E. EXECUTIVE — replace read-only views with upsertable summary tables
-- =============================================================================

DROP VIEW IF EXISTS public.executive_financial_independence_summary CASCADE;
DROP VIEW IF EXISTS public.executive_investment_summary CASCADE;
DROP VIEW IF EXISTS public.executive_real_estate_summary CASCADE;
DROP VIEW IF EXISTS public.executive_tax_summary CASCADE;
DROP VIEW IF EXISTS public.executive_passive_income_summary CASCADE;
DROP VIEW IF EXISTS public.executive_liquidity_summary CASCADE;
DROP VIEW IF EXISTS public.executive_asset_allocation CASCADE;
DROP VIEW IF EXISTS public.executive_cash_flow_summary CASCADE;
DROP VIEW IF EXISTS public.executive_net_worth_summary CASCADE;

CREATE TABLE IF NOT EXISTS public.executive_net_worth_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  total_assets NUMERIC(18, 2) NOT NULL DEFAULT 0,
  total_liabilities NUMERIC(18, 2) NOT NULL DEFAULT 0,
  net_worth NUMERIC(18, 2) NOT NULL DEFAULT 0,
  country TEXT DEFAULT 'ALL',
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, year, month, country, currency)
);

CREATE TABLE IF NOT EXISTS public.executive_cash_flow_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  monthly_income NUMERIC(18, 2) NOT NULL DEFAULT 0,
  monthly_expenses NUMERIC(18, 2) NOT NULL DEFAULT 0,
  cash_flow NUMERIC(18, 2) NOT NULL DEFAULT 0,
  country TEXT DEFAULT 'ALL',
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, year, month, country, currency)
);

CREATE TABLE IF NOT EXISTS public.executive_asset_allocation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  category TEXT NOT NULL,
  amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
  percent NUMERIC(8, 4) NOT NULL DEFAULT 0,
  country TEXT DEFAULT 'ALL',
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, year, month, category, country, currency)
);

CREATE TABLE IF NOT EXISTS public.executive_liquidity_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  cash_position NUMERIC(18, 2) NOT NULL DEFAULT 0,
  liquid_assets NUMERIC(18, 2) NOT NULL DEFAULT 0,
  liquidity_ratio NUMERIC(10, 4) NOT NULL DEFAULT 0,
  country TEXT DEFAULT 'ALL',
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, year, month, country, currency)
);

CREATE TABLE IF NOT EXISTS public.executive_passive_income_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  passive_income NUMERIC(18, 2) NOT NULL DEFAULT 0,
  target_amount NUMERIC(18, 2) NOT NULL DEFAULT 5000,
  progress_percent NUMERIC(8, 4) NOT NULL DEFAULT 0,
  rental_income NUMERIC(18, 2) NOT NULL DEFAULT 0,
  distribution_income NUMERIC(18, 2) NOT NULL DEFAULT 0,
  country TEXT DEFAULT 'ALL',
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, year, month, country, currency)
);

CREATE TABLE IF NOT EXISTS public.executive_tax_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  estimated_tax NUMERIC(18, 2) NOT NULL DEFAULT 0,
  effective_rate NUMERIC(8, 4) NOT NULL DEFAULT 0,
  federal_tax NUMERIC(18, 2) NOT NULL DEFAULT 0,
  state_tax NUMERIC(18, 2) NOT NULL DEFAULT 0,
  gross_income NUMERIC(18, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, year, currency)
);

CREATE TABLE IF NOT EXISTS public.executive_real_estate_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  portfolio_value NUMERIC(18, 2) NOT NULL DEFAULT 0,
  total_equity NUMERIC(18, 2) NOT NULL DEFAULT 0,
  monthly_noi NUMERIC(18, 2) NOT NULL DEFAULT 0,
  property_count INTEGER NOT NULL DEFAULT 0,
  country TEXT DEFAULT 'ALL',
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, year, month, country, currency)
);

CREATE TABLE IF NOT EXISTS public.executive_investment_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  portfolio_value NUMERIC(18, 2) NOT NULL DEFAULT 0,
  total_distributions NUMERIC(18, 2) NOT NULL DEFAULT 0,
  monthly_distributions NUMERIC(18, 2) NOT NULL DEFAULT 0,
  avg_roi NUMERIC(10, 4) NOT NULL DEFAULT 0,
  investment_count INTEGER NOT NULL DEFAULT 0,
  country TEXT DEFAULT 'ALL',
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, year, month, country, currency)
);

CREATE TABLE IF NOT EXISTS public.executive_financial_independence_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  fi_score NUMERIC(10, 4) NOT NULL DEFAULT 0,
  passive_income_coverage NUMERIC(10, 4) NOT NULL DEFAULT 0,
  debt_ratio NUMERIC(10, 4) NOT NULL DEFAULT 0,
  savings_rate NUMERIC(10, 4) NOT NULL DEFAULT 0,
  health_score NUMERIC(10, 4) NOT NULL DEFAULT 0,
  country TEXT DEFAULT 'ALL',
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, year, month, country, currency)
);

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'executive_net_worth_summary',
    'executive_cash_flow_summary',
    'executive_asset_allocation',
    'executive_liquidity_summary',
    'executive_passive_income_summary',
    'executive_tax_summary',
    'executive_real_estate_summary',
    'executive_investment_summary',
    'executive_financial_independence_summary'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    BEGIN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)',
        t || '_own', t
      );
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
    BEGIN
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;
END $$;

-- =============================================================================
-- F. ENUM / CHECK COERCION — allow app string values on typed columns
-- =============================================================================

-- Properties: app uses rental/primary/commercial/land/other
ALTER TABLE public.properties
  ALTER COLUMN property_type DROP DEFAULT;

ALTER TABLE public.properties
  ALTER COLUMN property_type TYPE TEXT USING property_type::TEXT;

ALTER TABLE public.properties
  ALTER COLUMN property_type SET DEFAULT 'rental';

-- Investments: app uses category strings and status strings
ALTER TABLE public.investments
  ALTER COLUMN investment_type DROP DEFAULT;

ALTER TABLE public.investments
  ALTER COLUMN investment_type TYPE TEXT USING investment_type::TEXT;

ALTER TABLE public.investments
  ALTER COLUMN investment_type SET DEFAULT 'other';

-- Tax filing status values used by Tax Intelligence
ALTER TABLE public.tax_years
  ALTER COLUMN filing_status DROP DEFAULT;

ALTER TABLE public.tax_years
  ALTER COLUMN filing_status TYPE TEXT USING filing_status::TEXT;

-- Map legacy enum labels to app labels where present
UPDATE public.tax_years
SET filing_status = CASE filing_status
  WHEN 'married_filing_jointly' THEN 'married_joint'
  WHEN 'married_filing_separately' THEN 'married_separate'
  ELSE filing_status
END
WHERE filing_status IN ('married_filing_jointly', 'married_filing_separately');

-- Investment transaction types used by the app
ALTER TABLE public.investment_transactions
  ALTER COLUMN transaction_type TYPE TEXT USING transaction_type::TEXT;

-- Recurring frequency may use app strings (weekly/biweekly/…)
ALTER TABLE public.recurring_transactions
  ALTER COLUMN frequency DROP DEFAULT;

ALTER TABLE public.recurring_transactions
  ALTER COLUMN frequency TYPE TEXT USING frequency::TEXT;

ALTER TABLE public.recurring_transactions
  ALTER COLUMN frequency SET DEFAULT 'monthly';
