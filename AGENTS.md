# AGENTS.md

## Cursor Cloud specific instructions

### What this project is
Single Next.js 14 (App Router) + TypeScript app: "Casey Financial OS – Financial Hub". Data is stored in Supabase (Postgres) and read/written from the client with the Supabase JS client using the anon key. There is no auth flow — all data is scoped to a hardcoded demo profile (`DEMO_PROFILE_ID` in `lib/constants.ts`). Standard scripts live in `package.json` (`dev`, `build`, `start`, `lint`).

### Services
- **Next.js dev server** — `npm run dev` on port 3000. Reads env from `.env.local`.
- **Local Supabase stack** — the app needs a Supabase backend for any data read/write. This repo is configured for local Supabase via the Supabase CLI (`supabase/config.toml`, `supabase/migrations/`, `supabase/seed.sql`). API runs on `http://127.0.0.1:54321`, Studio on `http://127.0.0.1:54323`, Postgres on `54322`.

### Startup (not handled by the update script)
Docker and the Supabase CLI are preinstalled in the VM image, but the daemon/stack must be (re)started each session:
1. Start Docker daemon (needed by Supabase): `sudo dockerd > /tmp/dockerd.log 2>&1 &` then `sudo chmod 666 /var/run/docker.sock` (the socket is root:docker; chmod avoids re-login for group membership). Docker 29 is configured with the `fuse-overlayfs` storage driver and `containerd-snapshotter` disabled in `/etc/docker/daemon.json` — required for this VM's kernel.
2. Start Supabase: `supabase start` (first run pulls images; subsequent runs are fast). To (re)apply schema + seed: `supabase db reset`.
3. Create `.env.local` (gitignored) with the local Supabase creds:
   ```
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key printed by `supabase start` / `supabase status`>
   ```
   The anon key for the default local stack is stable across restarts; get it any time with `supabase status`.
4. `npm run dev`.

### Non-obvious gotchas
- **Grants**: The shipped `supabase/schema.sql` creates tables with no RLS and no grants. Hosted Supabase auto-grants public tables to the `anon`/`authenticated` roles, but local Supabase does not, so the anon key gets `permission denied`. `supabase/migrations/20260705000001_grants.sql` replicates the hosted grants for local dev. If you add new tables, they inherit grants via `ALTER DEFAULT PRIVILEGES`, but re-running the grants migration (via `supabase db reset`) is the safe path.
- **Demo profile**: All pages query/insert with `profile_id = DEMO_PROFILE_ID`. `supabase/seed.sql` inserts that profile row so inserts satisfy the `profile_id` foreign key. Without it, inserts fail.
- **ESLint**: The repo shipped `"lint": "next lint"` with no ESLint config, which makes `next lint` prompt interactively. `.eslintrc.json` (extends `next/core-web-vitals`) was added so `npm run lint` runs non-interactively. Current lint output is warnings only (react-hooks/exhaustive-deps).
- `lib/supabase.ts` falls back to `https://placeholder.supabase.co` if env vars are missing, so the UI renders without Supabase but all data operations fail — always ensure `.env.local` + local Supabase are running for real testing.
