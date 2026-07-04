"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { propertyFormToRow } from "@/lib/data/real-estate";
import { buildMonthlySummary } from "@/lib/calculations/real-estate";
import type {
  ExpenseCategory,
  IncomeType,
  PropertyFormData,
  DocumentType,
} from "@/lib/types/real-estate";

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");
  return { supabase, user };
}

export async function createProperty(data: PropertyFormData) {
  const { supabase, user } = await getAuthenticatedUser();
  const row = propertyFormToRow(data, user.id);

  const { data: property, error } = await supabase
    .from("properties")
    .insert(row)
    .select()
    .single();

  if (error) return { error: error.message };

  await supabase.from("property_owners").insert({
    property_id: property.id,
    user_id: user.id,
    owner_name: user.email ?? "Owner",
    ownership_percent: 100,
    is_primary: true,
  });

  revalidatePath("/real-estate");
  redirect(`/real-estate/${property.id}`);
}

export async function updateProperty(id: string, data: PropertyFormData) {
  const { supabase, user } = await getAuthenticatedUser();
  const { user_id: _userId, ...row } = propertyFormToRow(data, user.id);

  const { error } = await supabase.from("properties").update(row).eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/real-estate");
  revalidatePath(`/real-estate/${id}`);
  redirect(`/real-estate/${id}`);
}

export async function deleteProperty(id: string) {
  const { supabase } = await getAuthenticatedUser();

  const { error } = await supabase.from("properties").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/real-estate");
  redirect("/real-estate");
}

export async function addPropertyIncome(
  propertyId: string,
  data: {
    income_date: string;
    amount: number;
    currency: string;
    income_type: IncomeType;
    is_vacancy_period?: boolean;
    notes?: string;
  }
) {
  const { supabase } = await getAuthenticatedUser();

  const { error } = await supabase.from("property_income").insert({
    property_id: propertyId,
    ...data,
    is_vacancy_period: data.is_vacancy_period ?? false,
  });

  if (error) return { error: error.message };
  revalidatePath(`/real-estate/${propertyId}`);
  return { success: true };
}

export async function addPropertyExpense(
  propertyId: string,
  data: {
    expense_date: string;
    amount: number;
    currency: string;
    category: ExpenseCategory;
    description?: string;
    notes?: string;
  }
) {
  const { supabase } = await getAuthenticatedUser();

  const { error } = await supabase.from("property_expenses").insert({
    property_id: propertyId,
    ...data,
  });

  if (error) return { error: error.message };
  revalidatePath(`/real-estate/${propertyId}`);
  return { success: true };
}

export async function addPropertyTenant(
  propertyId: string,
  data: {
    name: string;
    email?: string;
    phone?: string;
    lease_start: string;
    lease_end?: string;
    monthly_rent: number;
    deposit?: number;
    currency: string;
    status?: string;
    notes?: string;
  }
) {
  const { supabase } = await getAuthenticatedUser();

  const { error } = await supabase.from("property_tenants").insert({
    property_id: propertyId,
    ...data,
    status: data.status ?? "active",
  });

  if (error) return { error: error.message };
  revalidatePath(`/real-estate/${propertyId}`);
  return { success: true };
}

export async function addPropertyMortgage(
  propertyId: string,
  data: {
    lender: string;
    original_amount: number;
    current_balance: number;
    interest_rate: number;
    monthly_payment: number;
    start_date?: string;
    term_months?: number;
    currency: string;
    notes?: string;
  }
) {
  const { supabase } = await getAuthenticatedUser();

  const { error } = await supabase.from("property_mortgages").insert({
    property_id: propertyId,
    ...data,
    term_months: data.term_months ?? 360,
  });

  if (error) return { error: error.message };
  revalidatePath(`/real-estate/${propertyId}`);
  return { success: true };
}

export async function generateMonthlySummary(propertyId: string, year: number, month: number) {
  const { supabase } = await getAuthenticatedUser();

  const { data: property } = await supabase
    .from("properties")
    .select("*")
    .eq("id", propertyId)
    .single();

  if (!property) return { error: "Property not found" };

  const [{ data: income }, { data: expenses }] = await Promise.all([
    supabase.from("property_income").select("*").eq("property_id", propertyId),
    supabase.from("property_expenses").select("*").eq("property_id", propertyId),
  ]);

  const summary = buildMonthlySummary(
    propertyId,
    year,
    month,
    property,
    income ?? [],
    expenses ?? [],
    property.currency
  );

  const { error } = await supabase.from("property_monthly_summary").upsert(summary, {
    onConflict: "property_id,year,month",
  });

  if (error) return { error: error.message };
  revalidatePath(`/real-estate/${propertyId}`);
  return { success: true };
}

export async function uploadPropertyDocument(
  propertyId: string,
  formData: FormData
) {
  const { supabase, user } = await getAuthenticatedUser();

  const file = formData.get("file") as File;
  const documentType = formData.get("document_type") as DocumentType;
  const name = formData.get("name") as string;

  if (!file || !documentType) return { error: "File and document type required" };

  const filePath = `${user.id}/${propertyId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("property-documents")
    .upload(filePath, file);

  if (uploadError) return { error: uploadError.message };

  const { error: dbError } = await supabase.from("property_documents").insert({
    property_id: propertyId,
    user_id: user.id,
    name: name || file.name,
    document_type: documentType,
    file_path: filePath,
    file_size: file.size,
    mime_type: file.type,
  });

  if (dbError) return { error: dbError.message };
  revalidatePath(`/real-estate/${propertyId}`);
  return { success: true };
}

export async function deletePropertyDocument(documentId: string, propertyId: string, filePath: string) {
  const { supabase } = await getAuthenticatedUser();

  await supabase.storage.from("property-documents").remove([filePath]);
  const { error } = await supabase.from("property_documents").delete().eq("id", documentId);

  if (error) return { error: error.message };
  revalidatePath(`/real-estate/${propertyId}`);
  return { success: true };
}

export async function deletePropertyIncome(incomeId: string, propertyId: string) {
  const { supabase } = await getAuthenticatedUser();
  const { error } = await supabase.from("property_income").delete().eq("id", incomeId);
  if (error) return { error: error.message };
  revalidatePath(`/real-estate/${propertyId}`);
  return { success: true };
}

export async function deletePropertyExpense(expenseId: string, propertyId: string) {
  const { supabase } = await getAuthenticatedUser();
  const { error } = await supabase.from("property_expenses").delete().eq("id", expenseId);
  if (error) return { error: error.message };
  revalidatePath(`/real-estate/${propertyId}`);
  return { success: true };
}
