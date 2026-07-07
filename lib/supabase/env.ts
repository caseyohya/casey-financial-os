export function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
}

export function getSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key";
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder.supabase.co"
  );
}
