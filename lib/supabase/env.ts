export function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
}

export function getSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key";
}

function isPlaceholder(value: string | undefined): boolean {
  if (!value) return true;
  const normalized = value.trim().toLowerCase();
  return (
    normalized.length === 0 ||
    normalized === "your-anon-key" ||
    normalized === "your-anon-or-publishable-key" ||
    normalized === "placeholder-anon-key" ||
    normalized === "https://placeholder.supabase.co" ||
    normalized === "https://your-project.supabase.co"
  );
}

/** True when URL + anon/publishable key look configured for a real project. */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && !isPlaceholder(url) && !isPlaceholder(key));
}
