import { PageHeader } from "@/components/layout/PageHeader";
import { ExecutiveDashboardClient } from "@/components/executive/ExecutiveDashboardClient";
import {
  getExecutiveDashboardData,
  fetchRawModuleData,
  fetchHistoricalSummaries,
  refreshExecutiveSummaries,
} from "@/lib/data/executive";
import { createClient } from "@/lib/supabase/server";

export default async function ExecutiveDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const initialData = await getExecutiveDashboardData();
  const [rawData, historical] = await Promise.all([
    fetchRawModuleData(user.id),
    fetchHistoricalSummaries(user.id),
  ]);

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
