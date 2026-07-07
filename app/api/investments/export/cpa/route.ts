import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateInvestmentCpaExport } from "@/lib/utils/investment-exports";
import type {
  Investment,
  InvestmentTransaction,
  InvestmentDistribution,
  InvestmentTaxItem,
  InvestmentCapitalCall,
} from "@/lib/types/investments";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()), 10);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: investments } = await supabase.from("investments").select("*");
  if (!investments?.length) return new NextResponse("No investments found", { status: 404 });

  const ids = investments.map((i: Investment) => i.id);
  const [tx, dist, tax, calls] = await Promise.all([
    supabase.from("investment_transactions").select("*").in("investment_id", ids),
    supabase.from("investment_distributions").select("*").in("investment_id", ids),
    supabase.from("investment_tax_items").select("*").in("investment_id", ids),
    supabase.from("investment_capital_calls").select("*").in("investment_id", ids),
  ]);

  const transactionsByInvestment: Record<string, InvestmentTransaction[]> = {};
  const distributionsByInvestment: Record<string, InvestmentDistribution[]> = {};
  const taxItemsByInvestment: Record<string, InvestmentTaxItem[]> = {};
  const capitalCallsByInvestment: Record<string, InvestmentCapitalCall[]> = {};

  for (const t of (tx.data ?? []) as InvestmentTransaction[]) {
    (transactionsByInvestment[t.investment_id] ??= []).push(t);
  }
  for (const d of (dist.data ?? []) as InvestmentDistribution[]) {
    (distributionsByInvestment[d.investment_id] ??= []).push(d);
  }
  for (const t of (tax.data ?? []) as InvestmentTaxItem[]) {
    (taxItemsByInvestment[t.investment_id] ??= []).push(t);
  }
  for (const c of (calls.data ?? []) as InvestmentCapitalCall[]) {
    (capitalCallsByInvestment[c.investment_id] ??= []).push(c);
  }

  const csv = generateInvestmentCpaExport(
    investments as Investment[],
    transactionsByInvestment,
    distributionsByInvestment,
    taxItemsByInvestment,
    capitalCallsByInvestment,
    year
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="investment-cpa-${year}.csv"`,
    },
  });
}
