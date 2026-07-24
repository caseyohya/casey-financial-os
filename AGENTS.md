# Casey Financial OS — Agent Notes

Next.js 15 (App Router, Turbopack) + React 19 + TypeScript + Tailwind, backed by Supabase (Auth + Postgres with RLS). See `README.md` and `docs/database-setup.md` for full docs.

## Cursor Cloud specific instructions

Dependencies (`npm install`) are refreshed automatically by the startup update script. The notes below cover the non-obvious steps to actually run the app, since it needs a local Supabase backend for auth/data.

### Running the app locally

The app is non-functional without Supabase (auth + all data). The intended local backend is Supabase CLI running in Docker (`supabase/config.toml` + `supabase/migrations/`). Both Docker and the Supabase CLI are preinstalled in the snapshot, but the Docker daemon is NOT auto-started (no systemd in this VM).

1. Start the Docker daemon manually (idempotent — skip if already running):
   `sudo dockerd &` (logs to your redirect). Then `sudo chmod 666 /var/run/docker.sock` so `docker`/`supabase` work without sudo in the current shell.
   Docker 29 needs `fuse-overlayfs` + `containerd-snapshotter: false` in `/etc/docker/daemon.json` (already configured in the snapshot).
2. Start Supabase: `supabase start` (from repo root). API = `http://127.0.0.1:54321`, DB = `postgresql://postgres:postgres@127.0.0.1:54322/postgres`, Studio = `http://127.0.0.1:54323`. Migrations in `supabase/migrations/` are applied automatically.
3. Create `.env.local` (gitignored, so it must be recreated on fresh VMs) with the fixed local Supabase defaults:
   ```
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
   ```
   (The anon key is Supabase's standard local demo key printed by `supabase start`; not a real secret.)
4. Run the dev server: `npm run dev` (Turbopack, http://localhost:3000).

Lint: `npm run lint`. Typecheck: `npx tsc --noEmit`. Prod build: `npm run build` (note: don't run concurrently with `npm run dev` — both write to `.next/`).

### Gotchas

- Email confirmations are disabled locally (`enable_confirmations = false` in `config.toml`), so signup auto-creates an active session. The middleware then redirects an authenticated user away from `/login`/`/signup` to `/executive-dashboard`, so you appear "logged in immediately" after signing up — this is expected, not a bug.
- A `public.profiles` row is auto-created on signup via the `on_auth_user_created` trigger. If the migration hasn't applied, signup succeeds at the auth layer but dashboard pages that read `public` tables/views will fail.
- The optional seed (`database/seed.sql`) is parameterized by `:USER_ID` and expects the documented seed user; for a quick demo it's simpler to just sign up a fresh account and add data through the UI (Financial Hub → Add Account, etc.).
