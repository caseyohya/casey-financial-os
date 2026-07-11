-- =============================================================================
-- Casey Financial OS — App Module Schema Alignment
-- =============================================================================
-- Run after 20250705000000_casey_financial_os_schema.sql
-- Aligns the unified migration with the six application modules (banking, real
-- estate, investments, tax, financial hub, executive dashboard).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- A. BANKING PLATFORM (App 2)
-- -----------------------------------------------------------------------------

ALTER TABLE public.bank_accounts
  ADD COLUMN IF NOT EXISTS institution TEXT,
  ADD COLUMN IF NOT EXISTS balance NUMERIC(18, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency TEXT,
  ADD COLUMN IF NOT EXISTS exchange_rate_to_usd NUMERIC(15, 6),
  ADD COLUMN IF NOT EXISTS data_source TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

UPDATE public.bank_accounts
SET
  institution = COALESCE(institution, bank_name, ''),
  currency = COALESCE(currency, currency_code::TEXT)
WHERE institution IS NULL OR currency IS NULL;

ALTER TABLE public.transaction_categories
  ADD COLUMN IF NOT EXISTS transaction_type TEXT NOT NULL DEFAULT 'expense';

ALTER TABLE public.bank_balances
  ADD COLUMN IF NOT EXISTS account_id UUID,
  ADD COLUMN IF NOT EXISTS currency TEXT,
  ADD COLUMN IF NOT EXISTS exchange_rate_to_usd NUMERIC(15, 6),
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS data_source TEXT NOT NULL DEFAULT 'manual';

UPDATE public.bank_balances
SET
  account_id = COALESCE(account_id, bank_account_id),
  currency = COALESCE(currency, currency_code::TEXT)
WHERE account_id IS NULL OR currency IS NULL;

ALTER TABLE public.bank_transactions
  ADD COLUMN IF NOT EXISTS account_id UUID,
  ADD COLUMN IF NOT EXISTS currency TEXT,
  ADD COLUMN IF NOT EXISTS exchange_rate_to_usd NUMERIC(15, 6),
  ADD COLUMN IF NOT EXISTS category_name TEXT NOT NULL DEFAULT 'uncategorized',
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS recurring_transaction_id UUID,
  ADD COLUMN IF NOT EXISTS import_file_id UUID,
  ADD COLUMN IF NOT EXISTS external_id TEXT,
  ADD COLUMN IF NOT EXISTS data_source TEXT NOT NULL DEFAULT 'manual';

UPDATE public.bank_transactions
SET
  account_id = COALESCE(account_id, bank_account_id),
  currency = COALESCE(currency, currency_code::TEXT),
  transaction_type = COALESCE(transaction_type, 'expense')
WHERE account_id IS NULL OR currency IS NULL;

ALTER TABLE public.recurring_transactions
  ADD COLUMN IF NOT EXISTS account_id UUID,
  ADD COLUMN IF NOT EXISTS currency TEXT,
  ADD COLUMN IF NOT EXISTS exchange_rate_to_usd NUMERIC(15, 6),
  ADD COLUMN IF NOT EXISTS transaction_type TEXT NOT NULL DEFAULT 'expense',
  ADD COLUMN IF NOT EXISTS next_occurrence DATE,
  ADD COLUMN IF NOT EXISTS last_occurrence DATE,
  ADD COLUMN IF NOT EXISTS data_source TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS notes TEXT;

UPDATE public.recurring_transactions
SET
  account_id = COALESCE(account_id, bank_account_id),
  currency = COALESCE(currency, currency_code::TEXT),
  next_occurrence = COALESCE(next_occurrence, next_date)
WHERE account_id IS NULL OR currency IS NULL;

CREATE TABLE IF NOT EXISTS public.cash_flow_monthly (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
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

-- -----------------------------------------------------------------------------
-- B. REAL ESTATE (App 3)
-- -----------------------------------------------------------------------------

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS currency TEXT,
  ADD COLUMN IF NOT EXISTS land_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS building_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS loan_balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS interest_rate NUMERIC(6, 3),
  ADD COLUMN IF NOT EXISTS monthly_rent NUMERIC(15, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hoa_monthly NUMERIC(15, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS taxes_annual NUMERIC(15, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS insurance_annual NUMERIC(15, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS maintenance_monthly NUMERIC(15, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vacancy_rate_percent NUMERIC(5, 2) DEFAULT 0;

UPDATE public.properties
SET currency = COALESCE(currency, currency_code::TEXT)
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

CREATE TABLE IF NOT EXISTS public.property_monthly_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES public.properties (id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  gross_rent NUMERIC(15, 2) NOT NULL DEFAULT 0,
  vacancy_loss NUMERIC(15, 2) NOT NULL DEFAULT 0,
  other_income NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_income NUMERIC(15, 2) NOT NULL DEFAULT 0,
  operating_expenses NUMERIC(15, 2) NOT NULL DEFAULT 0,
  mortgage_principal NUMERIC(15, 2) NOT NULL DEFAULT 0,
  mortgage_interest NUMERIC(15, 2) NOT NULL DEFAULT 0,
  net_operating_income NUMERIC(15, 2) NOT NULL DEFAULT 0,
  cash_flow NUMERIC(15, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (property_id, year, month)
);

-- -----------------------------------------------------------------------------
-- C. INVESTMENTS (App 4)
-- -----------------------------------------------------------------------------

ALTER TABLE public.investments
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS invested_capital NUMERIC(15, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ownership_percent NUMERIC(7, 4) DEFAULT 100,
  ADD COLUMN IF NOT EXISTS currency TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS tax_basis NUMERIC(15, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS remaining_basis NUMERIC(15, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS idc_deduction_total NUMERIC(15, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS purchase_date DATE;

UPDATE public.investments
SET
  category = COALESCE(category, investment_type::TEXT, 'other_private'),
  invested_capital = COALESCE(NULLIF(invested_capital, 0), cost_basis, 0),
  currency = COALESCE(currency, currency_code::TEXT),
  status = CASE WHEN is_active THEN 'active' ELSE COALESCE(status, 'exited') END,
  purchase_date = COALESCE(purchase_date, acquisition_date),
  tax_basis = COALESCE(NULLIF(tax_basis, 0), cost_basis, 0),
  remaining_basis = COALESCE(NULLIF(remaining_basis, 0), cost_basis, 0)
WHERE category IS NULL OR currency IS NULL;

CREATE TABLE IF NOT EXISTS public.investment_monthly_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investment_id UUID NOT NULL REFERENCES public.investments (id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  invested_capital NUMERIC(15, 2) NOT NULL DEFAULT 0,
  current_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
  distributions_mtd NUMERIC(15, 2) NOT NULL DEFAULT 0,
  capital_calls_mtd NUMERIC(15, 2) NOT NULL DEFAULT 0,
  unrealized_gain NUMERIC(15, 2) NOT NULL DEFAULT 0,
  realized_gain NUMERIC(15, 2) NOT NULL DEFAULT 0,
  cash_yield NUMERIC(7, 4) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (investment_id, year, month)
);

-- -----------------------------------------------------------------------------
-- D. TAX INTELLIGENCE (App 5)
-- -----------------------------------------------------------------------------

ALTER TABLE public.tax_years
  ADD COLUMN IF NOT EXISTS year INTEGER,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS usd_to_jpy_rate NUMERIC(12, 6),
  ADD COLUMN IF NOT EXISTS jpy_to_usd_rate NUMERIC(12, 8);

UPDATE public.tax_years
SET year = COALESCE(year, tax_year)
WHERE year IS NULL;

ALTER TABLE public.tax_documents
  ALTER COLUMN document_id DROP NOT NULL;

ALTER TABLE public.tax_documents
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS document_type TEXT,
  ADD COLUMN IF NOT EXISTS file_path TEXT,
  ADD COLUMN IF NOT EXISTS file_size INTEGER,
  ADD COLUMN IF NOT EXISTS mime_type TEXT,
  ADD COLUMN IF NOT EXISTS is_required BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS is_received BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- -----------------------------------------------------------------------------
-- E. EXECUTIVE DASHBOARD (App 6) — materialized summary tables
-- -----------------------------------------------------------------------------

DROP VIEW IF EXISTS public.executive_financial_independence_summary;
DROP VIEW IF EXISTS public.executive_investment_summary;
DROP VIEW IF EXISTS public.executive_real_estate_summary;
DROP VIEW IF EXISTS public.executive_tax_summary;
DROP VIEW IF EXISTS public.executive_passive_income_summary;
DROP VIEW IF EXISTS public.executive_liquidity_summary;
DROP VIEW IF EXISTS public.executive_asset_allocation;
DROP VIEW IF EXISTS public.executive_cash_flow_summary;
DROP VIEW IF EXISTS public.executive_net_worth_summary;

CREATE TABLE IF NOT EXISTS public.executive_net_worth_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  total_assets NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_liabilities NUMERIC(15, 2) NOT NULL DEFAULT 0,
  net_worth NUMERIC(15, 2) NOT NULL DEFAULT 0,
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
  monthly_income NUMERIC(15, 2) NOT NULL DEFAULT 0,
  monthly_expenses NUMERIC(15, 2) NOT NULL DEFAULT 0,
  cash_flow NUMERIC(15, 2) NOT NULL DEFAULT 0,
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
  amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
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
  cash_position NUMERIC(15, 2) NOT NULL DEFAULT 0,
  liquid_assets NUMERIC(15, 2) NOT NULL DEFAULT 0,
  liquidity_ratio NUMERIC(7, 2) NOT NULL DEFAULT 0,
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
  passive_income NUMERIC(15, 2) NOT NULL DEFAULT 0,
  target_amount NUMERIC(15, 2) NOT NULL DEFAULT 5000,
  progress_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
  rental_income NUMERIC(15, 2) NOT NULL DEFAULT 0,
  distribution_income NUMERIC(15, 2) NOT NULL DEFAULT 0,
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
  estimated_tax NUMERIC(15, 2) NOT NULL DEFAULT 0,
  effective_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
  federal_tax NUMERIC(15, 2) NOT NULL DEFAULT 0,
  state_tax NUMERIC(15, 2) NOT NULL DEFAULT 0,
  gross_income NUMERIC(15, 2) NOT NULL DEFAULT 0,
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
  portfolio_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_equity NUMERIC(15, 2) NOT NULL DEFAULT 0,
  monthly_noi NUMERIC(15, 2) NOT NULL DEFAULT 0,
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
  portfolio_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_distributions NUMERIC(15, 2) NOT NULL DEFAULT 0,
  monthly_distributions NUMERIC(15, 2) NOT NULL DEFAULT 0,
  avg_roi NUMERIC(7, 2) NOT NULL DEFAULT 0,
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
  fi_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
  passive_income_coverage NUMERIC(5, 2) NOT NULL DEFAULT 0,
  debt_ratio NUMERIC(5, 2) NOT NULL DEFAULT 0,
  savings_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
  health_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
  country TEXT DEFAULT 'ALL',
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, year, month, country, currency)
);

CREATE TABLE IF NOT EXISTS public.tax_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  tax_year INTEGER NOT NULL,
  federal_tax NUMERIC(15, 2) NOT NULL DEFAULT 0,
  state_tax NUMERIC(15, 2) NOT NULL DEFAULT 0,
  gross_income NUMERIC(15, 2) NOT NULL DEFAULT 0,
  effective_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, tax_year)
);

CREATE TABLE IF NOT EXISTS public.net_worth_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  net_worth NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_assets NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_liabilities NUMERIC(15, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, snapshot_date)
);

-- -----------------------------------------------------------------------------
-- F. STORAGE BUCKETS (document uploads)
-- -----------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES
  ('property-documents', 'property-documents', FALSE, 52428800),
  ('investment-documents', 'investment-documents', FALSE, 52428800)
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- G. RLS FOR NEW TABLES
-- -----------------------------------------------------------------------------

ALTER TABLE public.cash_flow_monthly ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_monthly_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_monthly_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executive_net_worth_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executive_cash_flow_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executive_asset_allocation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executive_liquidity_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executive_passive_income_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executive_tax_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executive_real_estate_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executive_investment_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executive_financial_independence_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.net_worth_snapshots ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'cash_flow_monthly',
    'property_owners',
    'executive_net_worth_summary',
    'executive_cash_flow_summary',
    'executive_asset_allocation',
    'executive_liquidity_summary',
    'executive_passive_income_summary',
    'executive_tax_summary',
    'executive_real_estate_summary',
    'executive_investment_summary',
    'executive_financial_independence_summary',
    'tax_records',
    'net_worth_snapshots'
  ]
  LOOP
    BEGIN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)',
        'users_manage_own_' || tbl,
        tbl
      );
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;

DO $$
BEGIN
  BEGIN
    CREATE POLICY users_manage_own_property_monthly_summary
      ON public.property_monthly_summary
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.properties p
          WHERE p.id = property_id AND p.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.properties p
          WHERE p.id = property_id AND p.user_id = auth.uid()
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    CREATE POLICY users_manage_own_investment_monthly_summary
      ON public.investment_monthly_summary
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.investments i
          WHERE i.id = investment_id AND i.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.investments i
          WHERE i.id = investment_id AND i.user_id = auth.uid()
        )
      );
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;

-- Storage policies
DO $$
BEGIN
  BEGIN
    CREATE POLICY property_documents_select
      ON storage.objects FOR SELECT
      USING (bucket_id = 'property-documents' AND auth.uid()::TEXT = (storage.foldername(name))[1]);
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN
    CREATE POLICY property_documents_insert
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'property-documents' AND auth.uid()::TEXT = (storage.foldername(name))[1]);
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN
    CREATE POLICY property_documents_delete
      ON storage.objects FOR DELETE
      USING (bucket_id = 'property-documents' AND auth.uid()::TEXT = (storage.foldername(name))[1]);
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN
    CREATE POLICY investment_documents_select
      ON storage.objects FOR SELECT
      USING (bucket_id = 'investment-documents' AND auth.uid()::TEXT = (storage.foldername(name))[1]);
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN
    CREATE POLICY investment_documents_insert
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'investment-documents' AND auth.uid()::TEXT = (storage.foldername(name))[1]);
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN
    CREATE POLICY investment_documents_delete
      ON storage.objects FOR DELETE
      USING (bucket_id = 'investment-documents' AND auth.uid()::TEXT = (storage.foldername(name))[1]);
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
