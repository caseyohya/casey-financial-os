"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { investmentFormToRow } from "@/lib/data/investments";
import type {
  InvestmentFormData,
  TransactionType,
  DistributionType,
  TaxItemType,
  DocumentType,
  MetalType,
  CapitalCallStatus,
} from "@/lib/types/investments";

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");
  return { supabase, user };
}

export async function createInvestment(data: InvestmentFormData) {
  const { supabase, user } = await getAuthenticatedUser();
  const row = investmentFormToRow(data, user.id);

  const { data: investment, error } = await supabase
    .from("investments")
    .insert(row)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/investments");
  redirect(`/investments/${investment.id}`);
}

export async function updateInvestment(id: string, data: InvestmentFormData) {
  const { supabase, user } = await getAuthenticatedUser();
  const { user_id: _userId, ...row } = investmentFormToRow(data, user.id);

  const { error } = await supabase.from("investments").update(row).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/investments");
  revalidatePath(`/investments/${id}`);
  redirect(`/investments/${id}`);
}

export async function deleteInvestment(id: string) {
  const { supabase } = await getAuthenticatedUser();
  const { error } = await supabase.from("investments").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/investments");
  redirect("/investments");
}

export async function addInvestmentTransaction(
  investmentId: string,
  data: {
    transaction_date: string;
    transaction_type: TransactionType;
    amount: number;
    currency: string;
    description?: string;
    notes?: string;
  }
) {
  const { supabase } = await getAuthenticatedUser();
  const { error } = await supabase.from("investment_transactions").insert({
    investment_id: investmentId,
    ...data,
  });
  if (error) return { error: error.message };
  revalidatePath(`/investments/${investmentId}`);
  return { success: true };
}

export async function addDistribution(
  investmentId: string,
  data: {
    distribution_date: string;
    amount: number;
    currency: string;
    distribution_type: DistributionType;
    tax_year?: number;
    notes?: string;
  }
) {
  const { supabase } = await getAuthenticatedUser();
  const { error } = await supabase.from("investment_distributions").insert({
    investment_id: investmentId,
    ...data,
  });
  if (error) return { error: error.message };
  revalidatePath(`/investments/${investmentId}`);
  return { success: true };
}

export async function addCapitalCall(
  investmentId: string,
  data: {
    call_date: string;
    amount: number;
    currency: string;
    due_date?: string;
    status?: CapitalCallStatus;
    notes?: string;
  }
) {
  const { supabase } = await getAuthenticatedUser();
  const { error } = await supabase.from("investment_capital_calls").insert({
    investment_id: investmentId,
    ...data,
    status: data.status ?? "pending",
  });
  if (error) return { error: error.message };
  revalidatePath(`/investments/${investmentId}`);
  return { success: true };
}

export async function addTaxItem(
  investmentId: string,
  data: {
    tax_year: number;
    item_type: TaxItemType;
    amount: number;
    k1_line?: string;
    description?: string;
    notes?: string;
  }
) {
  const { supabase } = await getAuthenticatedUser();
  const { error } = await supabase.from("investment_tax_items").insert({
    investment_id: investmentId,
    ...data,
  });
  if (error) return { error: error.message };
  revalidatePath(`/investments/${investmentId}`);
  return { success: true };
}

export async function addPreciousMetal(
  investmentId: string,
  data: {
    metal_type: MetalType;
    quantity: number;
    unit: string;
    unit_cost: number;
    spot_value: number;
    storage_location?: string;
    currency: string;
    purchase_date?: string;
    notes?: string;
  }
) {
  const { supabase, user } = await getAuthenticatedUser();
  const { error } = await supabase.from("precious_metals").insert({
    user_id: user.id,
    investment_id: investmentId,
    ...data,
  });
  if (error) return { error: error.message };
  revalidatePath(`/investments/${investmentId}`);
  return { success: true };
}

export async function uploadInvestmentDocument(investmentId: string, formData: FormData) {
  const { supabase, user } = await getAuthenticatedUser();

  const file = formData.get("file") as File;
  const documentType = formData.get("document_type") as DocumentType;
  const name = formData.get("name") as string;
  const taxYear = formData.get("tax_year") as string;

  if (!file || !documentType) return { error: "File and document type required" };

  const filePath = `${user.id}/${investmentId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("investment-documents")
    .upload(filePath, file);

  if (uploadError) return { error: uploadError.message };

  const { error: dbError } = await supabase.from("investment_documents").insert({
    investment_id: investmentId,
    user_id: user.id,
    name: name || file.name,
    document_type: documentType,
    file_path: filePath,
    file_size: file.size,
    mime_type: file.type,
    tax_year: taxYear ? parseInt(taxYear, 10) : null,
  });

  if (dbError) return { error: dbError.message };
  revalidatePath(`/investments/${investmentId}`);
  return { success: true };
}

export async function createInvestmentEntity(data: {
  name: string;
  entity_type: string;
  ein?: string;
  country: string;
  notes?: string;
}) {
  const { supabase, user } = await getAuthenticatedUser();
  const { data: entity, error } = await supabase
    .from("investment_entities")
    .insert({ user_id: user.id, ...data })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath("/investments");
  return { success: true, entity };
}
