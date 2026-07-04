import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateCpaExport } from "@/lib/utils/exports";
import type { Property, PropertyExpense, PropertyIncome, PropertyMonthlySummary } from "@/lib/types/real-estate";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()), 10);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: properties } = await supabase.from("properties").select("*");
  if (!properties || properties.length === 0) {
    return new NextResponse("No properties found", { status: 404 });
  }

  const propertyIds = properties.map((p: Property) => p.id);

  const [{ data: income }, { data: expenses }, { data: summaries }] = await Promise.all([
    supabase.from("property_income").select("*").in("property_id", propertyIds),
    supabase.from("property_expenses").select("*").in("property_id", propertyIds),
    supabase.from("property_monthly_summary").select("*").in("property_id", propertyIds).eq("year", year),
  ]);

  const incomeByProperty: Record<string, PropertyIncome[]> = {};
  const expensesByProperty: Record<string, PropertyExpense[]> = {};

  for (const i of (income ?? []) as PropertyIncome[]) {
    (incomeByProperty[i.property_id] ??= []).push(i);
  }
  for (const e of (expenses ?? []) as PropertyExpense[]) {
    (expensesByProperty[e.property_id] ??= []).push(e);
  }

  const csv = generateCpaExport(
    properties as Property[],
    incomeByProperty,
    expensesByProperty,
    (summaries ?? []) as PropertyMonthlySummary[],
    year
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="cpa-export-${year}.csv"`,
    },
  });
}
