# Casey Financial OS

Unified financial operating system with six integrated applications backed by Supabase/PostgreSQL.

## Database

| File | Description |
|------|-------------|
| [`database/schema.sql`](database/schema.sql) | Full schema: 50+ tables, RLS, indexes, dashboard views |
| [`database/seed.sql`](database/seed.sql) | Test user and sample data |
| [`database/types/database.types.ts`](database/types/database.types.ts) | TypeScript types for Supabase client |
| [`docs/database-setup.md`](docs/database-setup.md) | Setup, relationships, and test queries |

### Quick start

```bash
supabase start
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f database/schema.sql
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f database/seed.sql
```

Test user: `casey@example.com` / `testpassword123`

## Applications

1. Financial Hub
2. Banking Platform
3. Real Estate Platform
4. Investment Platform
5. Tax Intelligence Platform
6. Executive Dashboard
