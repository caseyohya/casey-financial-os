-- Casey Financial OS — TEST SEED DATA (synthetic only)
-- DO NOT use real personal financial information.
-- All records below are clearly labeled with the prefix "TEST —".
--
-- Run AFTER applying:
--   1) supabase/migrations/20250705000000_casey_financial_os_schema.sql
--   2) supabase/migrations/20250712000000_app_runtime_compat.sql
--   OR the modular database/*.sql path documented in docs/database-setup.md
-- and after creating a user via Supabase Auth.
--
-- Replace :USER_ID with your auth.users UUID before running.

-- Financial Hub (App 1)
INSERT INTO accounts (user_id, name, account_type, balance, institution) VALUES
  (:USER_ID, 'TEST — Primary Checking', 'checking', 45200.00, 'TEST Bank'),
  (:USER_ID, 'TEST — High-Yield Savings', 'savings', 125000.00, 'TEST Bank');

INSERT INTO assets (user_id, name, asset_type, current_value) VALUES
  (:USER_ID, 'TEST — Emergency Cash Reserve', 'cash', 50000.00),
  (:USER_ID, 'TEST — Gold Holdings', 'precious_metal', 85000.00);

INSERT INTO liabilities (user_id, name, liability_type, current_balance, interest_rate) VALUES
  (:USER_ID, 'TEST — Auto Loan', 'auto_loan', 18500.00, 4.5),
  (:USER_ID, 'TEST — Credit Card', 'credit_card', 3200.00, 22.9);

INSERT INTO income_sources (user_id, name, income_type, amount, frequency, is_passive) VALUES
  (:USER_ID, 'TEST — Salary', 'salary', 15000.00, 'monthly', false),
  (:USER_ID, 'TEST — Rental Income', 'rental', 2800.00, 'monthly', true),
  (:USER_ID, 'TEST — Investment Distributions', 'investment', 1200.00, 'monthly', true);

INSERT INTO expenses (user_id, name, expense_type, amount, frequency, is_fixed) VALUES
  (:USER_ID, 'TEST — Mortgage Payment', 'housing', 4200.00, 'monthly', true),
  (:USER_ID, 'TEST — Groceries', 'living', 800.00, 'monthly', false),
  (:USER_ID, 'TEST — Insurance', 'insurance', 450.00, 'monthly', true);

-- Banking (App 2) — uses bank_accounts table (separate from Financial Hub accounts)
INSERT INTO bank_accounts (user_id, name, institution, account_type, balance) VALUES
  (:USER_ID, 'TEST — Business Checking', 'TEST Bank', 'checking', 287800.00);

-- Real Estate (App 3)
INSERT INTO properties (
  user_id, name, address_line1, city, state_province, country, property_type,
  purchase_price, current_value, loan_balance, monthly_rent,
  taxes_annual, insurance_annual, maintenance_monthly
) VALUES (
  :USER_ID, 'TEST — Rental Oak St', '100 Test Oak Street', 'Austin', 'TX', 'US', 'rental',
  320000.00, 485000.00, 210000.00, 2800.00,
  8400.00, 2400.00, 200.00
);

-- Investments (App 4)
INSERT INTO investments (user_id, name, category, invested_capital, current_value, country, status) VALUES
  (:USER_ID, 'TEST — Venture Fund Alpha', 'venture_funds', 250000.00, 310000.00, 'US', 'active'),
  (:USER_ID, 'TEST — Oil & Gas LP', 'oil_gas', 150000.00, 175000.00, 'US', 'active');

-- Tax (App 5)
-- After both Supabase migrations, also set tax_year/is_filed if required by NOT NULL constraints:
--   INSERT ... (user_id, year, tax_year, filing_status, status, is_filed)
INSERT INTO tax_years (user_id, year, filing_status, status) VALUES
  (:USER_ID, 2024, 'married_joint', 'filed'),
  (:USER_ID, 2025, 'married_joint', 'draft');

-- Expected dashboard metrics with this TEST seed (approximate):
-- Hub cash accounts:            170,200
-- Hub assets:                   135,000
-- Bank cash:                    287,800
-- Property value:               485,000
-- Investments:                  485,000
-- Total assets:               1,563,000
-- Hub liabilities:               21,700
-- Property loans:               210,000
-- Total liabilities:            231,700
-- Net worth:                  1,331,300
-- Monthly income (hub):          19,000
-- Monthly expenses (hub):         5,450
-- Monthly cash flow:             13,550
-- Passive income (hub):           4,000
-- Real estate NOI: monthly_rent - (taxes/12 + insurance/12 + maintenance)
--   = 2800 - (700 + 200 + 200) = 1,700
-- Investment gains: (310k-250k) + (175k-150k) = 85,000 unrealized
-- Average ROI: ((24% + 16.67%) / 2) ≈ 20.33%
