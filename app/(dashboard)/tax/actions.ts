"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { taxYearFormToRow, getDefaultDocumentRows } from "@/lib/data/tax";
import type {
  TaxYearFormData,
  FilingStatus,
  TaxYearStatus,
  Currency,
  DocumentType,
  IncomeType,
  ExpenseType,
  DeductionType,
} from "@/lib/types/tax";

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");
  return { supabase, user };
}

export async function createTaxYear(data: TaxYearFormData) {
  const { supabase, user } = await getAuthenticatedUser();
  const row = taxYearFormToRow(data, user.id);

  const { data: taxYear, error } = await supabase
    .from("tax_years")
    .insert(row)
    .select()
    .single();

  if (error) return { error: error.message };

  const docRows = getDefaultDocumentRows(taxYear.id, user.id);
  await supabase.from("tax_documents").insert(docRows);

  revalidatePath("/tax");
  redirect(`/tax/${data.year}`);
}

export async function updateTaxYear(year: number, data: Partial<TaxYearFormData>) {
  const { supabase } = await getAuthenticatedUser();

  const { error } = await supabase
    .from("tax_years")
    .update({
      filing_status: data.filing_status,
      status: data.status,
      usd_to_jpy_rate: data.usd_to_jpy_rate,
      jpy_to_usd_rate: data.jpy_to_usd_rate,
      notes: data.notes,
    })
    .eq("year", year);

  if (error) return { error: error.message };
  revalidatePath("/tax");
  revalidatePath(`/tax/${year}`);
  return { success: true };
}

export async function deleteTaxYear(year: number) {
  const { supabase } = await getAuthenticatedUser();
  const { error } = await supabase.from("tax_years").delete().eq("year", year);
  if (error) return { error: error.message };
  revalidatePath("/tax");
  redirect("/tax");
}

export async function addTaxAccount(
  taxYearId: string,
  year: number,
  data: {
    account_name: string;
    institution?: string;
    country?: string;
    currency?: Currency;
    account_type?: string;
    account_number_last4?: string;
    is_foreign?: boolean;
    year_end_balance?: number | null;
    max_annual_balance?: number | null;
    notes?: string;
  }
) {
  const { supabase, user } = await getAuthenticatedUser();

  const { error } = await supabase.from("tax_accounts").insert({
    user_id: user.id,
    tax_year_id: taxYearId,
    account_name: data.account_name,
    institution: data.institution ?? "",
    country: data.country ?? "US",
    currency: data.currency ?? "USD",
    account_type: data.account_type ?? "checking",
    account_number_last4: data.account_number_last4 ?? null,
    is_foreign: data.is_foreign ?? false,
    year_end_balance: data.year_end_balance ?? null,
    max_annual_balance: data.max_annual_balance ?? null,
    notes: data.notes ?? null,
  });

  if (error) return { error: error.message };
  revalidatePath(`/tax/${year}`);
  return { success: true };
}

export async function updateTaxAccount(
  id: string,
  year: number,
  data: Record<string, unknown>
) {
  const { supabase } = await getAuthenticatedUser();
  const { error } = await supabase.from("tax_accounts").update(data).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/tax/${year}`);
  return { success: true };
}

export async function deleteTaxAccount(id: string, year: number) {
  const { supabase } = await getAuthenticatedUser();
  const { error } = await supabase.from("tax_accounts").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/tax/${year}`);
  return { success: true };
}

export async function addTaxIncomeItem(
  taxYearId: string,
  year: number,
  data: {
    income_type: IncomeType;
    description: string;
    amount: number;
    currency?: Currency;
    source?: string;
    is_foreign?: boolean;
    country?: string;
    notes?: string;
  }
) {
  const { supabase, user } = await getAuthenticatedUser();

  const { error } = await supabase.from("tax_income_items").insert({
    user_id: user.id,
    tax_year_id: taxYearId,
    ...data,
    currency: data.currency ?? "USD",
    is_foreign: data.is_foreign ?? false,
  });

  if (error) return { error: error.message };
  revalidatePath(`/tax/${year}`);
  return { success: true };
}

export async function deleteTaxIncomeItem(id: string, year: number) {
  const { supabase } = await getAuthenticatedUser();
  const { error } = await supabase.from("tax_income_items").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/tax/${year}`);
  return { success: true };
}

export async function addTaxExpenseItem(
  taxYearId: string,
  year: number,
  data: {
    expense_type: ExpenseType;
    description: string;
    amount: number;
    currency?: Currency;
    property_name?: string;
    schedule_e_line?: string;
    notes?: string;
  }
) {
  const { supabase, user } = await getAuthenticatedUser();

  const { error } = await supabase.from("tax_expense_items").insert({
    user_id: user.id,
    tax_year_id: taxYearId,
    ...data,
    currency: data.currency ?? "USD",
  });

  if (error) return { error: error.message };
  revalidatePath(`/tax/${year}`);
  return { success: true };
}

export async function deleteTaxExpenseItem(id: string, year: number) {
  const { supabase } = await getAuthenticatedUser();
  const { error } = await supabase.from("tax_expense_items").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/tax/${year}`);
  return { success: true };
}

export async function addTaxDeduction(
  taxYearId: string,
  year: number,
  data: {
    deduction_type: DeductionType;
    description: string;
    amount: number;
    currency?: Currency;
    investment_name?: string;
    notes?: string;
  }
) {
  const { supabase, user } = await getAuthenticatedUser();

  const { error } = await supabase.from("tax_deductions").insert({
    user_id: user.id,
    tax_year_id: taxYearId,
    ...data,
    currency: data.currency ?? "USD",
  });

  if (error) return { error: error.message };
  revalidatePath(`/tax/${year}`);
  return { success: true };
}

export async function deleteTaxDeduction(id: string, year: number) {
  const { supabase } = await getAuthenticatedUser();
  const { error } = await supabase.from("tax_deductions").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/tax/${year}`);
  return { success: true };
}

export async function addForeignAccount(
  taxYearId: string,
  year: number,
  data: {
    account_name: string;
    institution?: string;
    country?: string;
    currency?: Currency;
    account_type?: string;
    account_number?: string;
    max_value_usd?: number | null;
    year_end_value_usd?: number | null;
    year_end_value_local?: number | null;
    max_value_local?: number | null;
    interest_earned?: number;
    interest_currency?: Currency;
    notes?: string;
  }
) {
  const { supabase, user } = await getAuthenticatedUser();

  const { error } = await supabase.from("tax_foreign_accounts").insert({
    user_id: user.id,
    tax_year_id: taxYearId,
    account_name: data.account_name,
    institution: data.institution ?? "",
    country: data.country ?? "JP",
    currency: data.currency ?? "JPY",
    account_type: data.account_type ?? "bank",
    account_number: data.account_number ?? null,
    max_value_usd: data.max_value_usd ?? null,
    year_end_value_usd: data.year_end_value_usd ?? null,
    year_end_value_local: data.year_end_value_local ?? null,
    max_value_local: data.max_value_local ?? null,
    interest_earned: data.interest_earned ?? 0,
    interest_currency: data.interest_currency ?? "JPY",
    notes: data.notes ?? null,
  });

  if (error) return { error: error.message };
  revalidatePath(`/tax/${year}`);
  return { success: true };
}

export async function deleteForeignAccount(id: string, year: number) {
  const { supabase } = await getAuthenticatedUser();
  const { error } = await supabase.from("tax_foreign_accounts").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/tax/${year}`);
  return { success: true };
}

export async function addFbarItem(
  taxYearId: string,
  year: number,
  data: {
    account_name: string;
    institution_name?: string;
    country?: string;
    account_number?: string;
    max_value_usd?: number | null;
    year_end_value_usd?: number | null;
    account_type?: string;
    jointly_owned?: boolean;
    foreign_account_id?: string;
    notes?: string;
  }
) {
  const { supabase, user } = await getAuthenticatedUser();

  const { error } = await supabase.from("tax_fbar_items").insert({
    user_id: user.id,
    tax_year_id: taxYearId,
    account_name: data.account_name,
    institution_name: data.institution_name ?? "",
    country: data.country ?? "JP",
    account_number: data.account_number ?? null,
    max_value_usd: data.max_value_usd ?? null,
    year_end_value_usd: data.year_end_value_usd ?? null,
    account_type: data.account_type ?? "bank",
    jointly_owned: data.jointly_owned ?? false,
    foreign_account_id: data.foreign_account_id ?? null,
    notes: data.notes ?? null,
  });

  if (error) return { error: error.message };
  revalidatePath(`/tax/${year}`);
  return { success: true };
}

export async function deleteFbarItem(id: string, year: number) {
  const { supabase } = await getAuthenticatedUser();
  const { error } = await supabase.from("tax_fbar_items").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/tax/${year}`);
  return { success: true };
}

export async function addForm8938Item(
  taxYearId: string,
  year: number,
  data: {
    asset_description: string;
    institution?: string;
    country?: string;
    account_number?: string;
    max_value_during_year?: number | null;
    year_end_value?: number | null;
    asset_type?: string;
    currency?: Currency;
    foreign_account_id?: string;
    notes?: string;
  }
) {
  const { supabase, user } = await getAuthenticatedUser();

  const { error } = await supabase.from("tax_form_8938_items").insert({
    user_id: user.id,
    tax_year_id: taxYearId,
    asset_description: data.asset_description,
    institution: data.institution ?? "",
    country: data.country ?? "JP",
    account_number: data.account_number ?? null,
    max_value_during_year: data.max_value_during_year ?? null,
    year_end_value: data.year_end_value ?? null,
    asset_type: data.asset_type ?? "deposit",
    currency: data.currency ?? "JPY",
    foreign_account_id: data.foreign_account_id ?? null,
    notes: data.notes ?? null,
  });

  if (error) return { error: error.message };
  revalidatePath(`/tax/${year}`);
  return { success: true };
}

export async function deleteForm8938Item(id: string, year: number) {
  const { supabase } = await getAuthenticatedUser();
  const { error } = await supabase.from("tax_form_8938_items").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/tax/${year}`);
  return { success: true };
}

export async function addScheduleEItem(
  taxYearId: string,
  year: number,
  data: {
    property_name: string;
    property_address?: string;
    days_rented?: number;
    days_personal_use?: number;
    gross_rents?: number;
    advertising?: number;
    auto_travel?: number;
    cleaning?: number;
    commissions?: number;
    insurance?: number;
    legal_professional?: number;
    management_fees?: number;
    mortgage_interest?: number;
    other_interest?: number;
    repairs?: number;
    supplies?: number;
    taxes?: number;
    utilities?: number;
    depreciation?: number;
    other_expenses?: number;
    currency?: Currency;
    notes?: string;
  }
) {
  const { supabase, user } = await getAuthenticatedUser();

  const { error } = await supabase.from("tax_schedule_e_items").insert({
    user_id: user.id,
    tax_year_id: taxYearId,
    property_name: data.property_name,
    property_address: data.property_address ?? "",
    days_rented: data.days_rented ?? 0,
    days_personal_use: data.days_personal_use ?? 0,
    gross_rents: data.gross_rents ?? 0,
    advertising: data.advertising ?? 0,
    auto_travel: data.auto_travel ?? 0,
    cleaning: data.cleaning ?? 0,
    commissions: data.commissions ?? 0,
    insurance: data.insurance ?? 0,
    legal_professional: data.legal_professional ?? 0,
    management_fees: data.management_fees ?? 0,
    mortgage_interest: data.mortgage_interest ?? 0,
    other_interest: data.other_interest ?? 0,
    repairs: data.repairs ?? 0,
    supplies: data.supplies ?? 0,
    taxes: data.taxes ?? 0,
    utilities: data.utilities ?? 0,
    depreciation: data.depreciation ?? 0,
    other_expenses: data.other_expenses ?? 0,
    currency: data.currency ?? "USD",
    notes: data.notes ?? null,
  });

  if (error) return { error: error.message };
  revalidatePath(`/tax/${year}`);
  return { success: true };
}

export async function deleteScheduleEItem(id: string, year: number) {
  const { supabase } = await getAuthenticatedUser();
  const { error } = await supabase.from("tax_schedule_e_items").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/tax/${year}`);
  return { success: true };
}

export async function addK1Item(
  taxYearId: string,
  year: number,
  data: {
    entity_name: string;
    entity_ein?: string;
    box_1_ordinary_income?: number;
    box_2_net_rental?: number;
    box_5_interest?: number;
    box_6a_ordinary_dividends?: number;
    box_8_net_short_term?: number;
    box_9a_net_long_term?: number;
    box_12_section_179?: number;
    box_13_other_deductions?: number;
    idc_deduction?: number;
    depletion?: number;
    currency?: Currency;
    notes?: string;
  }
) {
  const { supabase, user } = await getAuthenticatedUser();

  const { error } = await supabase.from("tax_k1_items").insert({
    user_id: user.id,
    tax_year_id: taxYearId,
    entity_name: data.entity_name,
    entity_ein: data.entity_ein ?? null,
    box_1_ordinary_income: data.box_1_ordinary_income ?? 0,
    box_2_net_rental: data.box_2_net_rental ?? 0,
    box_5_interest: data.box_5_interest ?? 0,
    box_6a_ordinary_dividends: data.box_6a_ordinary_dividends ?? 0,
    box_8_net_short_term: data.box_8_net_short_term ?? 0,
    box_9a_net_long_term: data.box_9a_net_long_term ?? 0,
    box_12_section_179: data.box_12_section_179 ?? 0,
    box_13_other_deductions: data.box_13_other_deductions ?? 0,
    idc_deduction: data.idc_deduction ?? 0,
    depletion: data.depletion ?? 0,
    currency: data.currency ?? "USD",
    notes: data.notes ?? null,
  });

  if (error) return { error: error.message };
  revalidatePath(`/tax/${year}`);
  return { success: true };
}

export async function deleteK1Item(id: string, year: number) {
  const { supabase } = await getAuthenticatedUser();
  const { error } = await supabase.from("tax_k1_items").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/tax/${year}`);
  return { success: true };
}

export async function addDepreciationItem(
  taxYearId: string,
  year: number,
  data: {
    property_name: string;
    asset_description?: string;
    date_acquired?: string;
    cost_basis?: number;
    depreciation_method?: string;
    useful_life_years?: number;
    prior_depreciation?: number;
    current_year_depreciation?: number;
    accumulated_depreciation?: number;
    remaining_basis?: number;
    currency?: Currency;
    notes?: string;
  }
) {
  const { supabase, user } = await getAuthenticatedUser();

  const { error } = await supabase.from("tax_depreciation_items").insert({
    user_id: user.id,
    tax_year_id: taxYearId,
    property_name: data.property_name,
    asset_description: data.asset_description ?? "",
    date_acquired: data.date_acquired ?? null,
    cost_basis: data.cost_basis ?? 0,
    depreciation_method: data.depreciation_method ?? "macrs",
    useful_life_years: data.useful_life_years ?? null,
    prior_depreciation: data.prior_depreciation ?? 0,
    current_year_depreciation: data.current_year_depreciation ?? 0,
    accumulated_depreciation: data.accumulated_depreciation ?? 0,
    remaining_basis: data.remaining_basis ?? 0,
    currency: data.currency ?? "USD",
    notes: data.notes ?? null,
  });

  if (error) return { error: error.message };
  revalidatePath(`/tax/${year}`);
  return { success: true };
}

export async function deleteDepreciationItem(id: string, year: number) {
  const { supabase } = await getAuthenticatedUser();
  const { error } = await supabase.from("tax_depreciation_items").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/tax/${year}`);
  return { success: true };
}

export async function addTaxDocument(
  taxYearId: string,
  year: number,
  data: {
    name: string;
    document_type: DocumentType;
    is_required?: boolean;
    notes?: string;
  }
) {
  const { supabase, user } = await getAuthenticatedUser();

  const { error } = await supabase.from("tax_documents").insert({
    user_id: user.id,
    tax_year_id: taxYearId,
    name: data.name,
    document_type: data.document_type,
    is_required: data.is_required ?? true,
    is_received: false,
    notes: data.notes ?? null,
  });

  if (error) return { error: error.message };
  revalidatePath(`/tax/${year}`);
  return { success: true };
}

export async function toggleDocumentReceived(id: string, year: number, isReceived: boolean) {
  const { supabase } = await getAuthenticatedUser();

  const { error } = await supabase
    .from("tax_documents")
    .update({ is_received: isReceived })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(`/tax/${year}`);
  return { success: true };
}

export async function uploadTaxDocument(
  taxYearId: string,
  year: number,
  documentId: string,
  formData: FormData
) {
  const { supabase, user } = await getAuthenticatedUser();
  const file = formData.get("file") as File | null;

  if (!file) return { error: "No file provided" };

  const ext = file.name.split(".").pop() ?? "pdf";
  const filePath = `${user.id}/${year}/${documentId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("tax-documents")
    .upload(filePath, file, { upsert: true });

  if (uploadError) return { error: uploadError.message };

  const { error: updateError } = await supabase
    .from("tax_documents")
    .update({
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
      is_received: true,
      uploaded_at: new Date().toISOString(),
    })
    .eq("id", documentId);

  if (updateError) return { error: updateError.message };
  revalidatePath(`/tax/${year}`);
  return { success: true };
}

export async function updateExchangeRates(
  year: number,
  usdToJpyRate: number,
  jpyToUsdRate: number
) {
  const { supabase } = await getAuthenticatedUser();

  const { error } = await supabase
    .from("tax_years")
    .update({
      usd_to_jpy_rate: usdToJpyRate,
      jpy_to_usd_rate: jpyToUsdRate,
    })
    .eq("year", year);

  if (error) return { error: error.message };
  revalidatePath(`/tax/${year}`);
  return { success: true };
}

export async function updateTaxYearSettings(
  year: number,
  data: {
    filing_status?: FilingStatus;
    status?: TaxYearStatus;
    notes?: string;
  }
) {
  const { supabase } = await getAuthenticatedUser();

  const { error } = await supabase
    .from("tax_years")
    .update(data)
    .eq("year", year);

  if (error) return { error: error.message };
  revalidatePath(`/tax/${year}`);
  return { success: true };
}
