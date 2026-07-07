-- Casey Financial OS — Tax Intelligence Platform Schema
-- Run AFTER database/schema.sql in Supabase SQL Editor
-- Organizer and CPA-preparation tool only — does not file taxes

-- ============================================================
-- TAX YEARS (annual tax organizer container)
-- ============================================================
CREATE TABLE IF NOT EXISTS tax_years (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  filing_status TEXT NOT NULL DEFAULT 'single' CHECK (filing_status IN (
    'single', 'married_joint', 'married_separate', 'head_of_household', 'qualifying_widow'
  )),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'in_progress', 'ready_for_cpa', 'filed'
  )),
  usd_to_jpy_rate NUMERIC(12, 6),
  jpy_to_usd_rate NUMERIC(12, 8),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, year)
);

-- ============================================================
-- TAX DOCUMENTS (CPA checklist + uploads)
-- ============================================================
CREATE TABLE IF NOT EXISTS tax_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tax_year_id UUID NOT NULL REFERENCES tax_years(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'w2', '1099_int', '1099_div', '1099_b', '1099_misc', '1099_nec',
    'k1', 'mortgage_interest', 'property_tax', 'charitable',
    'foreign_income', 'fbar_support', 'form_8938_support',
    'schedule_e_support', 'depreciation_schedule', 'other'
  )),
  file_path TEXT,
  file_size INTEGER,
  mime_type TEXT,
  is_required BOOLEAN NOT NULL DEFAULT TRUE,
  is_received BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  uploaded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TAX ACCOUNTS (U.S. and foreign bank accounts)
-- ============================================================
CREATE TABLE IF NOT EXISTS tax_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tax_year_id UUID NOT NULL REFERENCES tax_years(id) ON DELETE CASCADE,
  account_name TEXT NOT NULL,
  institution TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT 'US' CHECK (country IN ('US', 'JP', 'OTHER')),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'JPY')),
  account_type TEXT NOT NULL DEFAULT 'checking' CHECK (account_type IN (
    'checking', 'savings', 'brokerage', 'retirement', 'other'
  )),
  account_number_last4 TEXT,
  is_foreign BOOLEAN NOT NULL DEFAULT FALSE,
  year_end_balance NUMERIC(15, 2),
  max_annual_balance NUMERIC(15, 2),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TAX INCOME ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS tax_income_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tax_year_id UUID NOT NULL REFERENCES tax_years(id) ON DELETE CASCADE,
  income_type TEXT NOT NULL CHECK (income_type IN (
    'wages', 'interest', 'dividends', 'rental', 'foreign_interest',
    'capital_gain', 'k1_ordinary', 'royalties', 'other'
  )),
  description TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'JPY')),
  source TEXT,
  is_foreign BOOLEAN NOT NULL DEFAULT FALSE,
  country TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TAX EXPENSE ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS tax_expense_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tax_year_id UUID NOT NULL REFERENCES tax_years(id) ON DELETE CASCADE,
  expense_type TEXT NOT NULL CHECK (expense_type IN (
    'mortgage_interest', 'property_tax', 'repairs', 'insurance',
    'management', 'utilities', 'depreciation', 'other'
  )),
  description TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'JPY')),
  property_name TEXT,
  schedule_e_line TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TAX DEDUCTIONS (including oil & gas IDC)
-- ============================================================
CREATE TABLE IF NOT EXISTS tax_deductions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tax_year_id UUID NOT NULL REFERENCES tax_years(id) ON DELETE CASCADE,
  deduction_type TEXT NOT NULL CHECK (deduction_type IN (
    'idc', 'charitable', 'medical', 'state_tax', 'mortgage_interest',
    'depletion', 'section_179', 'other'
  )),
  description TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'JPY')),
  investment_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TAX FOREIGN ACCOUNTS
-- ============================================================
CREATE TABLE IF NOT EXISTS tax_foreign_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tax_year_id UUID NOT NULL REFERENCES tax_years(id) ON DELETE CASCADE,
  account_name TEXT NOT NULL,
  institution TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT 'JP',
  currency TEXT NOT NULL DEFAULT 'JPY' CHECK (currency IN ('USD', 'JPY')),
  account_type TEXT NOT NULL DEFAULT 'bank' CHECK (account_type IN (
    'bank', 'securities', 'retirement', 'other'
  )),
  account_number TEXT,
  max_value_usd NUMERIC(15, 2),
  year_end_value_usd NUMERIC(15, 2),
  year_end_value_local NUMERIC(15, 2),
  max_value_local NUMERIC(15, 2),
  interest_earned NUMERIC(15, 2) NOT NULL DEFAULT 0,
  interest_currency TEXT NOT NULL DEFAULT 'JPY' CHECK (interest_currency IN ('USD', 'JPY')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TAX FBAR ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS tax_fbar_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tax_year_id UUID NOT NULL REFERENCES tax_years(id) ON DELETE CASCADE,
  foreign_account_id UUID REFERENCES tax_foreign_accounts(id) ON DELETE SET NULL,
  account_name TEXT NOT NULL,
  institution_name TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT 'JP',
  account_number TEXT,
  max_value_usd NUMERIC(15, 2),
  year_end_value_usd NUMERIC(15, 2),
  account_type TEXT NOT NULL DEFAULT 'bank' CHECK (account_type IN (
    'bank', 'securities', 'other'
  )),
  jointly_owned BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TAX FORM 8938 ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS tax_form_8938_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tax_year_id UUID NOT NULL REFERENCES tax_years(id) ON DELETE CASCADE,
  foreign_account_id UUID REFERENCES tax_foreign_accounts(id) ON DELETE SET NULL,
  asset_description TEXT NOT NULL,
  institution TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT 'JP',
  account_number TEXT,
  max_value_during_year NUMERIC(15, 2),
  year_end_value NUMERIC(15, 2),
  asset_type TEXT NOT NULL DEFAULT 'deposit' CHECK (asset_type IN (
    'deposit', 'custodial', 'other'
  )),
  currency TEXT NOT NULL DEFAULT 'JPY' CHECK (currency IN ('USD', 'JPY')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TAX SCHEDULE E ITEMS (rental property)
-- ============================================================
CREATE TABLE IF NOT EXISTS tax_schedule_e_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tax_year_id UUID NOT NULL REFERENCES tax_years(id) ON DELETE CASCADE,
  property_name TEXT NOT NULL,
  property_address TEXT NOT NULL DEFAULT '',
  days_rented INTEGER NOT NULL DEFAULT 0,
  days_personal_use INTEGER NOT NULL DEFAULT 0,
  gross_rents NUMERIC(15, 2) NOT NULL DEFAULT 0,
  advertising NUMERIC(15, 2) NOT NULL DEFAULT 0,
  auto_travel NUMERIC(15, 2) NOT NULL DEFAULT 0,
  cleaning NUMERIC(15, 2) NOT NULL DEFAULT 0,
  commissions NUMERIC(15, 2) NOT NULL DEFAULT 0,
  insurance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  legal_professional NUMERIC(15, 2) NOT NULL DEFAULT 0,
  management_fees NUMERIC(15, 2) NOT NULL DEFAULT 0,
  mortgage_interest NUMERIC(15, 2) NOT NULL DEFAULT 0,
  other_interest NUMERIC(15, 2) NOT NULL DEFAULT 0,
  repairs NUMERIC(15, 2) NOT NULL DEFAULT 0,
  supplies NUMERIC(15, 2) NOT NULL DEFAULT 0,
  taxes NUMERIC(15, 2) NOT NULL DEFAULT 0,
  utilities NUMERIC(15, 2) NOT NULL DEFAULT 0,
  depreciation NUMERIC(15, 2) NOT NULL DEFAULT 0,
  other_expenses NUMERIC(15, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'JPY')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TAX K-1 ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS tax_k1_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tax_year_id UUID NOT NULL REFERENCES tax_years(id) ON DELETE CASCADE,
  entity_name TEXT NOT NULL,
  entity_ein TEXT,
  box_1_ordinary_income NUMERIC(15, 2) NOT NULL DEFAULT 0,
  box_2_net_rental NUMERIC(15, 2) NOT NULL DEFAULT 0,
  box_3_other_rental NUMERIC(15, 2) NOT NULL DEFAULT 0,
  box_4_guaranteed_payments NUMERIC(15, 2) NOT NULL DEFAULT 0,
  box_5_interest NUMERIC(15, 2) NOT NULL DEFAULT 0,
  box_6a_ordinary_dividends NUMERIC(15, 2) NOT NULL DEFAULT 0,
  box_6b_qualified_dividends NUMERIC(15, 2) NOT NULL DEFAULT 0,
  box_7_royalties NUMERIC(15, 2) NOT NULL DEFAULT 0,
  box_8_net_short_term NUMERIC(15, 2) NOT NULL DEFAULT 0,
  box_9a_net_long_term NUMERIC(15, 2) NOT NULL DEFAULT 0,
  box_9b_collectibles NUMERIC(15, 2) NOT NULL DEFAULT 0,
  box_9c_unrecaptured_1250 NUMERIC(15, 2) NOT NULL DEFAULT 0,
  box_10_net_section_1231 NUMERIC(15, 2) NOT NULL DEFAULT 0,
  box_11_other_income NUMERIC(15, 2) NOT NULL DEFAULT 0,
  box_12_section_179 NUMERIC(15, 2) NOT NULL DEFAULT 0,
  box_13_other_deductions NUMERIC(15, 2) NOT NULL DEFAULT 0,
  box_14_self_employment NUMERIC(15, 2) NOT NULL DEFAULT 0,
  box_15_credits NUMERIC(15, 2) NOT NULL DEFAULT 0,
  box_16_foreign_transactions NUMERIC(15, 2) NOT NULL DEFAULT 0,
  box_17_amt_items NUMERIC(15, 2) NOT NULL DEFAULT 0,
  box_18_tax_exempt NUMERIC(15, 2) NOT NULL DEFAULT 0,
  box_19_distributions NUMERIC(15, 2) NOT NULL DEFAULT 0,
  box_20_other_info TEXT,
  idc_deduction NUMERIC(15, 2) NOT NULL DEFAULT 0,
  depletion NUMERIC(15, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'JPY')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TAX DEPRECIATION ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS tax_depreciation_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tax_year_id UUID NOT NULL REFERENCES tax_years(id) ON DELETE CASCADE,
  property_name TEXT NOT NULL,
  asset_description TEXT NOT NULL DEFAULT '',
  date_acquired DATE,
  cost_basis NUMERIC(15, 2) NOT NULL DEFAULT 0,
  depreciation_method TEXT NOT NULL DEFAULT 'macrs' CHECK (depreciation_method IN (
    'macrs', 'straight_line', 'other'
  )),
  useful_life_years INTEGER,
  prior_depreciation NUMERIC(15, 2) NOT NULL DEFAULT 0,
  current_year_depreciation NUMERIC(15, 2) NOT NULL DEFAULT 0,
  accumulated_depreciation NUMERIC(15, 2) NOT NULL DEFAULT 0,
  remaining_basis NUMERIC(15, 2) NOT NULL DEFAULT 0,
  schedule_e_item_id UUID REFERENCES tax_schedule_e_items(id) ON DELETE SET NULL,
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'JPY')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TAX EXPORTS (generated CPA packages)
-- ============================================================
CREATE TABLE IF NOT EXISTS tax_exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tax_year_id UUID NOT NULL REFERENCES tax_years(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL CHECK (export_type IN (
    'cpa_package', 'fbar', 'form_8938', 'schedule_e', 'k1_summary', 'annual_summary'
  )),
  file_name TEXT NOT NULL,
  file_path TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_tax_years_user_id ON tax_years(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_documents_tax_year_id ON tax_documents(tax_year_id);
CREATE INDEX IF NOT EXISTS idx_tax_accounts_tax_year_id ON tax_accounts(tax_year_id);
CREATE INDEX IF NOT EXISTS idx_tax_income_items_tax_year_id ON tax_income_items(tax_year_id);
CREATE INDEX IF NOT EXISTS idx_tax_expense_items_tax_year_id ON tax_expense_items(tax_year_id);
CREATE INDEX IF NOT EXISTS idx_tax_deductions_tax_year_id ON tax_deductions(tax_year_id);
CREATE INDEX IF NOT EXISTS idx_tax_foreign_accounts_tax_year_id ON tax_foreign_accounts(tax_year_id);
CREATE INDEX IF NOT EXISTS idx_tax_fbar_items_tax_year_id ON tax_fbar_items(tax_year_id);
CREATE INDEX IF NOT EXISTS idx_tax_form_8938_items_tax_year_id ON tax_form_8938_items(tax_year_id);
CREATE INDEX IF NOT EXISTS idx_tax_schedule_e_items_tax_year_id ON tax_schedule_e_items(tax_year_id);
CREATE INDEX IF NOT EXISTS idx_tax_k1_items_tax_year_id ON tax_k1_items(tax_year_id);
CREATE INDEX IF NOT EXISTS idx_tax_depreciation_items_tax_year_id ON tax_depreciation_items(tax_year_id);
CREATE INDEX IF NOT EXISTS idx_tax_exports_tax_year_id ON tax_exports(tax_year_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE tax_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_income_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_expense_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_foreign_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_fbar_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_form_8938_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_schedule_e_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_k1_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_depreciation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_exports ENABLE ROW LEVEL SECURITY;

-- Tax years
CREATE POLICY "Users can view own tax years" ON tax_years FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tax years" ON tax_years FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tax years" ON tax_years FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tax years" ON tax_years FOR DELETE USING (auth.uid() = user_id);

-- Tax documents
CREATE POLICY "Users can view own tax documents" ON tax_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tax documents" ON tax_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tax documents" ON tax_documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tax documents" ON tax_documents FOR DELETE USING (auth.uid() = user_id);

-- Tax accounts
CREATE POLICY "Users can view own tax accounts" ON tax_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tax accounts" ON tax_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tax accounts" ON tax_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tax accounts" ON tax_accounts FOR DELETE USING (auth.uid() = user_id);

-- Tax income items
CREATE POLICY "Users can view own tax income" ON tax_income_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tax income" ON tax_income_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tax income" ON tax_income_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tax income" ON tax_income_items FOR DELETE USING (auth.uid() = user_id);

-- Tax expense items
CREATE POLICY "Users can view own tax expenses" ON tax_expense_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tax expenses" ON tax_expense_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tax expenses" ON tax_expense_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tax expenses" ON tax_expense_items FOR DELETE USING (auth.uid() = user_id);

-- Tax deductions
CREATE POLICY "Users can view own tax deductions" ON tax_deductions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tax deductions" ON tax_deductions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tax deductions" ON tax_deductions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tax deductions" ON tax_deductions FOR DELETE USING (auth.uid() = user_id);

-- Tax foreign accounts
CREATE POLICY "Users can view own foreign accounts" ON tax_foreign_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own foreign accounts" ON tax_foreign_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own foreign accounts" ON tax_foreign_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own foreign accounts" ON tax_foreign_accounts FOR DELETE USING (auth.uid() = user_id);

-- Tax FBAR items
CREATE POLICY "Users can view own fbar items" ON tax_fbar_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own fbar items" ON tax_fbar_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own fbar items" ON tax_fbar_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own fbar items" ON tax_fbar_items FOR DELETE USING (auth.uid() = user_id);

-- Tax Form 8938 items
CREATE POLICY "Users can view own form 8938 items" ON tax_form_8938_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own form 8938 items" ON tax_form_8938_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own form 8938 items" ON tax_form_8938_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own form 8938 items" ON tax_form_8938_items FOR DELETE USING (auth.uid() = user_id);

-- Tax Schedule E items
CREATE POLICY "Users can view own schedule e items" ON tax_schedule_e_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own schedule e items" ON tax_schedule_e_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own schedule e items" ON tax_schedule_e_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own schedule e items" ON tax_schedule_e_items FOR DELETE USING (auth.uid() = user_id);

-- Tax K-1 items
CREATE POLICY "Users can view own k1 items" ON tax_k1_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own k1 items" ON tax_k1_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own k1 items" ON tax_k1_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own k1 items" ON tax_k1_items FOR DELETE USING (auth.uid() = user_id);

-- Tax depreciation items
CREATE POLICY "Users can view own depreciation items" ON tax_depreciation_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own depreciation items" ON tax_depreciation_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own depreciation items" ON tax_depreciation_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own depreciation items" ON tax_depreciation_items FOR DELETE USING (auth.uid() = user_id);

-- Tax exports
CREATE POLICY "Users can view own tax exports" ON tax_exports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tax exports" ON tax_exports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own tax exports" ON tax_exports FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================
CREATE TRIGGER tax_years_updated_at BEFORE UPDATE ON tax_years
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tax_documents_updated_at BEFORE UPDATE ON tax_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tax_accounts_updated_at BEFORE UPDATE ON tax_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tax_income_items_updated_at BEFORE UPDATE ON tax_income_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tax_expense_items_updated_at BEFORE UPDATE ON tax_expense_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tax_deductions_updated_at BEFORE UPDATE ON tax_deductions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tax_foreign_accounts_updated_at BEFORE UPDATE ON tax_foreign_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tax_fbar_items_updated_at BEFORE UPDATE ON tax_fbar_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tax_form_8938_items_updated_at BEFORE UPDATE ON tax_form_8938_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tax_schedule_e_items_updated_at BEFORE UPDATE ON tax_schedule_e_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tax_k1_items_updated_at BEFORE UPDATE ON tax_k1_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tax_depreciation_items_updated_at BEFORE UPDATE ON tax_depreciation_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
