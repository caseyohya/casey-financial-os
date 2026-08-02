# Auth Validation — Supabase Email/Password

**Date:** August 2, 2026  
**Branch:** `cursor/fix-supabase-auth-1ba0`  
**App:** Casey Financial OS (Next.js 15 App Router)

---

## Root cause

Account creation failed because the app had **no `.env.local`** with real Supabase credentials. `lib/supabase/env.ts` fell back to:

- `NEXT_PUBLIC_SUPABASE_URL` → `https://placeholder.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → `placeholder-anon-key`

Signup then called `supabase.auth.signUp()` against a non-existent host and returned:

```text
AuthRetryableFetchError: fetch failed
```

(underlying DNS error: `ENOTFOUND placeholder.supabase.co`)

Secondary UX gaps that made this hard to diagnose:

1. The cryptic `"fetch failed"` message was shown without explaining the missing env configuration.
2. Signup always redirected to `/login` and did not distinguish email-confirmation (null session) from an immediate session.
3. No development `console.error` logging around Auth API failures.

---

## Stack confirmation

| Item | Value |
|------|--------|
| Next.js | `^15.3.3` (App Router under `app/`) |
| Auth packages | `@supabase/ssr` + `@supabase/supabase-js` only |
| `@supabase/auth-helpers-nextjs` | **Not used** (do not add it) |
| Signup API | `supabase.auth.signUp({ email, password })` |
| Login API | `supabase.auth.signInWithPassword({ email, password })` |
| Protected dashboard | `/executive-dashboard` |
| Auth callback | `/auth/callback` |

---

## Files changed

| File | Change |
|------|--------|
| `components/forms/SignupForm.tsx` | Config guard, visible errors, dev logging, email-confirmation success message, session → `/executive-dashboard`, `emailRedirectTo` |
| `components/forms/LoginForm.tsx` | Config guard, visible errors, dev logging, `signInWithPassword` preserved |
| `lib/supabase/env.ts` | Stronger `isSupabaseConfigured()` checks (rejects placeholders / example values) |
| `lib/supabase/server.ts` | Typed cookie `setAll` via `@supabase/ssr` `CookieOptions` |
| `lib/supabase/middleware.ts` | Typed cookies; session refresh; unauthenticated → `/login`; authenticated on login/signup → `/executive-dashboard` |
| `app/auth/callback/route.ts` | Safer `next` redirect; dev error logging |
| `.env.local.example` | Documents required Auth URL settings |
| `docs/auth-validation.md` | This document |

---

## Supabase settings you must configure manually

1. **Create / open a Supabase project** at [https://supabase.com](https://supabase.com).

2. **Copy API credentials** from **Project Settings → API**:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Create `.env.local` in the repo root** (never commit this file):

   ```bash
   cp .env.local.example .env.local
   ```

   Then set real values:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
   ```

4. **Auth URL configuration** (Dashboard → **Authentication → URL Configuration**):
   - **Site URL:** `http://localhost:3000`
   - **Redirect URLs:** add `http://localhost:3000/auth/callback`
   - For production, also add `https://YOUR_DOMAIN/auth/callback` and set Site URL to the production origin.

5. **Email confirmation** (Dashboard → **Authentication → Providers → Email**):
   - If **Confirm email** is **enabled**: signup returns a user with **no session**; the app shows “check your email”.
   - If **Confirm email** is **disabled**: signup returns a session and the app redirects to `/executive-dashboard`.

6. **Apply the database schema** (profiles trigger, RLS) so new users get a profile row — see `docs/database-setup.md` / `supabase/migrations/`.

7. **Restart the Next.js dev server** after any `.env.local` change (`npm run dev`).

---

## Exact signup test steps

1. Ensure `.env.local` has a real Supabase URL and anon key (not placeholders).
2. Restart the app: `npm run dev`.
3. Open **http://localhost:3000/signup**.
4. Enter full name, a unique email, and a password (≥ 8 characters).
5. Click **Create account**.
6. Expected outcomes:
   - **Email confirmation ON:** green success message: *Account created. Check your email for a confirmation link before signing in.* Open the email, confirm, then sign in at `/login`.
   - **Email confirmation OFF:** green success message and redirect to **http://localhost:3000/executive-dashboard**.
7. Negative checks:
   - With missing/invalid env: red alert explaining Supabase is not configured / unreachable (devtools console shows `[auth:signUp]`).
   - Duplicate email (when confirmation is on): message that an account already exists.

---

## Exact login test steps

1. Open **http://localhost:3000/login**.
2. Enter the email/password of a confirmed (or confirmation-disabled) user.
3. Click **Sign in**.
4. Expected: redirect to **http://localhost:3000/executive-dashboard**.
5. Open an incognito window (no session) and visit **http://localhost:3000/executive-dashboard** → should redirect to **http://localhost:3000/login**.
6. While signed in, visit **http://localhost:3000/login** or `/signup` → should redirect to `/executive-dashboard`.
7. Wrong password → visible Supabase error on the form; in development, `[auth:signInWithPassword]` is logged to the console.

---

## Middleware / SSR cookie checks

| Check | Status |
|-------|--------|
| Browser client via `createBrowserClient` (`@supabase/ssr`) | Yes — `lib/supabase/client.ts` |
| Server client via `createServerClient` + `cookies()` getAll/setAll | Yes — `lib/supabase/server.ts` |
| Middleware refreshes session with `getUser()` and writes cookies | Yes — `lib/supabase/middleware.ts` |
| Protected routes redirect unauthenticated users to `/login` | Yes |
| Authenticated users are not stuck on `/login` or `/signup` | Yes — redirected to `/executive-dashboard` |
| Auth callback exchanges `code` for session | Yes — `app/auth/callback/route.ts` |
