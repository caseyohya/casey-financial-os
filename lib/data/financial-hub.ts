import { createClient } from "@/lib/supabase/server";
import type { FinancialHubData } from "@/lib/types/financial-hub";

export async function getFinancialHubData(): Promise<FinancialHubData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      accounts: [],
      assets: [],
      liabilities: [],
      incomeSources: [],
      expenses: [],
    };
  }

  const [accountsRes, assetsRes, liabilitiesRes, incomeRes, expensesRes] = await Promise.all([
    supabase.from("accounts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("assets").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("liabilities").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("income_sources").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("expenses").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);

  return {
    accounts: accountsRes.data ?? [],
    assets: assetsRes.data ?? [],
    liabilities: liabilitiesRes.data ?? [],
    incomeSources: incomeRes.data ?? [],
    expenses: expensesRes.data ?? [],
  };
}
