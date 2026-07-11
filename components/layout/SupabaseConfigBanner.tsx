import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export function SupabaseConfigBanner() {
  if (isSupabaseConfigured()) {
    return null;
  }

  return (
    <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
      <p className="font-medium">Supabase is not configured</p>
      <p className="mt-1 text-amber-200/80">
        Copy <code className="text-amber-100">.env.local.example</code> to{" "}
        <code className="text-amber-100">.env.local</code>, add your project URL and anon key,
        then apply the migrations in <code className="text-amber-100">supabase/migrations/</code>.
        Run <code className="text-amber-100">npm run db:verify</code> to confirm all six apps are ready.
      </p>
      <p className="mt-2">
        <Link href="/api/health/supabase" className="text-amber-100 underline hover:text-white">
          Check connection status
        </Link>
      </p>
    </div>
  );
}
