const PLACEHOLDER_URL = "https://placeholder.supabase.co";
const PLACEHOLDER_ANON_KEY = "placeholder-anon-key";

/**
 * Returns the Supabase project URL.
 * Falls back to a placeholder so `next build` succeeds without secrets;
 * runtime auth forms check `isSupabaseConfigured()` before calling Auth APIs.
 */
export function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? PLACEHOLDER_URL;
}

export function getSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? PLACEHOLDER_ANON_KEY;
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return Boolean(
    url &&
      key &&
      url !== PLACEHOLDER_URL &&
      key !== PLACEHOLDER_ANON_KEY &&
      !url.includes("your-project") &&
      key !== "your-anon-key"
  );
}
