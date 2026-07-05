-- Casey Financial OS — local development grants
-- The shipped schema.sql defines tables without RLS or explicit grants and the
-- app talks to the tables using the Supabase anon key. Hosted Supabase projects
-- auto-grant privileges on public tables to the anon/authenticated roles; local
-- Supabase does not, so we replicate that here for local development only.

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated;
