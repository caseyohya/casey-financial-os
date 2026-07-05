-- Casey Financial OS — Real Estate Platform Schema
-- Run AFTER database/schema.sql in Supabase SQL Editor

-- ============================================================
-- PROPERTIES (core table — U.S. and Japan rental tracking)
-- ============================================================
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address_line1 TEXT NOT NULL DEFAULT '',
  address_line2 TEXT,
  city TEXT NOT NULL DEFAULT '',
  state_province TEXT,
  postal_code TEXT,
  country TEXT NOT NULL CHECK (country IN ('US', 'JP')) DEFAULT 'US',
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'JPY')) DEFAULT 'USD',
  property_type TEXT NOT NULL CHECK (property_type IN ('rental', 'primary', 'commercial', 'land', 'other')) DEFAULT 'rental',
  purchase_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
  purchase_date DATE,
  current_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
  land_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
  building_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
  loan_balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  interest_rate NUMERIC(6, 3),
  monthly_rent NUMERIC(15, 2) DEFAULT 0,
  hoa_monthly NUMERIC(15, 2) DEFAULT 0,
  taxes_annual NUMERIC(15, 2) DEFAULT 0,
  insurance_annual NUMERIC(15, 2) DEFAULT 0,
  maintenance_monthly NUMERIC(15, 2) DEFAULT 0,
  vacancy_rate_percent NUMERIC(5, 2) DEFAULT 0,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PROPERTY OWNERS
-- ============================================================
CREATE TABLE property_owners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  owner_name TEXT NOT NULL,
  ownership_percent NUMERIC(5, 2) NOT NULL DEFAULT 100,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PROPERTY MORTGAGES
-- ============================================================
CREATE TABLE property_mortgages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  lender TEXT NOT NULL DEFAULT '',
  original_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  current_balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  interest_rate NUMERIC(6, 3) NOT NULL DEFAULT 0,
  monthly_payment NUMERIC(15, 2) NOT NULL DEFAULT 0,
  start_date DATE,
  term_months INTEGER DEFAULT 360,
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'JPY')) DEFAULT 'USD',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PROPERTY INCOME (monthly rent and other income)
-- ============================================================
CREATE TABLE property_income (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  income_date DATE NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'JPY')) DEFAULT 'USD',
  income_type TEXT NOT NULL CHECK (income_type IN ('rent', 'late_fee', 'parking', 'laundry', 'other')) DEFAULT 'rent',
  tenant_id UUID,
  is_vacancy_period BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PROPERTY EXPENSES
-- ============================================================
CREATE TABLE property_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  expense_date DATE NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'JPY')) DEFAULT 'USD',
  category TEXT NOT NULL CHECK (category IN (
    'hoa', 'taxes', 'insurance', 'maintenance', 'repairs',
    'management', 'utilities', 'mortgage_principal', 'mortgage_interest', 'other'
  )) DEFAULT 'other',
  description TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PROPERTY TENANTS (vacancy tracked via lease gaps)
-- ============================================================
CREATE TABLE property_tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  lease_start DATE NOT NULL,
  lease_end DATE,
  monthly_rent NUMERIC(15, 2) NOT NULL DEFAULT 0,
  deposit NUMERIC(15, 2) DEFAULT 0,
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'JPY')) DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('active', 'vacated', 'pending')) DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add FK for tenant_id on property_income
ALTER TABLE property_income
  ADD CONSTRAINT property_income_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES property_tenants(id) ON DELETE SET NULL;

-- ============================================================
-- PROPERTY VALUATIONS
-- ============================================================
CREATE TABLE property_valuations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  valuation_date DATE NOT NULL,
  value NUMERIC(15, 2) NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'JPY')) DEFAULT 'USD',
  source TEXT NOT NULL CHECK (source IN ('manual', 'appraisal', 'market_estimate')) DEFAULT 'manual',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PROPERTY DEPRECIATION (U.S. Schedule E / CPA reporting)
-- ============================================================
CREATE TABLE property_depreciation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tax_year INTEGER NOT NULL,
  building_basis NUMERIC(15, 2) NOT NULL DEFAULT 0,
  land_basis NUMERIC(15, 2) NOT NULL DEFAULT 0,
  depreciation_method TEXT NOT NULL DEFAULT 'straight_line',
  useful_life_years NUMERIC(5, 1) NOT NULL DEFAULT 27.5,
  annual_depreciation NUMERIC(15, 2) NOT NULL DEFAULT 0,
  accumulated_depreciation NUMERIC(15, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'JPY')) DEFAULT 'USD',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (property_id, tax_year)
);

-- ============================================================
-- PROPERTY DOCUMENTS (Supabase Storage references)
-- ============================================================
CREATE TABLE property_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'lease', 'mortgage_statement', 'tax_bill', 'insurance', 'repair', 'other'
  )) DEFAULT 'other',
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  notes TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PROPERTY MONTHLY SUMMARY (aggregated reporting)
-- ============================================================
CREATE TABLE property_monthly_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
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
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'JPY')) DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (property_id, year, month)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_properties_user_id ON properties(user_id);
CREATE INDEX idx_property_owners_property_id ON property_owners(property_id);
CREATE INDEX idx_property_mortgages_property_id ON property_mortgages(property_id);
CREATE INDEX idx_property_income_property_id ON property_income(property_id);
CREATE INDEX idx_property_income_date ON property_income(income_date);
CREATE INDEX idx_property_expenses_property_id ON property_expenses(property_id);
CREATE INDEX idx_property_expenses_date ON property_expenses(expense_date);
CREATE INDEX idx_property_tenants_property_id ON property_tenants(property_id);
CREATE INDEX idx_property_valuations_property_id ON property_valuations(property_id);
CREATE INDEX idx_property_depreciation_property_id ON property_depreciation(property_id);
CREATE INDEX idx_property_documents_property_id ON property_documents(property_id);
CREATE INDEX idx_property_monthly_summary_property_id ON property_monthly_summary(property_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_mortgages ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_valuations ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_depreciation ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_monthly_summary ENABLE ROW LEVEL SECURITY;

-- Properties
CREATE POLICY "Users manage own properties" ON properties
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Child tables: access via property ownership
CREATE POLICY "Users manage own property owners" ON property_owners
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND property_id IN (SELECT id FROM properties WHERE user_id = auth.uid()));

CREATE POLICY "Users manage own property mortgages" ON property_mortgages
  FOR ALL USING (property_id IN (SELECT id FROM properties WHERE user_id = auth.uid()))
  WITH CHECK (property_id IN (SELECT id FROM properties WHERE user_id = auth.uid()));

CREATE POLICY "Users manage own property income" ON property_income
  FOR ALL USING (property_id IN (SELECT id FROM properties WHERE user_id = auth.uid()))
  WITH CHECK (property_id IN (SELECT id FROM properties WHERE user_id = auth.uid()));

CREATE POLICY "Users manage own property expenses" ON property_expenses
  FOR ALL USING (property_id IN (SELECT id FROM properties WHERE user_id = auth.uid()))
  WITH CHECK (property_id IN (SELECT id FROM properties WHERE user_id = auth.uid()));

CREATE POLICY "Users manage own property tenants" ON property_tenants
  FOR ALL USING (property_id IN (SELECT id FROM properties WHERE user_id = auth.uid()))
  WITH CHECK (property_id IN (SELECT id FROM properties WHERE user_id = auth.uid()));

CREATE POLICY "Users manage own property valuations" ON property_valuations
  FOR ALL USING (property_id IN (SELECT id FROM properties WHERE user_id = auth.uid()))
  WITH CHECK (property_id IN (SELECT id FROM properties WHERE user_id = auth.uid()));

CREATE POLICY "Users manage own property depreciation" ON property_depreciation
  FOR ALL USING (property_id IN (SELECT id FROM properties WHERE user_id = auth.uid()))
  WITH CHECK (property_id IN (SELECT id FROM properties WHERE user_id = auth.uid()));

CREATE POLICY "Users manage own property documents" ON property_documents
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND property_id IN (SELECT id FROM properties WHERE user_id = auth.uid()));

CREATE POLICY "Users manage own property monthly summary" ON property_monthly_summary
  FOR ALL USING (property_id IN (SELECT id FROM properties WHERE user_id = auth.uid()))
  WITH CHECK (property_id IN (SELECT id FROM properties WHERE user_id = auth.uid()));

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================
CREATE TRIGGER properties_updated_at BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER property_mortgages_updated_at BEFORE UPDATE ON property_mortgages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER property_tenants_updated_at BEFORE UPDATE ON property_tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER property_monthly_summary_updated_at BEFORE UPDATE ON property_monthly_summary
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SUPABASE STORAGE BUCKET (run in Supabase dashboard or SQL)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('property-documents', 'property-documents', false);

-- CREATE POLICY "Users upload own property documents" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'property-documents' AND auth.uid()::text = (storage.foldername(name))[1]
--   );
-- CREATE POLICY "Users view own property documents" ON storage.objects
--   FOR SELECT USING (
--     bucket_id = 'property-documents' AND auth.uid()::text = (storage.foldername(name))[1]
--   );
-- CREATE POLICY "Users delete own property documents" ON storage.objects
--   FOR DELETE USING (
--     bucket_id = 'property-documents' AND auth.uid()::text = (storage.foldername(name))[1]
--   );
