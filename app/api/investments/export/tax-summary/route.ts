import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateAnnualTaxSummaryCsv } from "@/lib/utils/investment-exports";
import type { Investment, InvestmentTaxItem } from "@/lib/types/investments";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()), 10);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: investments } = await supabase.from("investments").select("*");
  if (!investments?.length) return new NextResponse("No investments found", { status: 404 });

  const ids = investments.map((i: Investment) => i.id);
  const { data: taxItems } = await supabase.from("investment_tax_items").select("*").in("investment_id", ids);

  const taxItemsByInvestment: Record<string, InvestmentTaxItem[]> = {};
  for (const t of (taxItems ?? []) as InvestmentTaxItem[]) {
    (taxItemsByInvestment[t.investment_id] ??= []).push(t);
  }

  const csv = generateAnnualTaxSummaryCsv(investments as Investment[], taxItemsByInvestment, year);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="investment-tax-summary-${year}.csv"`,
    },
  });
}
