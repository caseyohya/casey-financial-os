import { createClient } from "@/lib/supabase/server";
import type {
  TaxYear,
  TaxYearWithRelations,
  TaxYearFormData,
} from "@/lib/types/tax";
import { DEFAULT_DOCUMENT_CHECKLIST as CHECKLIST } from "@/lib/types/tax";

export async function getTaxYears(): Promise<TaxYear[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tax_years")
    .select("*")
    .order("year", { ascending: false });

  if (error) {
    console.error("getTaxYears error:", error.message);
    return [];
  }
  return (data ?? []) as TaxYear[];
}

export async function getTaxYearByYear(year: number): Promise<TaxYearWithRelations | null> {
  const supabase = await createClient();

  const { data: taxYear, error } = await supabase
    .from("tax_years")
    .select("*")
    .eq("year", year)
    .single();

  if (error || !taxYear) return null;

  const yearId = taxYear.id;

  const [
    documents,
    accounts,
    income_items,
    expense_items,
    deductions,
    foreign_accounts,
    fbar_items,
    form_8938_items,
    schedule_e_items,
    k1_items,
    depreciation_items,
    exports,
  ] = await Promise.all([
    supabase.from("tax_documents").select("*").eq("tax_year_id", yearId).order("name"),
    supabase.from("tax_accounts").select("*").eq("tax_year_id", yearId).order("account_name"),
    supabase.from("tax_income_items").select("*").eq("tax_year_id", yearId).order("created_at", { ascending: false }),
    supabase.from("tax_expense_items").select("*").eq("tax_year_id", yearId).order("created_at", { ascending: false }),
    supabase.from("tax_deductions").select("*").eq("tax_year_id", yearId).order("created_at", { ascending: false }),
    supabase.from("tax_foreign_accounts").select("*").eq("tax_year_id", yearId).order("account_name"),
    supabase.from("tax_fbar_items").select("*").eq("tax_year_id", yearId).order("account_name"),
    supabase.from("tax_form_8938_items").select("*").eq("tax_year_id", yearId).order("asset_description"),
    supabase.from("tax_schedule_e_items").select("*").eq("tax_year_id", yearId).order("property_name"),
    supabase.from("tax_k1_items").select("*").eq("tax_year_id", yearId).order("entity_name"),
    supabase.from("tax_depreciation_items").select("*").eq("tax_year_id", yearId).order("property_name"),
    supabase.from("tax_exports").select("*").eq("tax_year_id", yearId).order("generated_at", { ascending: false }),
  ]);

  return {
    ...(taxYear as TaxYear),
    documents: documents.data ?? [],
    accounts: accounts.data ?? [],
    income_items: income_items.data ?? [],
    expense_items: expense_items.data ?? [],
    deductions: deductions.data ?? [],
    foreign_accounts: foreign_accounts.data ?? [],
    fbar_items: fbar_items.data ?? [],
    form_8938_items: form_8938_items.data ?? [],
    schedule_e_items: schedule_e_items.data ?? [],
    k1_items: k1_items.data ?? [],
    depreciation_items: depreciation_items.data ?? [],
    exports: exports.data ?? [],
  };
}

export async function getTaxYearById(id: string): Promise<TaxYearWithRelations | null> {
  const supabase = await createClient();
  const { data: taxYear } = await supabase.from("tax_years").select("year").eq("id", id).single();
  if (!taxYear) return null;
  return getTaxYearByYear(taxYear.year);
}

export function taxYearFormToRow(data: TaxYearFormData, userId: string) {
  return {
    user_id: userId,
    year: data.year,
    tax_year: data.year,
    country: "US",
    filing_status: data.filing_status,
    status: data.status,
    usd_to_jpy_rate: data.usd_to_jpy_rate ?? null,
    jpy_to_usd_rate: data.jpy_to_usd_rate ?? null,
    notes: data.notes ?? null,
  };
}

export function getDefaultDocumentRows(taxYearId: string, userId: string) {
  return CHECKLIST.map((item) => ({
    user_id: userId,
    tax_year_id: taxYearId,
    name: item.name,
    document_type: item.document_type,
    is_required: true,
    is_received: false,
  }));
}
