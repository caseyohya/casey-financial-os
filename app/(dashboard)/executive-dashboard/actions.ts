"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { refreshExecutiveSummaries } from "@/lib/data/executive";
import type { ExecutiveFilters } from "@/lib/types/executive";

export async function refreshSummaries(filters: ExecutiveFilters) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  await refreshExecutiveSummaries(user.id, filters);
  revalidatePath("/executive-dashboard");
  return { success: true };
}
