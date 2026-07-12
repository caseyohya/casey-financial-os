import { PageHeader } from "@/components/layout/PageHeader";
import { ExecutiveDashboardClient } from "@/components/executive/ExecutiveDashboardClient";
import {
  getExecutiveDashboardData,
  refreshExecutiveSummaries,
} from "@/lib/data/executive";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ExecutiveDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: initialData, rawData, historical } = await getExecutiveDashboardData();

  await refreshExecutiveSummaries(user.id, initialData.filters).catch(() => {});

  return (
    <div>
      <PageHeader
        title="Executive Dashboard"
        description="CFO-level view — net worth, cash flow, passive income, and financial independence"
      />

      <ExecutiveDashboardClient
        initialData={initialData}
        rawData={rawData}
        historical={historical}
      />
    </div>
  );
}
