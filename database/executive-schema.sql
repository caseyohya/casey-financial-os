-- Casey Financial OS — Executive Dashboard Summary Tables
-- Run AFTER database/schema.sql and module schemas

-- ============================================================
-- EXECUTIVE NET WORTH SUMMARY
-- ============================================================
CREATE TABLE executive_net_worth_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  total_assets NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_liabilities NUMERIC(15, 2) NOT NULL DEFAULT 0,
  net_worth NUMERIC(15, 2) NOT NULL DEFAULT 0,
  country TEXT DEFAULT 'ALL' CHECK (country IN ('US', 'JP', 'ALL')),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'JPY')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, year, month, country, currency)
);

-- ============================================================
-- EXECUTIVE CASH FLOW SUMMARY
-- ============================================================
CREATE TABLE executive_cash_flow_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  monthly_income NUMERIC(15, 2) NOT NULL DEFAULT 0,
  monthly_expenses NUMERIC(15, 2) NOT NULL DEFAULT 0,
  cash_flow NUMERIC(15, 2) NOT NULL DEFAULT 0,
  country TEXT DEFAULT 'ALL' CHECK (country IN ('US', 'JP', 'ALL')),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'JPY')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, year, month, country, currency)
);

-- ============================================================
-- EXECUTIVE ASSET ALLOCATION
-- ============================================================
CREATE TABLE executive_asset_allocation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  category TEXT NOT NULL CHECK (category IN (
    'cash', 'real_estate', 'investments', 'precious_metals', 'other'
  )),
  amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
  country TEXT DEFAULT 'ALL' CHECK (country IN ('US', 'JP', 'ALL')),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'JPY')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, year, month, category, country, currency)
);

-- ============================================================
-- EXECUTIVE LIQUIDITY SUMMARY
-- ============================================================
CREATE TABLE executive_liquidity_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  cash_position NUMERIC(15, 2) NOT NULL DEFAULT 0,
  liquid_assets NUMERIC(15, 2) NOT NULL DEFAULT 0,
  liquidity_ratio NUMERIC(7, 2) NOT NULL DEFAULT 0,
  country TEXT DEFAULT 'ALL' CHECK (country IN ('US', 'JP', 'ALL')),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'JPY')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, year, month, country, currency)
);

-- ============================================================
-- EXECUTIVE PASSIVE INCOME SUMMARY
-- ============================================================
CREATE TABLE executive_passive_income_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  passive_income NUMERIC(15, 2) NOT NULL DEFAULT 0,
  target_amount NUMERIC(15, 2) NOT NULL DEFAULT 5000,
  progress_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
  rental_income NUMERIC(15, 2) NOT NULL DEFAULT 0,
  distribution_income NUMERIC(15, 2) NOT NULL DEFAULT 0,
  country TEXT DEFAULT 'ALL' CHECK (country IN ('US', 'JP', 'ALL')),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'JPY')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, year, month, country, currency)
);

-- ============================================================
-- EXECUTIVE TAX SUMMARY
-- ============================================================
CREATE TABLE executive_tax_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  estimated_tax NUMERIC(15, 2) NOT NULL DEFAULT 0,
  effective_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
  federal_tax NUMERIC(15, 2) NOT NULL DEFAULT 0,
  state_tax NUMERIC(15, 2) NOT NULL DEFAULT 0,
  gross_income NUMERIC(15, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'JPY')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, year, currency)
);

-- ============================================================
-- EXECUTIVE REAL ESTATE SUMMARY
-- ============================================================
CREATE TABLE executive_real_estate_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  portfolio_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_equity NUMERIC(15, 2) NOT NULL DEFAULT 0,
  monthly_noi NUMERIC(15, 2) NOT NULL DEFAULT 0,
  property_count INTEGER NOT NULL DEFAULT 0,
  country TEXT DEFAULT 'ALL' CHECK (country IN ('US', 'JP', 'ALL')),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'JPY')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, year, month, country, currency)
);

-- ============================================================
-- EXECUTIVE INVESTMENT SUMMARY
-- ============================================================
CREATE TABLE executive_investment_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  portfolio_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_distributions NUMERIC(15, 2) NOT NULL DEFAULT 0,
  monthly_distributions NUMERIC(15, 2) NOT NULL DEFAULT 0,
  avg_roi NUMERIC(7, 2) NOT NULL DEFAULT 0,
  investment_count INTEGER NOT NULL DEFAULT 0,
  country TEXT DEFAULT 'ALL' CHECK (country IN ('US', 'JP', 'ALL')),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'JPY')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, year, month, country, currency)
);

-- ============================================================
-- EXECUTIVE FINANCIAL INDEPENDENCE SUMMARY
-- ============================================================
CREATE TABLE executive_financial_independence_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  fi_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
  passive_income_coverage NUMERIC(5, 2) NOT NULL DEFAULT 0,
  debt_ratio NUMERIC(5, 2) NOT NULL DEFAULT 0,
  savings_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
  health_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
  country TEXT DEFAULT 'ALL' CHECK (country IN ('US', 'JP', 'ALL')),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'JPY')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, year, month, country, currency)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_exec_nw_user ON executive_net_worth_summary(user_id, year, month);
CREATE INDEX idx_exec_cf_user ON executive_cash_flow_summary(user_id, year, month);
CREATE INDEX idx_exec_alloc_user ON executive_asset_allocation(user_id, year, month);
CREATE INDEX idx_exec_liq_user ON executive_liquidity_summary(user_id, year, month);
CREATE INDEX idx_exec_passive_user ON executive_passive_income_summary(user_id, year, month);
CREATE INDEX idx_exec_tax_user ON executive_tax_summary(user_id, year);
CREATE INDEX idx_exec_re_user ON executive_real_estate_summary(user_id, year, month);
CREATE INDEX idx_exec_inv_user ON executive_investment_summary(user_id, year, month);
CREATE INDEX idx_exec_fi_user ON executive_financial_independence_summary(user_id, year, month);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE executive_net_worth_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE executive_cash_flow_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE executive_asset_allocation ENABLE ROW LEVEL SECURITY;
ALTER TABLE executive_liquidity_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE executive_passive_income_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE executive_tax_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE executive_real_estate_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE executive_investment_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE executive_financial_independence_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own exec net worth" ON executive_net_worth_summary
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own exec cash flow" ON executive_cash_flow_summary
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own exec allocation" ON executive_asset_allocation
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own exec liquidity" ON executive_liquidity_summary
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own exec passive income" ON executive_passive_income_summary
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own exec tax" ON executive_tax_summary
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own exec real estate" ON executive_real_estate_summary
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own exec investment" ON executive_investment_summary
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own exec fi" ON executive_financial_independence_summary
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================
CREATE TRIGGER exec_nw_updated_at BEFORE UPDATE ON executive_net_worth_summary
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER exec_cf_updated_at BEFORE UPDATE ON executive_cash_flow_summary
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER exec_liq_updated_at BEFORE UPDATE ON executive_liquidity_summary
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER exec_passive_updated_at BEFORE UPDATE ON executive_passive_income_summary
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER exec_tax_updated_at BEFORE UPDATE ON executive_tax_summary
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER exec_re_updated_at BEFORE UPDATE ON executive_real_estate_summary
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER exec_inv_updated_at BEFORE UPDATE ON executive_investment_summary
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER exec_fi_updated_at BEFORE UPDATE ON executive_financial_independence_summary
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
