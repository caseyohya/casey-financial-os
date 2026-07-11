import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { ALL_REQUIRED_TABLES, REQUIRED_STORAGE_BUCKETS } from "@/lib/supabase/tables";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        configured: false,
        ready: false,
        message: "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local",
      },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const tableChecks: Record<string, boolean> = {};
  const tableErrors: Record<string, string> = {};

  await Promise.all(
    ALL_REQUIRED_TABLES.map(async (table) => {
      const { error } = await supabase.from(table).select("*", { count: "exact", head: true });
      if (error) {
        tableChecks[table] = false;
        tableErrors[table] = error.message;
      } else {
        tableChecks[table] = true;
      }
    })
  );

  const bucketChecks: Record<string, boolean> = {};
  const bucketErrors: Record<string, string> = {};

  await Promise.all(
    REQUIRED_STORAGE_BUCKETS.map(async (bucket) => {
      const { error } = await supabase.storage.from(bucket).list("", { limit: 1 });
      if (error) {
        bucketChecks[bucket] = false;
        bucketErrors[bucket] = error.message;
      } else {
        bucketChecks[bucket] = true;
      }
    })
  );

  const tablesReady = Object.values(tableChecks).every(Boolean);
  const bucketsReady = Object.values(bucketChecks).every(Boolean);
  const ready = tablesReady && bucketsReady;

  return NextResponse.json({
    configured: true,
    ready,
    tables: tableChecks,
    tableErrors: tablesReady ? undefined : tableErrors,
    buckets: bucketChecks,
    bucketErrors: bucketsReady ? undefined : bucketErrors,
    message: ready
      ? "All six apps are connected to Supabase"
      : "Supabase is configured but schema or storage is incomplete. Run migrations.",
  }, { status: ready ? 200 : 503 });
}
