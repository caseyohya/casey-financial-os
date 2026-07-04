-- Casey Financial OS — Investment Platform Schema
-- Run AFTER database/schema.sql in Supabase SQL Editor

-- ============================================================
-- INVESTMENT ENTITIES (LLCs, LPs, funds, SPVs)
-- ============================================================
CREATE TABLE investment_entities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  entity_type TEXT NOT NULL DEFAULT 'llc' CHECK (entity_type IN ('llc', 'lp', 'fund', 'spv', 'corporation', 'trust', 'other')),
  ein TEXT,
  country TEXT NOT NULL DEFAULT 'US' CHECK (country IN ('US', 'JP', 'OTHER')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INVESTMENTS (core private investment record)
-- ============================================================
CREATE TABLE investments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  entity_id UUID REFERENCES investment_entities(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'oil_gas', 'startups', 'venture_funds', 'private_equity',
    'software', 'gold', 'silver', 'platinum', 'other_private'
  )),
  purchase_date DATE,
  invested_capital NUMERIC(15, 2) NOT NULL DEFAULT 0,
  current_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
  ownership_percent NUMERIC(7, 4) DEFAULT 100,
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'JPY')) DEFAULT 'USD',
  country TEXT NOT NULL DEFAULT 'US' CHECK (country IN ('US', 'JP', 'OTHER')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'exited', 'written_off', 'pending')),
  tax_basis NUMERIC(15, 2) NOT NULL DEFAULT 0,
  remaining_basis NUMERIC(15, 2) NOT NULL DEFAULT 0,
  idc_deduction_total NUMERIC(15, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INVESTMENT TRANSACTIONS (contributions, realized gains/losses)
-- ============================================================
CREATE TABLE investment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investment_id UUID NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN (
    'capital_contribution', 'additional_contribution', 'withdrawal',
    'realized_gain', 'realized_loss', 'return_of_capital', 'fee', 'other'
  )),
  amount NUMERIC(15, 2) NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'JPY')) DEFAULT 'USD',
  description TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INVESTMENT DISTRIBUTIONS
-- ============================================================
CREATE TABLE investment_distributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investment_id UUID NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
  distribution_date DATE NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'JPY')) DEFAULT 'USD',
  distribution_type TEXT NOT NULL CHECK (distribution_type IN (
    'cash', 'return_of_capital', 'income', 'dividend', 'other'
  )) DEFAULT 'cash',
  tax_year INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INVESTMENT CAPITAL CALLS
-- ============================================================
CREATE TABLE investment_capital_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investment_id UUID NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
  call_date DATE NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'JPY')) DEFAULT 'USD',
  due_date DATE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'funded', 'overdue', 'cancelled')) DEFAULT 'pending',
  funded_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INVESTMENT VALUATIONS
-- ============================================================
CREATE TABLE investment_valuations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investment_id UUID NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
  valuation_date DATE NOT NULL,
  value NUMERIC(15, 2) NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'JPY')) DEFAULT 'USD',
  source TEXT NOT NULL CHECK (source IN ('manual', 'fund_report', 'appraisal', 'market')) DEFAULT 'manual',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INVESTMENT TAX ITEMS (K-1 lines, IDC deductions)
-- ============================================================
CREATE TABLE investment_tax_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investment_id UUID NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
  tax_year INTEGER NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN (
    'ordinary_income', 'capital_gain', 'capital_loss',
    'idc_deduction', 'depletion', 'section_179',
    'interest_income', 'dividend', 'foreign_tax', 'other'
  )),
  amount NUMERIC(15, 2) NOT NULL,
  k1_line TEXT,
  description TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PRECIOUS METALS
-- ============================================================
CREATE TABLE precious_metals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  investment_id UUID REFERENCES investments(id) ON DELETE SET NULL,
  metal_type TEXT NOT NULL CHECK (metal_type IN ('gold', 'silver', 'platinum')),
  quantity NUMERIC(15, 6) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'oz' CHECK (unit IN ('oz', 'gram', 'kg')),
  unit_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
  spot_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
  storage_location TEXT,
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'JPY')) DEFAULT 'USD',
  purchase_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INVESTMENT DOCUMENTS
-- ============================================================
CREATE TABLE investment_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investment_id UUID NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'k1', 'subscription', 'capital_call', 'distribution', 'valuation', 'other'
  )) DEFAULT 'other',
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  tax_year INTEGER,
  notes TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INVESTMENT MONTHLY SUMMARY
-- ============================================================
CREATE TABLE investment_monthly_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investment_id UUID NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  invested_capital NUMERIC(15, 2) NOT NULL DEFAULT 0,
  current_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
  distributions_mtd NUMERIC(15, 2) NOT NULL DEFAULT 0,
  capital_calls_mtd NUMERIC(15, 2) NOT NULL DEFAULT 0,
  unrealized_gain NUMERIC(15, 2) NOT NULL DEFAULT 0,
  realized_gain NUMERIC(15, 2) NOT NULL DEFAULT 0,
  cash_yield NUMERIC(7, 4) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'JPY')) DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (investment_id, year, month)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_investment_entities_user_id ON investment_entities(user_id);
CREATE INDEX idx_investments_user_id ON investments(user_id);
CREATE INDEX idx_investments_entity_id ON investments(entity_id);
CREATE INDEX idx_investments_category ON investments(category);
CREATE INDEX idx_investment_transactions_investment_id ON investment_transactions(investment_id);
CREATE INDEX idx_investment_distributions_investment_id ON investment_distributions(investment_id);
CREATE INDEX idx_investment_capital_calls_investment_id ON investment_capital_calls(investment_id);
CREATE INDEX idx_investment_valuations_investment_id ON investment_valuations(investment_id);
CREATE INDEX idx_investment_tax_items_investment_id ON investment_tax_items(investment_id);
CREATE INDEX idx_investment_tax_items_tax_year ON investment_tax_items(tax_year);
CREATE INDEX idx_precious_metals_user_id ON precious_metals(user_id);
CREATE INDEX idx_precious_metals_investment_id ON precious_metals(investment_id);
CREATE INDEX idx_investment_documents_investment_id ON investment_documents(investment_id);
CREATE INDEX idx_investment_monthly_summary_investment_id ON investment_monthly_summary(investment_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE investment_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_capital_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_valuations ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_tax_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE precious_metals ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_monthly_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own entities" ON investment_entities
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own investments" ON investments
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own investment transactions" ON investment_transactions
  FOR ALL USING (investment_id IN (SELECT id FROM investments WHERE user_id = auth.uid()))
  WITH CHECK (investment_id IN (SELECT id FROM investments WHERE user_id = auth.uid()));

CREATE POLICY "Users manage own distributions" ON investment_distributions
  FOR ALL USING (investment_id IN (SELECT id FROM investments WHERE user_id = auth.uid()))
  WITH CHECK (investment_id IN (SELECT id FROM investments WHERE user_id = auth.uid()));

CREATE POLICY "Users manage own capital calls" ON investment_capital_calls
  FOR ALL USING (investment_id IN (SELECT id FROM investments WHERE user_id = auth.uid()))
  WITH CHECK (investment_id IN (SELECT id FROM investments WHERE user_id = auth.uid()));

CREATE POLICY "Users manage own valuations" ON investment_valuations
  FOR ALL USING (investment_id IN (SELECT id FROM investments WHERE user_id = auth.uid()))
  WITH CHECK (investment_id IN (SELECT id FROM investments WHERE user_id = auth.uid()));

CREATE POLICY "Users manage own tax items" ON investment_tax_items
  FOR ALL USING (investment_id IN (SELECT id FROM investments WHERE user_id = auth.uid()))
  WITH CHECK (investment_id IN (SELECT id FROM investments WHERE user_id = auth.uid()));

CREATE POLICY "Users manage own precious metals" ON precious_metals
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own investment documents" ON investment_documents
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND investment_id IN (SELECT id FROM investments WHERE user_id = auth.uid()));

CREATE POLICY "Users manage own monthly summary" ON investment_monthly_summary
  FOR ALL USING (investment_id IN (SELECT id FROM investments WHERE user_id = auth.uid()))
  WITH CHECK (investment_id IN (SELECT id FROM investments WHERE user_id = auth.uid()));

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================
CREATE TRIGGER investment_entities_updated_at BEFORE UPDATE ON investment_entities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER investments_updated_at BEFORE UPDATE ON investments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER investment_capital_calls_updated_at BEFORE UPDATE ON investment_capital_calls
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER precious_metals_updated_at BEFORE UPDATE ON precious_metals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER investment_monthly_summary_updated_at BEFORE UPDATE ON investment_monthly_summary
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- STORAGE BUCKET: investment-documents (create in Supabase dashboard)
-- ============================================================
