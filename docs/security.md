# Security

## Authentication

- **Provider**: Supabase Auth with email/password
- **Session management**: HTTP-only cookies via `@supabase/ssr`
- **Middleware protection**: All routes except `/`, `/login`, `/signup`, and `/auth/*` require authentication
- **Password policy**: Minimum 8 characters (enforced client-side; configure server-side in Supabase dashboard)

## Authorization

- **Row Level Security (RLS)**: Enabled on all tables
- **Policy model**: Users can only SELECT, INSERT, UPDATE, and DELETE their own rows (`auth.uid() = user_id`)
- **Profile creation**: Handled by a `SECURITY DEFINER` trigger on `auth.users` insert — users cannot create profiles for other users

## Data Access

- **Read-only integrations**: All external financial integrations must be read-only. No write access to bank accounts, brokerage accounts, or payment systems.
- **No execution**: The platform does not support payments, transfers, trading, or any form of transaction execution.
- **Manual entry**: Phase 1 uses manual data entry only. No external API connections.

## Environment Variables

| Variable | Scope | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anonymous key (RLS-protected) |

Never commit `.env.local` or expose service role keys in client-side code.

## Deployment Security

- Deploy on Vercel with environment variables set in the dashboard
- Enable Supabase Auth email confirmation in production
- Configure allowed redirect URLs in Supabase Auth settings
- Use HTTPS only (enforced by Vercel and Supabase)

## Future Considerations

- Multi-factor authentication (Supabase supports TOTP)
- Audit logging for data changes
- Rate limiting on auth endpoints
- Content Security Policy headers
- Data encryption at rest (handled by Supabase/PostgreSQL)
