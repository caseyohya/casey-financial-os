import { redirect } from "next/navigation";
import { FinancialHubClient } from "@/components/financial-hub/FinancialHubClient";
import { getFinancialHubData } from "@/lib/data/financial-hub";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function FinancialHubPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const data = await getFinancialHubData();

  return <FinancialHubClient initialData={data} />;
}
