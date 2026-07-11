import { createClient } from "@/lib/supabase/server";
import type {
  Property,
  PropertyDocument,
  PropertyExpense,
  PropertyFormData,
  PropertyIncome,
  PropertyMortgage,
  PropertyTenant,
  PropertyWithRelations,
} from "@/lib/types/real-estate";

export { formatPropertyAddress } from "@/lib/utils/real-estate";

export async function getProperties(): Promise<Property[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getProperties error:", error.message);
    return [];
  }
  return (data ?? []) as Property[];
}

export async function getPropertyById(id: string): Promise<PropertyWithRelations | null> {
  const supabase = await createClient();

  const { data: property, error } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !property) return null;

  const [mortgages, tenants, income, expenses, documents, monthly_summaries, depreciation] =
    await Promise.all([
      supabase.from("property_mortgages").select("*").eq("property_id", id),
      supabase.from("property_tenants").select("*").eq("property_id", id).order("lease_start", { ascending: false }),
      supabase.from("property_income").select("*").eq("property_id", id).order("income_date", { ascending: false }),
      supabase.from("property_expenses").select("*").eq("property_id", id).order("expense_date", { ascending: false }),
      supabase.from("property_documents").select("*").eq("property_id", id).order("uploaded_at", { ascending: false }),
      supabase.from("property_monthly_summary").select("*").eq("property_id", id).order("year", { ascending: false }).order("month", { ascending: false }),
      supabase.from("property_depreciation").select("*").eq("property_id", id).order("tax_year", { ascending: false }),
    ]);

  return {
    ...(property as Property),
    mortgages: (mortgages.data ?? []) as PropertyMortgage[],
    tenants: (tenants.data ?? []) as PropertyTenant[],
    income: (income.data ?? []) as PropertyIncome[],
    expenses: (expenses.data ?? []) as PropertyExpense[],
    documents: (documents.data ?? []) as PropertyDocument[],
    monthly_summaries: monthly_summaries.data ?? [],
    depreciation: depreciation.data ?? [],
  };
}

export async function getPortfolioData() {
  const properties = await getProperties();
  const supabase = await createClient();

  const propertyIds = properties.map((p) => p.id);
  if (propertyIds.length === 0) {
    return { properties, mortgagesByProperty: {}, incomeByProperty: {}, expensesByProperty: {} };
  }

  const [mortgages, income, expenses] = await Promise.all([
    supabase.from("property_mortgages").select("*").in("property_id", propertyIds),
    supabase.from("property_income").select("*").in("property_id", propertyIds),
    supabase.from("property_expenses").select("*").in("property_id", propertyIds),
  ]);

  const mortgagesByProperty: Record<string, PropertyMortgage[]> = {};
  const incomeByProperty: Record<string, PropertyIncome[]> = {};
  const expensesByProperty: Record<string, PropertyExpense[]> = {};

  for (const m of (mortgages.data ?? []) as PropertyMortgage[]) {
    (mortgagesByProperty[m.property_id] ??= []).push(m);
  }
  for (const i of (income.data ?? []) as PropertyIncome[]) {
    (incomeByProperty[i.property_id] ??= []).push(i);
  }
  for (const e of (expenses.data ?? []) as PropertyExpense[]) {
    (expensesByProperty[e.property_id] ??= []).push(e);
  }

  return { properties, mortgagesByProperty, incomeByProperty, expensesByProperty };
}

export function propertyFormToRow(data: PropertyFormData, userId: string) {
  return {
    user_id: userId,
    name: data.name,
    address_line1: data.address_line1,
    address_line2: data.address_line2 || null,
    city: data.city,
    state_province: data.state_province || null,
    postal_code: data.postal_code || null,
    country: data.country,
    currency: data.currency,
    currency_code: data.currency,
    property_type: data.property_type,
    purchase_price: data.purchase_price,
    purchase_date: data.purchase_date || null,
    current_value: data.current_value,
    land_value: data.land_value,
    building_value: data.building_value,
    loan_balance: data.loan_balance,
    interest_rate: data.interest_rate ?? null,
    monthly_rent: data.monthly_rent,
    hoa_monthly: data.hoa_monthly,
    taxes_annual: data.taxes_annual,
    insurance_annual: data.insurance_annual,
    maintenance_monthly: data.maintenance_monthly,
    vacancy_rate_percent: data.vacancy_rate_percent,
    notes: data.notes || null,
  };
}
