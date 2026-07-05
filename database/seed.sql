-- =============================================================================
-- Casey Financial OS — Seed Data for Testing
-- =============================================================================
-- Run AFTER schema.sql. For local Supabase, creates a test user and sample data.
-- Test user: casey@example.com / password: testpassword123
-- =============================================================================

-- System currencies (idempotent)
INSERT INTO public.currencies (code, name, symbol, decimal_places) VALUES
  ('USD', 'US Dollar', '$', 2),
  ('JPY', 'Japanese Yen', '¥', 0)
ON CONFLICT (code) DO NOTHING;

-- =============================================================================
-- TEST USER (local development only)
-- =============================================================================
-- Fixed UUID for reproducible seed data across environments
DO $$
DECLARE
  test_user_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
BEGIN
  -- Create auth user if not exists (Supabase local / service-role context)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = test_user_id) THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      test_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'casey@example.com',
      crypt('testpassword123', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Casey Morgan"}',
      NOW(),
      NOW()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      test_user_id,
      test_user_id,
      format('{"sub":"%s","email":"casey@example.com"}', test_user_id)::jsonb,
      'email',
      test_user_id::text,
      NOW(),
      NOW(),
      NOW()
    );
  END IF;

  -- Profile (trigger may have created it; upsert preferences)
  INSERT INTO public.profiles (id, email, full_name, preferred_currency, preferred_country)
  VALUES (test_user_id, 'casey@example.com', 'Casey Morgan', 'USD', 'US')
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    preferred_currency = EXCLUDED.preferred_currency,
    preferred_country = EXCLUDED.preferred_country;

  -- Skip if seed already applied
  IF EXISTS (SELECT 1 FROM public.accounts WHERE user_id = test_user_id LIMIT 1) THEN
    RAISE NOTICE 'Seed data already exists for test user. Skipping.';
    RETURN;
  END IF;

  -- Exchange rates
  INSERT INTO public.exchange_rates (user_id, base_currency, quote_currency, rate, effective_date, source)
  VALUES
    (test_user_id, 'USD', 'JPY', 150.25, CURRENT_DATE, 'manual'),
    (test_user_id, 'JPY', 'USD', 0.006656, CURRENT_DATE, 'manual');

  -- Financial Hub: accounts, assets, liabilities
  INSERT INTO public.accounts (id, user_id, name, account_type, currency_code, country, balance, institution)
  VALUES
    ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', test_user_id, 'Primary Checking', 'checking', 'USD', 'US', 45000.00, 'Chase'),
    ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', test_user_id, 'Tokyo Savings', 'savings', 'JPY', 'JP', 5000000.00, 'MUFG');

  INSERT INTO public.assets (user_id, name, asset_type, category, currency_code, country, current_value, acquisition_cost)
  VALUES
    (test_user_id, 'Emergency Fund', 'cash', 'liquid', 'USD', 'US', 25000.00, 25000.00),
    (test_user_id, 'Art Collection', 'other', 'collectibles', 'USD', 'US', 150000.00, 80000.00);

  INSERT INTO public.liabilities (user_id, name, liability_type, category, currency_code, country, current_balance, interest_rate)
  VALUES
    (test_user_id, 'Home Equity Line', 'personal_loan', 'credit', 'USD', 'US', 50000.00, 7.5000),
    (test_user_id, 'Auto Loan', 'auto_loan', 'vehicle', 'USD', 'US', 22000.00, 4.9000);

  INSERT INTO public.income_sources (user_id, name, income_type, category, currency_code, country, amount, frequency, is_passive)
  VALUES
    (test_user_id, 'Salary', 'employment', 'w2', 'USD', 'US', 25000.00, 'monthly', FALSE),
    (test_user_id, 'Rental Income - Austin', 'rental', 'real_estate', 'USD', 'US', 3200.00, 'monthly', TRUE),
    (test_user_id, 'Dividend Portfolio', 'investment', 'dividends', 'USD', 'US', 1800.00, 'monthly', TRUE);

  INSERT INTO public.expenses (user_id, name, expense_type, category, currency_code, country, amount, frequency, is_fixed)
  VALUES
    (test_user_id, 'Mortgage Payment', 'housing', 'mortgage', 'USD', 'US', 4500.00, 'monthly', TRUE),
    (test_user_id, 'Living Expenses', 'living', 'general', 'USD', 'US', 8000.00, 'monthly', TRUE),
    (test_user_id, 'Property Management', 'real_estate', 'management', 'USD', 'US', 400.00, 'monthly', TRUE);

  INSERT INTO public.monthly_snapshots (user_id, snapshot_month, currency_code, total_assets, total_liabilities, net_worth, total_income, total_expenses, cash_flow)
  VALUES
    (test_user_id, DATE_TRUNC('month', CURRENT_DATE)::DATE, 'USD', 2500000.00, 450000.00, 2050000.00, 30000.00, 12900.00, 17100.00),
    (test_user_id, (DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month')::DATE, 'USD', 2450000.00, 460000.00, 1990000.00, 29500.00, 12800.00, 16700.00);

  -- Banking
  INSERT INTO public.bank_accounts (id, user_id, name, bank_name, account_type, account_number_last4, currency_code, country)
  VALUES
    ('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', test_user_id, 'Chase Checking', 'Chase', 'checking', '4521', 'USD', 'US'),
    ('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', test_user_id, 'MUFG Ordinary', 'MUFG', 'savings', '7890', 'JPY', 'JP');

  INSERT INTO public.transaction_categories (id, user_id, name, color, is_system)
  VALUES
    ('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', test_user_id, 'Income', '#22c55e', TRUE),
    ('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', test_user_id, 'Housing', '#ef4444', TRUE),
    ('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', test_user_id, 'Investments', '#3b82f6', TRUE);

  INSERT INTO public.bank_balances (user_id, bank_account_id, balance, balance_date, currency_code)
  VALUES
    (test_user_id, 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 45000.00, CURRENT_DATE, 'USD'),
    (test_user_id, 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 5000000.00, CURRENT_DATE, 'JPY');

  INSERT INTO public.bank_transactions (user_id, bank_account_id, transaction_date, description, amount, currency_code, category_id, transaction_type)
  VALUES
    (test_user_id, 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', CURRENT_DATE - 5, 'Payroll Deposit', 25000.00, 'USD', 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'credit'),
    (test_user_id, 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', CURRENT_DATE - 3, 'Mortgage Payment', -4500.00, 'USD', 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'debit'),
    (test_user_id, 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', CURRENT_DATE - 1, 'Brokerage Transfer', -5000.00, 'USD', 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'debit');

  INSERT INTO public.recurring_transactions (user_id, bank_account_id, category_id, description, amount, currency_code, frequency, next_date)
  VALUES
    (test_user_id, 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'Monthly Mortgage', -4500.00, 'USD', 'monthly', DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month')::DATE);

  -- Real Estate
  INSERT INTO public.properties (id, user_id, name, property_type, address_line1, city, state_province, postal_code, country, currency_code, purchase_date, purchase_price, current_value, is_rental)
  VALUES
    ('e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', test_user_id, 'Austin Rental Duplex', 'multi_family', '1234 Congress Ave', 'Austin', 'TX', '78701', 'US', 'USD', '2019-06-15', 650000.00, 920000.00, TRUE),
    ('e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', test_user_id, 'Tokyo Apartment', 'condo', '1-2-3 Shibuya', 'Tokyo', 'Tokyo', '150-0001', 'JP', 'JPY', '2021-03-20', 45000000.00, 52000000.00, FALSE);

  INSERT INTO public.property_mortgages (user_id, property_id, lender_name, loan_amount, current_balance, interest_rate, monthly_payment, currency_code)
  VALUES
    (test_user_id, 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'Wells Fargo', 520000.00, 380000.00, 3.7500, 4500.00, 'USD');

  INSERT INTO public.property_tenants (id, user_id, property_id, name, email, monthly_rent, currency_code, lease_start, lease_end)
  VALUES
    ('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', test_user_id, 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'Jane Smith', 'jane@example.com', 1600.00, 'USD', '2024-01-01', '2025-12-31'),
    ('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', test_user_id, 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'John Doe', 'john@example.com', 1600.00, 'USD', '2024-06-01', '2025-05-31');

  INSERT INTO public.property_income (user_id, property_id, income_type, amount, currency_code, income_date, tenant_id)
  VALUES
    (test_user_id, 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'rent', 1600.00, 'USD', DATE_TRUNC('month', CURRENT_DATE)::DATE, 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01'),
    (test_user_id, 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'rent', 1600.00, 'USD', DATE_TRUNC('month', CURRENT_DATE)::DATE, 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a02');

  INSERT INTO public.property_expenses (user_id, property_id, expense_type, category, amount, currency_code, expense_date, is_tax_deductible)
  VALUES
    (test_user_id, 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'maintenance', 'repairs', 850.00, 'USD', CURRENT_DATE - 10, TRUE),
    (test_user_id, 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'insurance', 'property', 1200.00, 'USD', CURRENT_DATE - 30, TRUE);

  INSERT INTO public.property_valuations (user_id, property_id, valuation_date, estimated_value, currency_code, valuation_method)
  VALUES
    (test_user_id, 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', CURRENT_DATE, 920000.00, 'USD', 'comparative_market'),
    (test_user_id, 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', CURRENT_DATE, 52000000.00, 'JPY', 'appraisal');

  INSERT INTO public.property_depreciation (user_id, property_id, tax_year, depreciation_amount, accumulated_depreciation, method, currency_code)
  VALUES
    (test_user_id, 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER, 23636.36, 118181.80, 'macrs_27.5', 'USD');

  -- Investments
  INSERT INTO public.investment_entities (id, user_id, name, entity_type, country, currency_code)
  VALUES
    ('g1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', test_user_id, 'Blackstone Real Estate Fund VII', 'private_equity', 'US', 'USD');

  INSERT INTO public.investments (id, user_id, name, investment_type, symbol, entity_id, currency_code, country, shares, cost_basis, current_value, acquisition_date)
  VALUES
    ('h1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', test_user_id, 'Vanguard Total Stock', 'etf', 'VTI', NULL, 'USD', 'US', 500.00000000, 95000.00, 125000.00, '2020-01-15'),
    ('h1eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', test_user_id, 'Blackstone RE Fund VII', 'private_equity', NULL, 'g1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'USD', 'US', NULL, 500000.00, 625000.00, '2022-06-01'),
    ('h1eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', test_user_id, 'Toyota Motor', 'stock', '7203.T', NULL, 'JPY', 'JP', 1000.00000000, 2500000.00, 3100000.00, '2023-04-10');

  INSERT INTO public.investment_transactions (user_id, investment_id, transaction_type, transaction_date, shares, price_per_share, amount, currency_code)
  VALUES
    (test_user_id, 'h1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'buy', '2024-01-10', 50.00000000, 220.0000, 11000.00, 'USD'),
    (test_user_id, 'h1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'dividend', '2024-03-15', NULL, NULL, 450.00, 'USD');

  INSERT INTO public.investment_distributions (user_id, investment_id, entity_id, distribution_type, amount, currency_code, distribution_date)
  VALUES
    (test_user_id, 'h1eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'g1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'return_of_capital', 25000.00, 'USD', CURRENT_DATE - 60);

  INSERT INTO public.investment_capital_calls (user_id, investment_id, entity_id, call_date, due_date, amount, amount_paid, currency_code, status)
  VALUES
    (test_user_id, 'h1eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'g1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', CURRENT_DATE + 30, CURRENT_DATE + 60, 50000.00, 0, 'USD', 'pending');

  INSERT INTO public.investment_valuations (user_id, investment_id, valuation_date, value, currency_code, valuation_method)
  VALUES
    (test_user_id, 'h1eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', CURRENT_DATE, 625000.00, 'USD', 'nav_statement');

  INSERT INTO public.precious_metals (user_id, metal_type, weight_oz, purity, acquisition_cost, current_value, currency_code, storage_location)
  VALUES
    (test_user_id, 'gold', 50.000000, 0.9999, 95000.00, 105000.00, 'USD', 'Brinks Vault NYC'),
    (test_user_id, 'silver', 200.000000, 0.9990, 4500.00, 5200.00, 'USD', 'Home Safe');

  -- Tax Intelligence
  INSERT INTO public.tax_years (id, user_id, tax_year, country, filing_status, is_filed)
  VALUES
    ('i1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', test_user_id, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER - 1, 'US', 'married_filing_jointly', TRUE),
    ('i1eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', test_user_id, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER, 'US', 'married_filing_jointly', FALSE);

  INSERT INTO public.tax_income_items (user_id, tax_year_id, income_type, source, amount, currency_code, country, is_foreign)
  VALUES
    (test_user_id, 'i1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'wages', 'Employer W-2', 285000.00, 'USD', 'US', FALSE),
    (test_user_id, 'i1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'rental', 'Schedule E', 38400.00, 'USD', 'US', FALSE),
    (test_user_id, 'i1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'dividends', 'Brokerage 1099-DIV', 12500.00, 'USD', 'US', FALSE);

  INSERT INTO public.tax_deductions (user_id, tax_year_id, deduction_type, category, amount, currency_code, description)
  VALUES
    (test_user_id, 'i1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'mortgage_interest', 'itemized', 18500.00, 'USD', 'Primary residence mortgage interest'),
    (test_user_id, 'i1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'charitable', 'itemized', 15000.00, 'USD', 'Annual charitable giving');

  INSERT INTO public.tax_foreign_accounts (id, user_id, tax_year_id, account_name, institution, country, max_value, currency_code, account_type)
  VALUES
    ('j1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', test_user_id, 'i1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'MUFG Ordinary Account', 'MUFG', 'JP', 35000.00, 'USD', 'bank');

  INSERT INTO public.tax_fbar_items (user_id, tax_year_id, foreign_account_id, max_value_usd, currency_code, country, institution_name)
  VALUES
    (test_user_id, 'i1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'j1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 35000.00, 'USD', 'JP', 'MUFG');

  INSERT INTO public.tax_schedule_e_items (user_id, tax_year_id, property_id, rental_income, expenses, depreciation, net_income, currency_code)
  VALUES
    (test_user_id, 'i1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 38400.00, 12000.00, 23636.36, 2763.64, 'USD');

  INSERT INTO public.tax_k1_items (user_id, tax_year_id, entity_id, k1_type, ordinary_income, capital_gains, dividends, currency_code)
  VALUES
    (test_user_id, 'i1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'g1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', '1065', 8500.00, 12000.00, 3500.00, 'USD');

  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_data)
  VALUES
    (test_user_id, 'INSERT', 'accounts', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', '{"name": "Primary Checking"}'::jsonb);

  RAISE NOTICE 'Seed data created for test user: casey@example.com (id: %)', test_user_id;
END $$;
