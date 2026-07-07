-- Casey Financial OS — Test Seed Data
-- Run AFTER applying supabase/migrations/20250705000000_casey_financial_os_schema.sql
-- and creating a user via Supabase Auth (e.g. casey@example.com)
--
-- Replace :USER_ID with your auth.users UUID before running.

-- Financial Hub (App 1)
INSERT INTO accounts (user_id, name, account_type, balance, institution) VALUES
  (:USER_ID, 'Primary Checking', 'checking', 45200.00, 'Chase'),
  (:USER_ID, 'High-Yield Savings', 'savings', 125000.00, 'Marcus');

INSERT INTO assets (user_id, name, asset_type, current_value) VALUES
  (:USER_ID, 'Emergency Cash Reserve', 'cash', 50000.00),
  (:USER_ID, 'Gold Holdings', 'precious_metal', 85000.00);

INSERT INTO liabilities (user_id, name, liability_type, current_balance, interest_rate) VALUES
  (:USER_ID, 'Auto Loan', 'auto_loan', 18500.00, 4.5),
  (:USER_ID, 'Credit Card', 'credit_card', 3200.00, 22.9);

INSERT INTO income_sources (user_id, name, income_type, amount, frequency, is_passive) VALUES
  (:USER_ID, 'Salary', 'salary', 15000.00, 'monthly', false),
  (:USER_ID, 'Rental Income', 'rental', 2800.00, 'monthly', true),
  (:USER_ID, 'Investment Distributions', 'investment', 1200.00, 'monthly', true);

INSERT INTO expenses (user_id, name, expense_type, amount, frequency, is_fixed) VALUES
  (:USER_ID, 'Mortgage Payment', 'housing', 4200.00, 'monthly', true),
  (:USER_ID, 'Groceries', 'living', 800.00, 'monthly', false),
  (:USER_ID, 'Insurance', 'insurance', 450.00, 'monthly', true);

-- Banking (App 2) — uses bank_accounts table (separate from Financial Hub accounts)
INSERT INTO bank_accounts (user_id, name, institution, account_type, balance) VALUES
  (:USER_ID, 'Business Checking', 'Wells Fargo', 'checking', 287800.00);

-- Real Estate (App 3)
INSERT INTO properties (user_id, name, address_line1, city, state_province, country, property_type, purchase_price, current_value, loan_balance, monthly_rent, taxes_annual, insurance_annual, maintenance_monthly) VALUES
  (:USER_ID, 'Rental — Oak St', '456 Oak Street', 'Austin', 'TX', 'US', 'rental', 320000.00, 485000.00, 210000.00, 2800.00, 8400.00, 2400.00, 200.00);

-- Investments (App 4)
INSERT INTO investments (user_id, name, category, invested_capital, current_value, country, status) VALUES
  (:USER_ID, 'Venture Fund Alpha', 'venture_funds', 250000.00, 310000.00, 'US', 'active'),
  (:USER_ID, 'Oil & Gas LP', 'oil_gas', 150000.00, 175000.00, 'US', 'active');

-- Tax (App 5)
INSERT INTO tax_years (user_id, year, country, filing_status, is_filed) VALUES
  (:USER_ID, 2024, 'US', 'married_filing_jointly', true),
  (:USER_ID, 2025, 'US', 'married_filing_jointly', false);

-- Expected dashboard metrics (approximate, with seed data above):
-- Total Assets: ~$1,368,000 (accounts + assets + bank + property + investments)
-- Total Liabilities: ~$231,700
-- Net Worth: ~$1,136,300
-- Monthly Income: ~$19,000
-- Monthly Expenses: ~$5,450
-- Monthly Cash Flow: ~$13,550
-- Passive Income: ~$4,000
