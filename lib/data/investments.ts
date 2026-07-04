import { createClient } from "@/lib/supabase/server";
import type {
  Investment,
  InvestmentEntity,
  InvestmentWithRelations,
  InvestmentFormData,
  InvestmentTransaction,
  InvestmentDistribution,
  InvestmentCapitalCall,
  InvestmentTaxItem,
  PreciousMetal,
} from "@/lib/types/investments";

export async function getInvestments(): Promise<Investment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("investments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getInvestments error:", error.message);
    return [];
  }
  return (data ?? []) as Investment[];
}

export async function getInvestmentEntities(): Promise<InvestmentEntity[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("investment_entities")
    .select("*")
    .order("name");
  return (data ?? []) as InvestmentEntity[];
}

export async function getInvestmentById(id: string): Promise<InvestmentWithRelations | null> {
  const supabase = await createClient();

  const { data: investment, error } = await supabase
    .from("investments")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !investment) return null;

  const [
    entity,
    transactions,
    distributions,
    capital_calls,
    valuations,
    tax_items,
    documents,
    precious_metals,
    monthly_summaries,
  ] = await Promise.all([
    investment.entity_id
      ? supabase.from("investment_entities").select("*").eq("id", investment.entity_id).single()
      : Promise.resolve({ data: null }),
    supabase.from("investment_transactions").select("*").eq("investment_id", id).order("transaction_date", { ascending: false }),
    supabase.from("investment_distributions").select("*").eq("investment_id", id).order("distribution_date", { ascending: false }),
    supabase.from("investment_capital_calls").select("*").eq("investment_id", id).order("call_date", { ascending: false }),
    supabase.from("investment_valuations").select("*").eq("investment_id", id).order("valuation_date", { ascending: false }),
    supabase.from("investment_tax_items").select("*").eq("investment_id", id).order("tax_year", { ascending: false }),
    supabase.from("investment_documents").select("*").eq("investment_id", id).order("uploaded_at", { ascending: false }),
    supabase.from("precious_metals").select("*").eq("investment_id", id),
    supabase.from("investment_monthly_summary").select("*").eq("investment_id", id).order("year", { ascending: false }),
  ]);

  return {
    ...(investment as Investment),
    entity: entity.data as InvestmentEntity | null,
    transactions: (transactions.data ?? []) as InvestmentTransaction[],
    distributions: (distributions.data ?? []) as InvestmentDistribution[],
    capital_calls: (capital_calls.data ?? []) as InvestmentCapitalCall[],
    valuations: valuations.data ?? [],
    tax_items: (tax_items.data ?? []) as InvestmentTaxItem[],
    documents: documents.data ?? [],
    precious_metals: (precious_metals.data ?? []) as PreciousMetal[],
    monthly_summaries: monthly_summaries.data ?? [],
  };
}

export async function getPortfolioData() {
  const investments = await getInvestments();
  const supabase = await createClient();
  const ids = investments.map((i) => i.id);

  if (ids.length === 0) {
    return {
      investments,
      transactionsByInvestment: {},
      distributionsByInvestment: {},
      taxItemsByInvestment: {},
      metalsByInvestment: {},
    };
  }

  const [transactions, distributions, taxItems, metals] = await Promise.all([
    supabase.from("investment_transactions").select("*").in("investment_id", ids),
    supabase.from("investment_distributions").select("*").in("investment_id", ids),
    supabase.from("investment_tax_items").select("*").in("investment_id", ids),
    supabase.from("precious_metals").select("*").in("investment_id", ids),
  ]);

  const transactionsByInvestment: Record<string, InvestmentTransaction[]> = {};
  const distributionsByInvestment: Record<string, InvestmentDistribution[]> = {};
  const taxItemsByInvestment: Record<string, InvestmentTaxItem[]> = {};
  const metalsByInvestment: Record<string, PreciousMetal[]> = {};

  for (const t of (transactions.data ?? []) as InvestmentTransaction[]) {
    (transactionsByInvestment[t.investment_id] ??= []).push(t);
  }
  for (const d of (distributions.data ?? []) as InvestmentDistribution[]) {
    (distributionsByInvestment[d.investment_id] ??= []).push(d);
  }
  for (const t of (taxItems.data ?? []) as InvestmentTaxItem[]) {
    (taxItemsByInvestment[t.investment_id] ??= []).push(t);
  }
  for (const m of (metals.data ?? []) as PreciousMetal[]) {
    if (m.investment_id) (metalsByInvestment[m.investment_id] ??= []).push(m);
  }

  return {
    investments,
    transactionsByInvestment,
    distributionsByInvestment,
    taxItemsByInvestment,
    metalsByInvestment,
  };
}

export function investmentFormToRow(data: InvestmentFormData, userId: string) {
  return {
    user_id: userId,
    name: data.name,
    entity_id: data.entity_id || null,
    category: data.category,
    purchase_date: data.purchase_date || null,
    invested_capital: data.invested_capital,
    current_value: data.current_value,
    ownership_percent: data.ownership_percent,
    currency: data.currency,
    country: data.country,
    status: data.status,
    tax_basis: data.tax_basis || data.invested_capital,
    remaining_basis: data.remaining_basis || data.tax_basis || data.invested_capital,
    idc_deduction_total: data.idc_deduction_total,
    notes: data.notes || null,
  };
}
