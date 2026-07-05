-- Casey Financial OS — local development seed
-- Creates the demo profile referenced by DEMO_PROFILE_ID in lib/constants.ts
-- so that data-entry pages (accounts, assets, liabilities, income, expenses)
-- can insert rows that satisfy the profile_id foreign key.

INSERT INTO profiles (id, email, full_name)
VALUES ('00000000-0000-0000-0000-000000000001', 'demo@example.com', 'Demo User')
ON CONFLICT (id) DO NOTHING;
