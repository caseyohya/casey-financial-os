-- =============================================================================
-- Casey Financial OS — Supabase Database Schema
-- =============================================================================
-- PostgreSQL / Supabase migration for six integrated financial applications.
-- Security: RLS on every table; users access only their own data via auth.uid().
-- Money fields use NUMERIC; currencies: USD, JPY; countries: US, JP.
-- Prepared for future Plaid read-only integration (nullable plaid_* columns).
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

CREATE TYPE country_code AS ENUM ('US', 'JP');
CREATE TYPE currency_code AS ENUM ('USD', 'JPY');
CREATE TYPE account_type AS ENUM (
  'checking', 'savings', 'brokerage', 'retirement', 'credit', 'loan', 'other'
);
CREATE TYPE asset_type AS ENUM (
  'cash', 'real_estate', 'investment', 'precious_metal', 'vehicle', 'other'
);
CREATE TYPE liability_type AS ENUM (
  'mortgage', 'credit_card', 'student_loan', 'auto_loan', 'personal_loan', 'other'
);
CREATE TYPE income_frequency AS ENUM (
  'one_time', 'weekly', 'biweekly', 'monthly', 'quarterly', 'annually'
);
CREATE TYPE expense_frequency AS ENUM (
  'one_time', 'weekly', 'biweekly', 'monthly', 'quarterly', 'annually'
);
CREATE TYPE property_type AS ENUM (
  'single_family', 'multi_family', 'condo', 'commercial', 'land', 'other'
);
CREATE TYPE investment_type AS ENUM (
  'stock', 'bond', 'etf', 'mutual_fund', 'private_equity', 'real_estate_fund',
  'hedge_fund', 'crypto', 'other'
);
CREATE TYPE investment_transaction_type AS ENUM (
  'buy', 'sell', 'dividend', 'interest', 'split', 'transfer_in', 'transfer_out', 'other'
);
CREATE TYPE metal_type AS ENUM ('gold', 'silver', 'platinum', 'palladium', 'other');
CREATE TYPE filing_status AS ENUM (
  'single', 'married_filing_jointly', 'married_filing_separately',
  'head_of_household', 'qualifying_widow'
);
CREATE TYPE import_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE export_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE capital_call_status AS ENUM ('pending', 'partial', 'paid', 'overdue');

-- =============================================================================
-- UTILITY FUNCTIONS
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', '')
  );
  RETURN NEW;
END;
$$;

-- =============================================================================
-- A. CORE TABLES
-- =============================================================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  preferred_currency currency_code NOT NULL DEFAULT 'USD',
  preferred_country country_code NOT NULL DEFAULT 'US',
  avatar_url TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- System reference table (no user_id); read-only for authenticated users
CREATE TABLE public.currencies (
  code currency_code PRIMARY KEY,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  decimal_places SMALLINT NOT NULL DEFAULT 2,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER currencies_updated_at
  BEFORE UPDATE ON public.currencies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.exchange_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  base_currency currency_code NOT NULL REFERENCES public.currencies (code),
  quote_currency currency_code NOT NULL REFERENCES public.currencies (code),
  rate NUMERIC(18, 8) NOT NULL CHECK (rate > 0),
  effective_date DATE NOT NULL,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, base_currency, quote_currency, effective_date)
);

CREATE TRIGGER exchange_rates_updated_at
  BEFORE UPDATE ON public.exchange_rates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size_bytes BIGINT,
  document_category TEXT,
  related_table TEXT,
  related_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- B. FINANCIAL HUB
-- =============================================================================

CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  account_type account_type NOT NULL DEFAULT 'other',
  currency_code currency_code NOT NULL DEFAULT 'USD',
  country country_code NOT NULL DEFAULT 'US',
  balance NUMERIC(18, 2) NOT NULL DEFAULT 0,
  institution TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  plaid_account_id TEXT,
  plaid_item_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER accounts_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  asset_type asset_type NOT NULL DEFAULT 'other',
  category TEXT,
  currency_code currency_code NOT NULL DEFAULT 'USD',
  country country_code NOT NULL DEFAULT 'US',
  current_value NUMERIC(18, 2) NOT NULL DEFAULT 0,
  acquisition_date DATE,
  acquisition_cost NUMERIC(18, 2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.liabilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  liability_type liability_type NOT NULL DEFAULT 'other',
  category TEXT,
  currency_code currency_code NOT NULL DEFAULT 'USD',
  country country_code NOT NULL DEFAULT 'US',
  current_balance NUMERIC(18, 2) NOT NULL DEFAULT 0,
  interest_rate NUMERIC(8, 4),
  maturity_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER liabilities_updated_at
  BEFORE UPDATE ON public.liabilities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.income_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  income_type TEXT NOT NULL,
  category TEXT,
  currency_code currency_code NOT NULL DEFAULT 'USD',
  country country_code NOT NULL DEFAULT 'US',
  amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
  frequency income_frequency NOT NULL DEFAULT 'monthly',
  is_passive BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER income_sources_updated_at
  BEFORE UPDATE ON public.income_sources
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  expense_type TEXT NOT NULL,
  category TEXT,
  currency_code currency_code NOT NULL DEFAULT 'USD',
  country country_code NOT NULL DEFAULT 'US',
  amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
  frequency expense_frequency NOT NULL DEFAULT 'monthly',
  is_fixed BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.monthly_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  snapshot_month DATE NOT NULL,
  currency_code currency_code NOT NULL DEFAULT 'USD',
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

CREATE TRIGGER monthly_snapshots_updated_at
  BEFORE UPDATE ON public.monthly_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- C. BANKING
-- =============================================================================

CREATE TABLE public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bank_name TEXT,
  account_type account_type NOT NULL DEFAULT 'checking',
  account_number_last4 TEXT,
  currency_code currency_code NOT NULL DEFAULT 'USD',
  country country_code NOT NULL DEFAULT 'US',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  plaid_account_id TEXT,
  plaid_item_id TEXT,
  plaid_access_token_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER bank_accounts_updated_at
  BEFORE UPDATE ON public.bank_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.transaction_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_category_id UUID REFERENCES public.transaction_categories (id) ON DELETE SET NULL,
  color TEXT,
  icon TEXT,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER transaction_categories_updated_at
  BEFORE UPDATE ON public.transaction_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.bank_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  bank_account_id UUID NOT NULL REFERENCES public.bank_accounts (id) ON DELETE CASCADE,
  balance NUMERIC(18, 2) NOT NULL DEFAULT 0,
  balance_date DATE NOT NULL,
  currency_code currency_code NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (bank_account_id, balance_date)
);

CREATE TRIGGER bank_balances_updated_at
  BEFORE UPDATE ON public.bank_balances
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.bank_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  bank_account_id UUID NOT NULL REFERENCES public.bank_accounts (id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  posted_date DATE,
  description TEXT NOT NULL,
  amount NUMERIC(18, 2) NOT NULL,
  currency_code currency_code NOT NULL DEFAULT 'USD',
  category_id UUID REFERENCES public.transaction_categories (id) ON DELETE SET NULL,
  transaction_type TEXT,
  is_pending BOOLEAN NOT NULL DEFAULT FALSE,
  plaid_transaction_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER bank_transactions_updated_at
  BEFORE UPDATE ON public.bank_transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.recurring_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  bank_account_id UUID REFERENCES public.bank_accounts (id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.transaction_categories (id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount NUMERIC(18, 2) NOT NULL,
  currency_code currency_code NOT NULL DEFAULT 'USD',
  frequency income_frequency NOT NULL DEFAULT 'monthly',
  next_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER recurring_transactions_updated_at
  BEFORE UPDATE ON public.recurring_transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.import_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  import_status import_status NOT NULL DEFAULT 'pending',
  records_imported INTEGER NOT NULL DEFAULT 0,
  bank_account_id UUID REFERENCES public.bank_accounts (id) ON DELETE SET NULL,
  error_message TEXT,
  imported_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER import_files_updated_at
  BEFORE UPDATE ON public.import_files
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- D. REAL ESTATE
-- =============================================================================

CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  property_type property_type NOT NULL DEFAULT 'single_family',
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state_province TEXT,
  postal_code TEXT,
  country country_code NOT NULL DEFAULT 'US',
  currency_code currency_code NOT NULL DEFAULT 'USD',
  purchase_date DATE,
  purchase_price NUMERIC(18, 2),
  current_value NUMERIC(18, 2),
  is_rental BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.property_mortgages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties (id) ON DELETE CASCADE,
  lender_name TEXT,
  loan_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
  current_balance NUMERIC(18, 2) NOT NULL DEFAULT 0,
  interest_rate NUMERIC(8, 4),
  monthly_payment NUMERIC(18, 2),
  start_date DATE,
  maturity_date DATE,
  currency_code currency_code NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER property_mortgages_updated_at
  BEFORE UPDATE ON public.property_mortgages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.property_tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  lease_start DATE,
  lease_end DATE,
  monthly_rent NUMERIC(18, 2),
  currency_code currency_code NOT NULL DEFAULT 'USD',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER property_tenants_updated_at
  BEFORE UPDATE ON public.property_tenants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.property_income (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties (id) ON DELETE CASCADE,
  income_type TEXT NOT NULL,
  amount NUMERIC(18, 2) NOT NULL,
  currency_code currency_code NOT NULL DEFAULT 'USD',
  income_date DATE NOT NULL,
  tenant_id UUID REFERENCES public.property_tenants (id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER property_income_updated_at
  BEFORE UPDATE ON public.property_income
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.property_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties (id) ON DELETE CASCADE,
  expense_type TEXT NOT NULL,
  category TEXT,
  amount NUMERIC(18, 2) NOT NULL,
  currency_code currency_code NOT NULL DEFAULT 'USD',
  expense_date DATE NOT NULL,
  is_tax_deductible BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER property_expenses_updated_at
  BEFORE UPDATE ON public.property_expenses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.property_valuations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties (id) ON DELETE CASCADE,
  valuation_date DATE NOT NULL,
  estimated_value NUMERIC(18, 2) NOT NULL,
  currency_code currency_code NOT NULL DEFAULT 'USD',
  valuation_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER property_valuations_updated_at
  BEFORE UPDATE ON public.property_valuations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.property_depreciation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties (id) ON DELETE CASCADE,
  tax_year INTEGER NOT NULL CHECK (tax_year >= 1900 AND tax_year <= 2100),
  depreciation_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
  accumulated_depreciation NUMERIC(18, 2) NOT NULL DEFAULT 0,
  method TEXT,
  currency_code currency_code NOT NULL DEFAULT 'USD',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER property_depreciation_updated_at
  BEFORE UPDATE ON public.property_depreciation
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.property_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties (id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents (id) ON DELETE CASCADE,
  document_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER property_documents_updated_at
  BEFORE UPDATE ON public.property_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- E. INVESTMENTS
-- =============================================================================

CREATE TABLE public.investment_entities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  tax_id TEXT,
  country country_code NOT NULL DEFAULT 'US',
  currency_code currency_code NOT NULL DEFAULT 'USD',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER investment_entities_updated_at
  BEFORE UPDATE ON public.investment_entities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.investments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  investment_type investment_type NOT NULL DEFAULT 'other',
  symbol TEXT,
  entity_id UUID REFERENCES public.investment_entities (id) ON DELETE SET NULL,
  currency_code currency_code NOT NULL DEFAULT 'USD',
  country country_code NOT NULL DEFAULT 'US',
  shares NUMERIC(18, 8),
  cost_basis NUMERIC(18, 2),
  current_value NUMERIC(18, 2),
  acquisition_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER investments_updated_at
  BEFORE UPDATE ON public.investments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.investment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  investment_id UUID NOT NULL REFERENCES public.investments (id) ON DELETE CASCADE,
  transaction_type investment_transaction_type NOT NULL,
  transaction_date DATE NOT NULL,
  shares NUMERIC(18, 8),
  price_per_share NUMERIC(18, 4),
  amount NUMERIC(18, 2) NOT NULL,
  currency_code currency_code NOT NULL DEFAULT 'USD',
  fees NUMERIC(18, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER investment_transactions_updated_at
  BEFORE UPDATE ON public.investment_transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.investment_distributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  investment_id UUID NOT NULL REFERENCES public.investments (id) ON DELETE CASCADE,
  entity_id UUID REFERENCES public.investment_entities (id) ON DELETE SET NULL,
  distribution_type TEXT NOT NULL,
  amount NUMERIC(18, 2) NOT NULL,
  currency_code currency_code NOT NULL DEFAULT 'USD',
  distribution_date DATE NOT NULL,
  is_reinvested BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER investment_distributions_updated_at
  BEFORE UPDATE ON public.investment_distributions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.investment_capital_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  investment_id UUID NOT NULL REFERENCES public.investments (id) ON DELETE CASCADE,
  entity_id UUID REFERENCES public.investment_entities (id) ON DELETE SET NULL,
  call_date DATE NOT NULL,
  due_date DATE,
  amount NUMERIC(18, 2) NOT NULL,
  amount_paid NUMERIC(18, 2) NOT NULL DEFAULT 0,
  currency_code currency_code NOT NULL DEFAULT 'USD',
  status capital_call_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER investment_capital_calls_updated_at
  BEFORE UPDATE ON public.investment_capital_calls
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.investment_valuations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  investment_id UUID NOT NULL REFERENCES public.investments (id) ON DELETE CASCADE,
  valuation_date DATE NOT NULL,
  value NUMERIC(18, 2) NOT NULL,
  currency_code currency_code NOT NULL DEFAULT 'USD',
  valuation_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER investment_valuations_updated_at
  BEFORE UPDATE ON public.investment_valuations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.investment_tax_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  investment_id UUID NOT NULL REFERENCES public.investments (id) ON DELETE CASCADE,
  tax_year INTEGER NOT NULL CHECK (tax_year >= 1900 AND tax_year <= 2100),
  item_type TEXT NOT NULL,
  amount NUMERIC(18, 2) NOT NULL,
  currency_code currency_code NOT NULL DEFAULT 'USD',
  description TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER investment_tax_items_updated_at
  BEFORE UPDATE ON public.investment_tax_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.precious_metals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  metal_type metal_type NOT NULL DEFAULT 'gold',
  weight_oz NUMERIC(18, 6) NOT NULL,
  purity NUMERIC(6, 4),
  acquisition_date DATE,
  acquisition_cost NUMERIC(18, 2),
  current_value NUMERIC(18, 2),
  currency_code currency_code NOT NULL DEFAULT 'USD',
  storage_location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER precious_metals_updated_at
  BEFORE UPDATE ON public.precious_metals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.investment_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  investment_id UUID NOT NULL REFERENCES public.investments (id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents (id) ON DELETE CASCADE,
  document_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER investment_documents_updated_at
  BEFORE UPDATE ON public.investment_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- F. TAX INTELLIGENCE
-- =============================================================================

CREATE TABLE public.tax_years (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  tax_year INTEGER NOT NULL CHECK (tax_year >= 1900 AND tax_year <= 2100),
  country country_code NOT NULL DEFAULT 'US',
  filing_status filing_status,
  is_filed BOOLEAN NOT NULL DEFAULT FALSE,
  filed_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, tax_year, country)
);

CREATE TRIGGER tax_years_updated_at
  BEFORE UPDATE ON public.tax_years
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.tax_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  tax_year_id UUID NOT NULL REFERENCES public.tax_years (id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents (id) ON DELETE CASCADE,
  form_type TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tax_documents_updated_at
  BEFORE UPDATE ON public.tax_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.tax_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  tax_year_id UUID NOT NULL REFERENCES public.tax_years (id) ON DELETE CASCADE,
  account_name TEXT NOT NULL,
  account_type TEXT,
  institution TEXT,
  account_number TEXT,
  currency_code currency_code NOT NULL DEFAULT 'USD',
  country country_code NOT NULL DEFAULT 'US',
  opening_balance NUMERIC(18, 2),
  closing_balance NUMERIC(18, 2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tax_accounts_updated_at
  BEFORE UPDATE ON public.tax_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.tax_income_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  tax_year_id UUID NOT NULL REFERENCES public.tax_years (id) ON DELETE CASCADE,
  income_type TEXT NOT NULL,
  source TEXT,
  amount NUMERIC(18, 2) NOT NULL,
  currency_code currency_code NOT NULL DEFAULT 'USD',
  country country_code NOT NULL DEFAULT 'US',
  is_foreign BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tax_income_items_updated_at
  BEFORE UPDATE ON public.tax_income_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.tax_expense_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  tax_year_id UUID NOT NULL REFERENCES public.tax_years (id) ON DELETE CASCADE,
  expense_type TEXT NOT NULL,
  category TEXT,
  amount NUMERIC(18, 2) NOT NULL,
  currency_code currency_code NOT NULL DEFAULT 'USD',
  is_deductible BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tax_expense_items_updated_at
  BEFORE UPDATE ON public.tax_expense_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.tax_deductions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  tax_year_id UUID NOT NULL REFERENCES public.tax_years (id) ON DELETE CASCADE,
  deduction_type TEXT NOT NULL,
  category TEXT,
  amount NUMERIC(18, 2) NOT NULL,
  currency_code currency_code NOT NULL DEFAULT 'USD',
  description TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tax_deductions_updated_at
  BEFORE UPDATE ON public.tax_deductions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.tax_foreign_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  tax_year_id UUID NOT NULL REFERENCES public.tax_years (id) ON DELETE CASCADE,
  account_name TEXT NOT NULL,
  institution TEXT,
  country country_code NOT NULL,
  account_number TEXT,
  max_value NUMERIC(18, 2) NOT NULL,
  currency_code currency_code NOT NULL DEFAULT 'USD',
  account_type TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tax_foreign_accounts_updated_at
  BEFORE UPDATE ON public.tax_foreign_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.tax_fbar_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  tax_year_id UUID NOT NULL REFERENCES public.tax_years (id) ON DELETE CASCADE,
  foreign_account_id UUID REFERENCES public.tax_foreign_accounts (id) ON DELETE SET NULL,
  max_value_usd NUMERIC(18, 2) NOT NULL,
  currency_code currency_code NOT NULL DEFAULT 'USD',
  country country_code NOT NULL,
  institution_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tax_fbar_items_updated_at
  BEFORE UPDATE ON public.tax_fbar_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.tax_form_8938_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  tax_year_id UUID NOT NULL REFERENCES public.tax_years (id) ON DELETE CASCADE,
  asset_description TEXT NOT NULL,
  asset_type TEXT,
  max_value NUMERIC(18, 2) NOT NULL,
  currency_code currency_code NOT NULL DEFAULT 'USD',
  country country_code NOT NULL,
  institution TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tax_form_8938_items_updated_at
  BEFORE UPDATE ON public.tax_form_8938_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.tax_schedule_e_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  tax_year_id UUID NOT NULL REFERENCES public.tax_years (id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties (id) ON DELETE SET NULL,
  rental_income NUMERIC(18, 2) NOT NULL DEFAULT 0,
  expenses NUMERIC(18, 2) NOT NULL DEFAULT 0,
  depreciation NUMERIC(18, 2) NOT NULL DEFAULT 0,
  net_income NUMERIC(18, 2) NOT NULL DEFAULT 0,
  currency_code currency_code NOT NULL DEFAULT 'USD',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tax_schedule_e_items_updated_at
  BEFORE UPDATE ON public.tax_schedule_e_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.tax_k1_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  tax_year_id UUID NOT NULL REFERENCES public.tax_years (id) ON DELETE CASCADE,
  entity_id UUID REFERENCES public.investment_entities (id) ON DELETE SET NULL,
  k1_type TEXT,
  ordinary_income NUMERIC(18, 2) DEFAULT 0,
  capital_gains NUMERIC(18, 2) DEFAULT 0,
  dividends NUMERIC(18, 2) DEFAULT 0,
  interest NUMERIC(18, 2) DEFAULT 0,
  other_income NUMERIC(18, 2) DEFAULT 0,
  currency_code currency_code NOT NULL DEFAULT 'USD',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tax_k1_items_updated_at
  BEFORE UPDATE ON public.tax_k1_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.tax_depreciation_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  tax_year_id UUID NOT NULL REFERENCES public.tax_years (id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties (id) ON DELETE SET NULL,
  asset_description TEXT,
  depreciation_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
  method TEXT,
  currency_code currency_code NOT NULL DEFAULT 'USD',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tax_depreciation_items_updated_at
  BEFORE UPDATE ON public.tax_depreciation_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.tax_exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  tax_year_id UUID NOT NULL REFERENCES public.tax_years (id) ON DELETE CASCADE,
  export_type TEXT NOT NULL,
  file_path TEXT,
  export_status export_status NOT NULL DEFAULT 'pending',
  exported_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tax_exports_updated_at
  BEFORE UPDATE ON public.tax_exports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- AUTH TRIGGER — auto-create profile on signup
-- =============================================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- INDEXES
-- =============================================================================

-- user_id indexes (all user-owned tables)
CREATE INDEX idx_exchange_rates_user_id ON public.exchange_rates (user_id);
CREATE INDEX idx_documents_user_id ON public.documents (user_id);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs (user_id);
CREATE INDEX idx_accounts_user_id ON public.accounts (user_id);
CREATE INDEX idx_assets_user_id ON public.assets (user_id);
CREATE INDEX idx_liabilities_user_id ON public.liabilities (user_id);
CREATE INDEX idx_income_sources_user_id ON public.income_sources (user_id);
CREATE INDEX idx_expenses_user_id ON public.expenses (user_id);
CREATE INDEX idx_monthly_snapshots_user_id ON public.monthly_snapshots (user_id);
CREATE INDEX idx_bank_accounts_user_id ON public.bank_accounts (user_id);
CREATE INDEX idx_bank_balances_user_id ON public.bank_balances (user_id);
CREATE INDEX idx_bank_transactions_user_id ON public.bank_transactions (user_id);
CREATE INDEX idx_transaction_categories_user_id ON public.transaction_categories (user_id);
CREATE INDEX idx_recurring_transactions_user_id ON public.recurring_transactions (user_id);
CREATE INDEX idx_import_files_user_id ON public.import_files (user_id);
CREATE INDEX idx_properties_user_id ON public.properties (user_id);
CREATE INDEX idx_property_mortgages_user_id ON public.property_mortgages (user_id);
CREATE INDEX idx_property_income_user_id ON public.property_income (user_id);
CREATE INDEX idx_property_expenses_user_id ON public.property_expenses (user_id);
CREATE INDEX idx_property_tenants_user_id ON public.property_tenants (user_id);
CREATE INDEX idx_property_valuations_user_id ON public.property_valuations (user_id);
CREATE INDEX idx_property_depreciation_user_id ON public.property_depreciation (user_id);
CREATE INDEX idx_property_documents_user_id ON public.property_documents (user_id);
CREATE INDEX idx_investments_user_id ON public.investments (user_id);
CREATE INDEX idx_investment_entities_user_id ON public.investment_entities (user_id);
CREATE INDEX idx_investment_transactions_user_id ON public.investment_transactions (user_id);
CREATE INDEX idx_investment_distributions_user_id ON public.investment_distributions (user_id);
CREATE INDEX idx_investment_capital_calls_user_id ON public.investment_capital_calls (user_id);
CREATE INDEX idx_investment_valuations_user_id ON public.investment_valuations (user_id);
CREATE INDEX idx_investment_tax_items_user_id ON public.investment_tax_items (user_id);
CREATE INDEX idx_precious_metals_user_id ON public.precious_metals (user_id);
CREATE INDEX idx_investment_documents_user_id ON public.investment_documents (user_id);
CREATE INDEX idx_tax_years_user_id ON public.tax_years (user_id);
CREATE INDEX idx_tax_documents_user_id ON public.tax_documents (user_id);
CREATE INDEX idx_tax_accounts_user_id ON public.tax_accounts (user_id);
CREATE INDEX idx_tax_income_items_user_id ON public.tax_income_items (user_id);
CREATE INDEX idx_tax_expense_items_user_id ON public.tax_expense_items (user_id);
CREATE INDEX idx_tax_deductions_user_id ON public.tax_deductions (user_id);
CREATE INDEX idx_tax_foreign_accounts_user_id ON public.tax_foreign_accounts (user_id);
CREATE INDEX idx_tax_fbar_items_user_id ON public.tax_fbar_items (user_id);
CREATE INDEX idx_tax_form_8938_items_user_id ON public.tax_form_8938_items (user_id);
CREATE INDEX idx_tax_schedule_e_items_user_id ON public.tax_schedule_e_items (user_id);
CREATE INDEX idx_tax_k1_items_user_id ON public.tax_k1_items (user_id);
CREATE INDEX idx_tax_depreciation_items_user_id ON public.tax_depreciation_items (user_id);
CREATE INDEX idx_tax_exports_user_id ON public.tax_exports (user_id);

-- Foreign key indexes
CREATE INDEX idx_exchange_rates_base_currency ON public.exchange_rates (base_currency);
CREATE INDEX idx_exchange_rates_quote_currency ON public.exchange_rates (quote_currency);
CREATE INDEX idx_bank_balances_bank_account_id ON public.bank_balances (bank_account_id);
CREATE INDEX idx_bank_transactions_bank_account_id ON public.bank_transactions (bank_account_id);
CREATE INDEX idx_bank_transactions_category_id ON public.bank_transactions (category_id);
CREATE INDEX idx_recurring_transactions_bank_account_id ON public.recurring_transactions (bank_account_id);
CREATE INDEX idx_recurring_transactions_category_id ON public.recurring_transactions (category_id);
CREATE INDEX idx_import_files_bank_account_id ON public.import_files (bank_account_id);
CREATE INDEX idx_property_mortgages_property_id ON public.property_mortgages (property_id);
CREATE INDEX idx_property_income_property_id ON public.property_income (property_id);
CREATE INDEX idx_property_income_tenant_id ON public.property_income (tenant_id);
CREATE INDEX idx_property_expenses_property_id ON public.property_expenses (property_id);
CREATE INDEX idx_property_tenants_property_id ON public.property_tenants (property_id);
CREATE INDEX idx_property_valuations_property_id ON public.property_valuations (property_id);
CREATE INDEX idx_property_depreciation_property_id ON public.property_depreciation (property_id);
CREATE INDEX idx_property_documents_property_id ON public.property_documents (property_id);
CREATE INDEX idx_property_documents_document_id ON public.property_documents (document_id);
CREATE INDEX idx_investments_entity_id ON public.investments (entity_id);
CREATE INDEX idx_investment_transactions_investment_id ON public.investment_transactions (investment_id);
CREATE INDEX idx_investment_distributions_investment_id ON public.investment_distributions (investment_id);
CREATE INDEX idx_investment_distributions_entity_id ON public.investment_distributions (entity_id);
CREATE INDEX idx_investment_capital_calls_investment_id ON public.investment_capital_calls (investment_id);
CREATE INDEX idx_investment_valuations_investment_id ON public.investment_valuations (investment_id);
CREATE INDEX idx_investment_tax_items_investment_id ON public.investment_tax_items (investment_id);
CREATE INDEX idx_investment_documents_investment_id ON public.investment_documents (investment_id);
CREATE INDEX idx_investment_documents_document_id ON public.investment_documents (document_id);
CREATE INDEX idx_tax_documents_tax_year_id ON public.tax_documents (tax_year_id);
CREATE INDEX idx_tax_documents_document_id ON public.tax_documents (document_id);
CREATE INDEX idx_tax_accounts_tax_year_id ON public.tax_accounts (tax_year_id);
CREATE INDEX idx_tax_income_items_tax_year_id ON public.tax_income_items (tax_year_id);
CREATE INDEX idx_tax_expense_items_tax_year_id ON public.tax_expense_items (tax_year_id);
CREATE INDEX idx_tax_deductions_tax_year_id ON public.tax_deductions (tax_year_id);
CREATE INDEX idx_tax_foreign_accounts_tax_year_id ON public.tax_foreign_accounts (tax_year_id);
CREATE INDEX idx_tax_fbar_items_tax_year_id ON public.tax_fbar_items (tax_year_id);
CREATE INDEX idx_tax_fbar_items_foreign_account_id ON public.tax_fbar_items (foreign_account_id);
CREATE INDEX idx_tax_form_8938_items_tax_year_id ON public.tax_form_8938_items (tax_year_id);
CREATE INDEX idx_tax_schedule_e_items_tax_year_id ON public.tax_schedule_e_items (tax_year_id);
CREATE INDEX idx_tax_schedule_e_items_property_id ON public.tax_schedule_e_items (property_id);
CREATE INDEX idx_tax_k1_items_tax_year_id ON public.tax_k1_items (tax_year_id);
CREATE INDEX idx_tax_k1_items_entity_id ON public.tax_k1_items (entity_id);
CREATE INDEX idx_tax_depreciation_items_tax_year_id ON public.tax_depreciation_items (tax_year_id);
CREATE INDEX idx_tax_depreciation_items_property_id ON public.tax_depreciation_items (property_id);
CREATE INDEX idx_tax_exports_tax_year_id ON public.tax_exports (tax_year_id);
CREATE INDEX idx_transaction_categories_parent_id ON public.transaction_categories (parent_category_id);

-- Date field indexes
CREATE INDEX idx_exchange_rates_effective_date ON public.exchange_rates (effective_date);
CREATE INDEX idx_monthly_snapshots_snapshot_month ON public.monthly_snapshots (snapshot_month);
CREATE INDEX idx_bank_balances_balance_date ON public.bank_balances (balance_date);
CREATE INDEX idx_bank_transactions_transaction_date ON public.bank_transactions (transaction_date);
CREATE INDEX idx_bank_transactions_posted_date ON public.bank_transactions (posted_date);
CREATE INDEX idx_recurring_transactions_next_date ON public.recurring_transactions (next_date);
CREATE INDEX idx_property_income_income_date ON public.property_income (income_date);
CREATE INDEX idx_property_expenses_expense_date ON public.property_expenses (expense_date);
CREATE INDEX idx_property_valuations_valuation_date ON public.property_valuations (valuation_date);
CREATE INDEX idx_investment_transactions_transaction_date ON public.investment_transactions (transaction_date);
CREATE INDEX idx_investment_distributions_distribution_date ON public.investment_distributions (distribution_date);
CREATE INDEX idx_investment_capital_calls_call_date ON public.investment_capital_calls (call_date);
CREATE INDEX idx_investment_valuations_valuation_date ON public.investment_valuations (valuation_date);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs (created_at);

-- Category / type indexes
CREATE INDEX idx_assets_category ON public.assets (category);
CREATE INDEX idx_assets_asset_type ON public.assets (asset_type);
CREATE INDEX idx_liabilities_category ON public.liabilities (category);
CREATE INDEX idx_liabilities_liability_type ON public.liabilities (liability_type);
CREATE INDEX idx_income_sources_category ON public.income_sources (category);
CREATE INDEX idx_expenses_category ON public.expenses (category);
CREATE INDEX idx_bank_transactions_transaction_type ON public.bank_transactions (transaction_type);
CREATE INDEX idx_property_expenses_category ON public.property_expenses (category);
CREATE INDEX idx_investments_investment_type ON public.investments (investment_type);
CREATE INDEX idx_tax_income_items_income_type ON public.tax_income_items (income_type);
CREATE INDEX idx_tax_expense_items_category ON public.tax_expense_items (category);
CREATE INDEX idx_tax_deductions_category ON public.tax_deductions (category);

-- tax_year indexes
CREATE INDEX idx_property_depreciation_tax_year ON public.property_depreciation (tax_year);
CREATE INDEX idx_investment_tax_items_tax_year ON public.investment_tax_items (tax_year);
CREATE INDEX idx_tax_years_tax_year ON public.tax_years (tax_year);

-- Plaid future integration indexes
CREATE INDEX idx_accounts_plaid_account_id ON public.accounts (plaid_account_id) WHERE plaid_account_id IS NOT NULL;
CREATE INDEX idx_bank_accounts_plaid_account_id ON public.bank_accounts (plaid_account_id) WHERE plaid_account_id IS NOT NULL;
CREATE INDEX idx_bank_transactions_plaid_transaction_id ON public.bank_transactions (plaid_transaction_id) WHERE plaid_transaction_id IS NOT NULL;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_mortgages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_valuations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_depreciation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_capital_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_valuations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_tax_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.precious_metals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_income_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_expense_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_foreign_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_fbar_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_form_8938_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_schedule_e_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_k1_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_depreciation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_exports ENABLE ROW LEVEL SECURITY;

-- Profiles: id matches auth.uid()
CREATE POLICY profiles_select_own ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY profiles_insert_own ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY profiles_delete_own ON public.profiles FOR DELETE USING (auth.uid() = id);

-- Currencies: read-only for authenticated users (system reference data)
CREATE POLICY currencies_select_authenticated ON public.currencies
  FOR SELECT TO authenticated USING (TRUE);

-- Generic user-owned table RLS macro via individual policies
-- exchange_rates
CREATE POLICY exchange_rates_select_own ON public.exchange_rates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY exchange_rates_insert_own ON public.exchange_rates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY exchange_rates_update_own ON public.exchange_rates FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY exchange_rates_delete_own ON public.exchange_rates FOR DELETE USING (auth.uid() = user_id);

-- documents
CREATE POLICY documents_select_own ON public.documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY documents_insert_own ON public.documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY documents_update_own ON public.documents FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY documents_delete_own ON public.documents FOR DELETE USING (auth.uid() = user_id);

-- audit_logs
CREATE POLICY audit_logs_select_own ON public.audit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY audit_logs_insert_own ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY audit_logs_update_own ON public.audit_logs FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY audit_logs_delete_own ON public.audit_logs FOR DELETE USING (auth.uid() = user_id);

-- accounts
CREATE POLICY accounts_select_own ON public.accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY accounts_insert_own ON public.accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY accounts_update_own ON public.accounts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY accounts_delete_own ON public.accounts FOR DELETE USING (auth.uid() = user_id);

-- assets
CREATE POLICY assets_select_own ON public.assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY assets_insert_own ON public.assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY assets_update_own ON public.assets FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY assets_delete_own ON public.assets FOR DELETE USING (auth.uid() = user_id);

-- liabilities
CREATE POLICY liabilities_select_own ON public.liabilities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY liabilities_insert_own ON public.liabilities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY liabilities_update_own ON public.liabilities FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY liabilities_delete_own ON public.liabilities FOR DELETE USING (auth.uid() = user_id);

-- income_sources
CREATE POLICY income_sources_select_own ON public.income_sources FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY income_sources_insert_own ON public.income_sources FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY income_sources_update_own ON public.income_sources FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY income_sources_delete_own ON public.income_sources FOR DELETE USING (auth.uid() = user_id);

-- expenses
CREATE POLICY expenses_select_own ON public.expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY expenses_insert_own ON public.expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY expenses_update_own ON public.expenses FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY expenses_delete_own ON public.expenses FOR DELETE USING (auth.uid() = user_id);

-- monthly_snapshots
CREATE POLICY monthly_snapshots_select_own ON public.monthly_snapshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY monthly_snapshots_insert_own ON public.monthly_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY monthly_snapshots_update_own ON public.monthly_snapshots FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY monthly_snapshots_delete_own ON public.monthly_snapshots FOR DELETE USING (auth.uid() = user_id);

-- bank_accounts
CREATE POLICY bank_accounts_select_own ON public.bank_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY bank_accounts_insert_own ON public.bank_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY bank_accounts_update_own ON public.bank_accounts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY bank_accounts_delete_own ON public.bank_accounts FOR DELETE USING (auth.uid() = user_id);

-- bank_balances
CREATE POLICY bank_balances_select_own ON public.bank_balances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY bank_balances_insert_own ON public.bank_balances FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY bank_balances_update_own ON public.bank_balances FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY bank_balances_delete_own ON public.bank_balances FOR DELETE USING (auth.uid() = user_id);

-- bank_transactions
CREATE POLICY bank_transactions_select_own ON public.bank_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY bank_transactions_insert_own ON public.bank_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY bank_transactions_update_own ON public.bank_transactions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY bank_transactions_delete_own ON public.bank_transactions FOR DELETE USING (auth.uid() = user_id);

-- transaction_categories
CREATE POLICY transaction_categories_select_own ON public.transaction_categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY transaction_categories_insert_own ON public.transaction_categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY transaction_categories_update_own ON public.transaction_categories FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY transaction_categories_delete_own ON public.transaction_categories FOR DELETE USING (auth.uid() = user_id);

-- recurring_transactions
CREATE POLICY recurring_transactions_select_own ON public.recurring_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY recurring_transactions_insert_own ON public.recurring_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY recurring_transactions_update_own ON public.recurring_transactions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY recurring_transactions_delete_own ON public.recurring_transactions FOR DELETE USING (auth.uid() = user_id);

-- import_files
CREATE POLICY import_files_select_own ON public.import_files FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY import_files_insert_own ON public.import_files FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY import_files_update_own ON public.import_files FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY import_files_delete_own ON public.import_files FOR DELETE USING (auth.uid() = user_id);

-- properties
CREATE POLICY properties_select_own ON public.properties FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY properties_insert_own ON public.properties FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY properties_update_own ON public.properties FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY properties_delete_own ON public.properties FOR DELETE USING (auth.uid() = user_id);

-- property_mortgages
CREATE POLICY property_mortgages_select_own ON public.property_mortgages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY property_mortgages_insert_own ON public.property_mortgages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY property_mortgages_update_own ON public.property_mortgages FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY property_mortgages_delete_own ON public.property_mortgages FOR DELETE USING (auth.uid() = user_id);

-- property_income
CREATE POLICY property_income_select_own ON public.property_income FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY property_income_insert_own ON public.property_income FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY property_income_update_own ON public.property_income FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY property_income_delete_own ON public.property_income FOR DELETE USING (auth.uid() = user_id);

-- property_expenses
CREATE POLICY property_expenses_select_own ON public.property_expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY property_expenses_insert_own ON public.property_expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY property_expenses_update_own ON public.property_expenses FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY property_expenses_delete_own ON public.property_expenses FOR DELETE USING (auth.uid() = user_id);

-- property_tenants
CREATE POLICY property_tenants_select_own ON public.property_tenants FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY property_tenants_insert_own ON public.property_tenants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY property_tenants_update_own ON public.property_tenants FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY property_tenants_delete_own ON public.property_tenants FOR DELETE USING (auth.uid() = user_id);

-- property_valuations
CREATE POLICY property_valuations_select_own ON public.property_valuations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY property_valuations_insert_own ON public.property_valuations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY property_valuations_update_own ON public.property_valuations FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY property_valuations_delete_own ON public.property_valuations FOR DELETE USING (auth.uid() = user_id);

-- property_depreciation
CREATE POLICY property_depreciation_select_own ON public.property_depreciation FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY property_depreciation_insert_own ON public.property_depreciation FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY property_depreciation_update_own ON public.property_depreciation FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY property_depreciation_delete_own ON public.property_depreciation FOR DELETE USING (auth.uid() = user_id);

-- property_documents
CREATE POLICY property_documents_select_own ON public.property_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY property_documents_insert_own ON public.property_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY property_documents_update_own ON public.property_documents FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY property_documents_delete_own ON public.property_documents FOR DELETE USING (auth.uid() = user_id);

-- investments
CREATE POLICY investments_select_own ON public.investments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY investments_insert_own ON public.investments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY investments_update_own ON public.investments FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY investments_delete_own ON public.investments FOR DELETE USING (auth.uid() = user_id);

-- investment_entities
CREATE POLICY investment_entities_select_own ON public.investment_entities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY investment_entities_insert_own ON public.investment_entities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY investment_entities_update_own ON public.investment_entities FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY investment_entities_delete_own ON public.investment_entities FOR DELETE USING (auth.uid() = user_id);

-- investment_transactions
CREATE POLICY investment_transactions_select_own ON public.investment_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY investment_transactions_insert_own ON public.investment_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY investment_transactions_update_own ON public.investment_transactions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY investment_transactions_delete_own ON public.investment_transactions FOR DELETE USING (auth.uid() = user_id);

-- investment_distributions
CREATE POLICY investment_distributions_select_own ON public.investment_distributions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY investment_distributions_insert_own ON public.investment_distributions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY investment_distributions_update_own ON public.investment_distributions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY investment_distributions_delete_own ON public.investment_distributions FOR DELETE USING (auth.uid() = user_id);

-- investment_capital_calls
CREATE POLICY investment_capital_calls_select_own ON public.investment_capital_calls FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY investment_capital_calls_insert_own ON public.investment_capital_calls FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY investment_capital_calls_update_own ON public.investment_capital_calls FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY investment_capital_calls_delete_own ON public.investment_capital_calls FOR DELETE USING (auth.uid() = user_id);

-- investment_valuations
CREATE POLICY investment_valuations_select_own ON public.investment_valuations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY investment_valuations_insert_own ON public.investment_valuations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY investment_valuations_update_own ON public.investment_valuations FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY investment_valuations_delete_own ON public.investment_valuations FOR DELETE USING (auth.uid() = user_id);

-- investment_tax_items
CREATE POLICY investment_tax_items_select_own ON public.investment_tax_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY investment_tax_items_insert_own ON public.investment_tax_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY investment_tax_items_update_own ON public.investment_tax_items FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY investment_tax_items_delete_own ON public.investment_tax_items FOR DELETE USING (auth.uid() = user_id);

-- precious_metals
CREATE POLICY precious_metals_select_own ON public.precious_metals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY precious_metals_insert_own ON public.precious_metals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY precious_metals_update_own ON public.precious_metals FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY precious_metals_delete_own ON public.precious_metals FOR DELETE USING (auth.uid() = user_id);

-- investment_documents
CREATE POLICY investment_documents_select_own ON public.investment_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY investment_documents_insert_own ON public.investment_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY investment_documents_update_own ON public.investment_documents FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY investment_documents_delete_own ON public.investment_documents FOR DELETE USING (auth.uid() = user_id);

-- tax_years
CREATE POLICY tax_years_select_own ON public.tax_years FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY tax_years_insert_own ON public.tax_years FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY tax_years_update_own ON public.tax_years FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY tax_years_delete_own ON public.tax_years FOR DELETE USING (auth.uid() = user_id);

-- tax_documents
CREATE POLICY tax_documents_select_own ON public.tax_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY tax_documents_insert_own ON public.tax_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY tax_documents_update_own ON public.tax_documents FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY tax_documents_delete_own ON public.tax_documents FOR DELETE USING (auth.uid() = user_id);

-- tax_accounts
CREATE POLICY tax_accounts_select_own ON public.tax_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY tax_accounts_insert_own ON public.tax_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY tax_accounts_update_own ON public.tax_accounts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY tax_accounts_delete_own ON public.tax_accounts FOR DELETE USING (auth.uid() = user_id);

-- tax_income_items
CREATE POLICY tax_income_items_select_own ON public.tax_income_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY tax_income_items_insert_own ON public.tax_income_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY tax_income_items_update_own ON public.tax_income_items FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY tax_income_items_delete_own ON public.tax_income_items FOR DELETE USING (auth.uid() = user_id);

-- tax_expense_items
CREATE POLICY tax_expense_items_select_own ON public.tax_expense_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY tax_expense_items_insert_own ON public.tax_expense_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY tax_expense_items_update_own ON public.tax_expense_items FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY tax_expense_items_delete_own ON public.tax_expense_items FOR DELETE USING (auth.uid() = user_id);

-- tax_deductions
CREATE POLICY tax_deductions_select_own ON public.tax_deductions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY tax_deductions_insert_own ON public.tax_deductions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY tax_deductions_update_own ON public.tax_deductions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY tax_deductions_delete_own ON public.tax_deductions FOR DELETE USING (auth.uid() = user_id);

-- tax_foreign_accounts
CREATE POLICY tax_foreign_accounts_select_own ON public.tax_foreign_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY tax_foreign_accounts_insert_own ON public.tax_foreign_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY tax_foreign_accounts_update_own ON public.tax_foreign_accounts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY tax_foreign_accounts_delete_own ON public.tax_foreign_accounts FOR DELETE USING (auth.uid() = user_id);

-- tax_fbar_items
CREATE POLICY tax_fbar_items_select_own ON public.tax_fbar_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY tax_fbar_items_insert_own ON public.tax_fbar_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY tax_fbar_items_update_own ON public.tax_fbar_items FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY tax_fbar_items_delete_own ON public.tax_fbar_items FOR DELETE USING (auth.uid() = user_id);

-- tax_form_8938_items
CREATE POLICY tax_form_8938_items_select_own ON public.tax_form_8938_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY tax_form_8938_items_insert_own ON public.tax_form_8938_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY tax_form_8938_items_update_own ON public.tax_form_8938_items FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY tax_form_8938_items_delete_own ON public.tax_form_8938_items FOR DELETE USING (auth.uid() = user_id);

-- tax_schedule_e_items
CREATE POLICY tax_schedule_e_items_select_own ON public.tax_schedule_e_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY tax_schedule_e_items_insert_own ON public.tax_schedule_e_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY tax_schedule_e_items_update_own ON public.tax_schedule_e_items FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY tax_schedule_e_items_delete_own ON public.tax_schedule_e_items FOR DELETE USING (auth.uid() = user_id);

-- tax_k1_items
CREATE POLICY tax_k1_items_select_own ON public.tax_k1_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY tax_k1_items_insert_own ON public.tax_k1_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY tax_k1_items_update_own ON public.tax_k1_items FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY tax_k1_items_delete_own ON public.tax_k1_items FOR DELETE USING (auth.uid() = user_id);

-- tax_depreciation_items
CREATE POLICY tax_depreciation_items_select_own ON public.tax_depreciation_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY tax_depreciation_items_insert_own ON public.tax_depreciation_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY tax_depreciation_items_update_own ON public.tax_depreciation_items FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY tax_depreciation_items_delete_own ON public.tax_depreciation_items FOR DELETE USING (auth.uid() = user_id);

-- tax_exports
CREATE POLICY tax_exports_select_own ON public.tax_exports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY tax_exports_insert_own ON public.tax_exports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY tax_exports_update_own ON public.tax_exports FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY tax_exports_delete_own ON public.tax_exports FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- G. EXECUTIVE DASHBOARD VIEWS
-- =============================================================================

CREATE OR REPLACE VIEW public.executive_net_worth_summary
WITH (security_invoker = TRUE) AS
SELECT
  a.user_id,
  a.currency_code,
  COALESCE(SUM(a.current_value), 0) AS total_assets,
  COALESCE((
    SELECT SUM(l.current_balance)
    FROM public.liabilities l
    WHERE l.user_id = a.user_id AND l.currency_code = a.currency_code
  ), 0) AS total_liabilities,
  COALESCE(SUM(a.current_value), 0) - COALESCE((
    SELECT SUM(l.current_balance)
    FROM public.liabilities l
    WHERE l.user_id = a.user_id AND l.currency_code = a.currency_code
  ), 0) AS net_worth,
  COALESCE((
    SELECT SUM(i.current_value)
    FROM public.investments i
    WHERE i.user_id = a.user_id AND i.is_active AND i.currency_code = a.currency_code
  ), 0) AS investment_value,
  COALESCE((
    SELECT SUM(p.current_value)
    FROM public.properties p
    WHERE p.user_id = a.user_id AND p.is_active AND p.currency_code = a.currency_code
  ), 0) AS real_estate_value,
  COALESCE((
    SELECT SUM(pm.current_value)
    FROM public.precious_metals pm
    WHERE pm.user_id = a.user_id AND pm.currency_code = a.currency_code
  ), 0) AS precious_metals_value
FROM public.assets a
GROUP BY a.user_id, a.currency_code;

CREATE OR REPLACE VIEW public.executive_cash_flow_summary
WITH (security_invoker = TRUE) AS
SELECT
  ms.user_id,
  ms.currency_code,
  ms.snapshot_month,
  ms.total_income,
  ms.total_expenses,
  ms.cash_flow,
  COALESCE((
    SELECT SUM(inc.amount)
    FROM public.income_sources inc
    WHERE inc.user_id = ms.user_id
      AND inc.is_active
      AND inc.currency_code = ms.currency_code
      AND inc.frequency = 'monthly'
  ), 0) AS monthly_recurring_income,
  COALESCE((
    SELECT SUM(exp.amount)
    FROM public.expenses exp
    WHERE exp.user_id = ms.user_id
      AND exp.is_active
      AND exp.currency_code = ms.currency_code
      AND exp.frequency = 'monthly'
  ), 0) AS monthly_recurring_expenses
FROM public.monthly_snapshots ms;

CREATE OR REPLACE VIEW public.executive_asset_allocation
WITH (security_invoker = TRUE) AS
SELECT user_id, currency_code, asset_type::TEXT AS allocation_category,
  SUM(current_value) AS total_value,
  ROUND(
    100.0 * SUM(current_value) / NULLIF(SUM(SUM(current_value)) OVER (PARTITION BY user_id, currency_code), 0),
    2
  ) AS percentage
FROM public.assets
GROUP BY user_id, currency_code, asset_type
UNION ALL
SELECT user_id, currency_code, investment_type::TEXT AS allocation_category,
  SUM(current_value) AS total_value,
  ROUND(
    100.0 * SUM(current_value) / NULLIF(SUM(SUM(current_value)) OVER (PARTITION BY user_id, currency_code), 0),
    2
  ) AS percentage
FROM public.investments
WHERE is_active
GROUP BY user_id, currency_code, investment_type
UNION ALL
SELECT user_id, currency_code, 'precious_metal' AS allocation_category,
  SUM(current_value) AS total_value,
  ROUND(
    100.0 * SUM(current_value) / NULLIF(SUM(SUM(current_value)) OVER (PARTITION BY user_id, currency_code), 0),
    2
  ) AS percentage
FROM public.precious_metals
GROUP BY user_id, currency_code;

CREATE OR REPLACE VIEW public.executive_liquidity_summary
WITH (security_invoker = TRUE) AS
SELECT
  ba.user_id,
  ba.currency_code,
  COUNT(DISTINCT ba.id) AS bank_account_count,
  COALESCE(SUM(latest.balance), 0) AS total_cash_balance,
  COALESCE((
    SELECT SUM(ac.balance)
    FROM public.accounts ac
    WHERE ac.user_id = ba.user_id
      AND ac.is_active
      AND ac.account_type IN ('checking', 'savings')
      AND ac.currency_code = ba.currency_code
  ), 0) AS hub_cash_balance
FROM public.bank_accounts ba
LEFT JOIN LATERAL (
  SELECT bb.balance
  FROM public.bank_balances bb
  WHERE bb.bank_account_id = ba.id
  ORDER BY bb.balance_date DESC
  LIMIT 1
) latest ON TRUE
WHERE ba.is_active
GROUP BY ba.user_id, ba.currency_code;

CREATE OR REPLACE VIEW public.executive_passive_income_summary
WITH (security_invoker = TRUE) AS
SELECT
  inc.user_id,
  inc.currency_code,
  SUM(CASE WHEN inc.is_passive THEN inc.amount ELSE 0 END) AS total_passive_income,
  SUM(CASE WHEN NOT inc.is_passive THEN inc.amount ELSE 0 END) AS total_active_income,
  SUM(inc.amount) AS total_income,
  COUNT(*) FILTER (WHERE inc.is_passive) AS passive_source_count,
  COALESCE((
    SELECT SUM(pi.amount)
    FROM public.property_income pi
    WHERE pi.user_id = inc.user_id AND pi.currency_code = inc.currency_code
      AND pi.income_date >= DATE_TRUNC('year', CURRENT_DATE)
  ), 0) AS rental_income_ytd,
  COALESCE((
    SELECT SUM(id.amount)
    FROM public.investment_distributions id
    WHERE id.user_id = inc.user_id AND id.currency_code = inc.currency_code
      AND id.distribution_date >= DATE_TRUNC('year', CURRENT_DATE)
  ), 0) AS investment_distributions_ytd
FROM public.income_sources inc
WHERE inc.is_active
GROUP BY inc.user_id, inc.currency_code;

CREATE OR REPLACE VIEW public.executive_tax_summary
WITH (security_invoker = TRUE) AS
SELECT
  ty.user_id,
  ty.tax_year,
  ty.country,
  ty.filing_status,
  ty.is_filed,
  COALESCE((
    SELECT SUM(ti.amount)
    FROM public.tax_income_items ti
    WHERE ti.tax_year_id = ty.id
  ), 0) AS total_taxable_income,
  COALESCE((
    SELECT SUM(td.amount)
    FROM public.tax_deductions td
    WHERE td.tax_year_id = ty.id
  ), 0) AS total_deductions,
  COALESCE((
    SELECT SUM(te.amount)
    FROM public.tax_expense_items te
    WHERE te.tax_year_id = ty.id AND te.is_deductible
  ), 0) AS total_deductible_expenses,
  COALESCE((
    SELECT COUNT(*)
    FROM public.tax_foreign_accounts tfa
    WHERE tfa.tax_year_id = ty.id
  ), 0) AS foreign_account_count,
  COALESCE((
    SELECT SUM(tfi.max_value_usd)
    FROM public.tax_fbar_items tfi
    WHERE tfi.tax_year_id = ty.id
  ), 0) AS total_fbar_value_usd
FROM public.tax_years ty;

CREATE OR REPLACE VIEW public.executive_real_estate_summary
WITH (security_invoker = TRUE) AS
SELECT
  p.user_id,
  p.currency_code,
  COUNT(*) AS property_count,
  SUM(p.current_value) AS total_property_value,
  COALESCE((
    SELECT SUM(pm.current_balance)
    FROM public.property_mortgages pm
    JOIN public.properties prop ON prop.id = pm.property_id
    WHERE prop.user_id = p.user_id AND prop.currency_code = p.currency_code AND prop.is_active
  ), 0) AS total_mortgage_balance,
  COALESCE((
    SELECT SUM(pi.amount)
    FROM public.property_income pi
    JOIN public.properties prop ON prop.id = pi.property_id
    WHERE prop.user_id = p.user_id AND prop.currency_code = p.currency_code
      AND pi.income_date >= DATE_TRUNC('year', CURRENT_DATE)
  ), 0) AS rental_income_ytd,
  COALESCE((
    SELECT SUM(pe.amount)
    FROM public.property_expenses pe
    JOIN public.properties prop ON prop.id = pe.property_id
    WHERE prop.user_id = p.user_id AND prop.currency_code = p.currency_code
      AND pe.expense_date >= DATE_TRUNC('year', CURRENT_DATE)
  ), 0) AS property_expenses_ytd,
  COUNT(*) FILTER (WHERE p.is_rental) AS rental_property_count
FROM public.properties p
WHERE p.is_active
GROUP BY p.user_id, p.currency_code;

CREATE OR REPLACE VIEW public.executive_investment_summary
WITH (security_invoker = TRUE) AS
SELECT
  i.user_id,
  i.currency_code,
  COUNT(*) AS investment_count,
  SUM(i.current_value) AS total_current_value,
  SUM(i.cost_basis) AS total_cost_basis,
  SUM(i.current_value) - COALESCE(SUM(i.cost_basis), 0) AS total_unrealized_gain,
  COALESCE((
    SELECT SUM(id.amount)
    FROM public.investment_distributions id
    JOIN public.investments inv ON inv.id = id.investment_id
    WHERE inv.user_id = i.user_id AND inv.currency_code = i.currency_code AND inv.is_active
      AND id.distribution_date >= DATE_TRUNC('year', CURRENT_DATE)
  ), 0) AS distributions_ytd,
  COALESCE((
    SELECT SUM(icc.amount - icc.amount_paid)
    FROM public.investment_capital_calls icc
    JOIN public.investments inv ON inv.id = icc.investment_id
    WHERE inv.user_id = i.user_id AND inv.currency_code = i.currency_code AND inv.is_active
      AND icc.status IN ('pending', 'partial')
  ), 0) AS pending_capital_calls
FROM public.investments i
WHERE i.is_active
GROUP BY i.user_id, i.currency_code;

CREATE OR REPLACE VIEW public.executive_financial_independence_summary
WITH (security_invoker = TRUE) AS
WITH passive AS (
  SELECT user_id, currency_code,
    SUM(CASE WHEN is_passive AND frequency = 'monthly' THEN amount ELSE 0 END) AS monthly_passive_income
  FROM public.income_sources
  WHERE is_active
  GROUP BY user_id, currency_code
),
expenses AS (
  SELECT user_id, currency_code,
    SUM(CASE WHEN frequency = 'monthly' THEN amount ELSE 0 END) AS monthly_expenses
  FROM public.expenses
  WHERE is_active
  GROUP BY user_id, currency_code
),
net_worth AS (
  SELECT user_id, currency_code, net_worth
  FROM public.executive_net_worth_summary
)
SELECT
  COALESCE(p.user_id, e.user_id, nw.user_id) AS user_id,
  COALESCE(p.currency_code, e.currency_code, nw.currency_code) AS currency_code,
  COALESCE(p.monthly_passive_income, 0) AS monthly_passive_income,
  COALESCE(e.monthly_expenses, 0) AS monthly_expenses,
  COALESCE(nw.net_worth, 0) AS net_worth,
  CASE
    WHEN COALESCE(e.monthly_expenses, 0) > 0
    THEN ROUND(COALESCE(p.monthly_passive_income, 0) / e.monthly_expenses * 100, 2)
    ELSE NULL
  END AS passive_income_coverage_pct,
  CASE
    WHEN COALESCE(p.monthly_passive_income, 0) > 0
    THEN ROUND(COALESCE(nw.net_worth, 0) / (p.monthly_passive_income * 12 * 25), 2)
    ELSE NULL
  END AS years_to_fi_multiple_25x
FROM passive p
FULL OUTER JOIN expenses e
  ON p.user_id = e.user_id AND p.currency_code = e.currency_code
FULL OUTER JOIN net_worth nw
  ON COALESCE(p.user_id, e.user_id) = nw.user_id
  AND COALESCE(p.currency_code, e.currency_code) = nw.currency_code;

-- Grant view access to authenticated users (RLS on underlying tables enforces row isolation)
GRANT SELECT ON public.executive_net_worth_summary TO authenticated;
GRANT SELECT ON public.executive_cash_flow_summary TO authenticated;
GRANT SELECT ON public.executive_asset_allocation TO authenticated;
GRANT SELECT ON public.executive_liquidity_summary TO authenticated;
GRANT SELECT ON public.executive_passive_income_summary TO authenticated;
GRANT SELECT ON public.executive_tax_summary TO authenticated;
GRANT SELECT ON public.executive_real_estate_summary TO authenticated;
GRANT SELECT ON public.executive_investment_summary TO authenticated;
GRANT SELECT ON public.executive_financial_independence_summary TO authenticated;

-- Grant table access to authenticated role (RLS restricts rows)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON public.currencies TO authenticated;
