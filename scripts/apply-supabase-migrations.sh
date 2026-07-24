#!/usr/bin/env bash
# Apply Casey Financial OS SQL migrations to a linked remote Supabase project.
#
# Required (choose one auth path):
#   A) SUPABASE_ACCESS_TOKEN + SUPABASE_DB_PASSWORD
#   B) DATABASE_URL (postgres connection string with password)
#
# Optional for app connectivity verification:
#   NEXT_PUBLIC_SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY
#
# Usage:
#   export SUPABASE_ACCESS_TOKEN=sbp_...
#   export SUPABASE_DB_PASSWORD='your-db-password'
#   ./scripts/apply-supabase-migrations.sh
#
# Or with DATABASE_URL:
#   export DATABASE_URL='postgresql://postgres.[ref]:[password]@aws-0-....pooler.supabase.com:6543/postgres'
#   ./scripts/apply-supabase-migrations.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PROJECT_REF="${SUPABASE_PROJECT_REF:-kupfikpehfhltjwmnemt}"

if [[ -f .env.local ]]; then
  # shellcheck disable=SC1091
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

echo "Project ref: $PROJECT_REF"
echo "Migrations:"
ls -1 supabase/migrations/*.sql

if [[ -n "${DATABASE_URL:-}" ]]; then
  echo "Applying migrations via DATABASE_URL (psql)..."
  if ! command -v psql >/dev/null 2>&1; then
    echo "Installing postgresql-client..."
    sudo apt-get update -qq && sudo apt-get install -y -qq postgresql-client >/dev/null
  fi
  for f in supabase/migrations/*.sql; do
    echo "→ $f"
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
  done
  echo "Done (psql)."
  exit 0
fi

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  cat <<'EOF'
Missing credentials.

Provide ONE of:

1) Supabase CLI auth (recommended):
   - SUPABASE_ACCESS_TOKEN  (Account → Access Tokens)
   - SUPABASE_DB_PASSWORD   (Project Settings → Database)

2) Direct Postgres:
   - DATABASE_URL           (Project Settings → Database → URI)

Also set in .env.local for the Next.js app:
   NEXT_PUBLIC_SUPABASE_URL=https://kupfikpehfhltjwmnemt.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from Project Settings → API>
EOF
  exit 1
fi

if [[ -z "${SUPABASE_DB_PASSWORD:-}" ]]; then
  echo "SUPABASE_ACCESS_TOKEN is set, but SUPABASE_DB_PASSWORD is missing."
  echo "Find it under: Supabase Dashboard → Project Settings → Database → Database password"
  exit 1
fi

echo "Linking project..."
npx supabase link --project-ref "$PROJECT_REF" -p "$SUPABASE_DB_PASSWORD"

echo "Pushing migrations..."
npx supabase db push -p "$SUPABASE_DB_PASSWORD"

echo "Done (supabase db push)."
