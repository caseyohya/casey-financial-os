"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, userId: user.id };
}

function revalidateFinancialHub() {
  revalidatePath("/financial-hub");
  revalidatePath("/executive-dashboard");
}

export async function createAccount(formData: FormData) {
  const { supabase, userId } = await getUserId();
  const { error } = await supabase.from("accounts").insert({
    user_id: userId,
    name: String(formData.get("name") ?? ""),
    account_type: String(formData.get("account_type") ?? "other"),
    balance: Number(formData.get("balance") ?? 0),
    currency_code: String(formData.get("currency_code") ?? "USD"),
    country: String(formData.get("country") ?? "US"),
    institution: String(formData.get("institution") ?? "") || null,
    notes: String(formData.get("notes") ?? "") || null,
  });
  if (error) throw new Error(error.message);
  revalidateFinancialHub();
}

export async function updateAccount(id: string, formData: FormData) {
  const { supabase, userId } = await getUserId();
  const { error } = await supabase
    .from("accounts")
    .update({
      name: String(formData.get("name") ?? ""),
      account_type: String(formData.get("account_type") ?? "other"),
      balance: Number(formData.get("balance") ?? 0),
      currency_code: String(formData.get("currency_code") ?? "USD"),
      country: String(formData.get("country") ?? "US"),
      institution: String(formData.get("institution") ?? "") || null,
      notes: String(formData.get("notes") ?? "") || null,
    })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  revalidateFinancialHub();
}

export async function deleteAccount(id: string) {
  const { supabase, userId } = await getUserId();
  const { error } = await supabase.from("accounts").delete().eq("id", id).eq("user_id", userId);
  if (error) throw new Error(error.message);
  revalidateFinancialHub();
}

export async function createAsset(formData: FormData) {
  const { supabase, userId } = await getUserId();
  const { error } = await supabase.from("assets").insert({
    user_id: userId,
    name: String(formData.get("name") ?? ""),
    asset_type: String(formData.get("asset_type") ?? "other"),
    current_value: Number(formData.get("current_value") ?? 0),
    currency_code: String(formData.get("currency_code") ?? "USD"),
    country: String(formData.get("country") ?? "US"),
    category: String(formData.get("category") ?? "") || null,
    notes: String(formData.get("notes") ?? "") || null,
  });
  if (error) throw new Error(error.message);
  revalidateFinancialHub();
}

export async function updateAsset(id: string, formData: FormData) {
  const { supabase, userId } = await getUserId();
  const { error } = await supabase
    .from("assets")
    .update({
      name: String(formData.get("name") ?? ""),
      asset_type: String(formData.get("asset_type") ?? "other"),
      current_value: Number(formData.get("current_value") ?? 0),
      currency_code: String(formData.get("currency_code") ?? "USD"),
      country: String(formData.get("country") ?? "US"),
      category: String(formData.get("category") ?? "") || null,
      notes: String(formData.get("notes") ?? "") || null,
    })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  revalidateFinancialHub();
}

export async function deleteAsset(id: string) {
  const { supabase, userId } = await getUserId();
  const { error } = await supabase.from("assets").delete().eq("id", id).eq("user_id", userId);
  if (error) throw new Error(error.message);
  revalidateFinancialHub();
}

export async function createLiability(formData: FormData) {
  const { supabase, userId } = await getUserId();
  const { error } = await supabase.from("liabilities").insert({
    user_id: userId,
    name: String(formData.get("name") ?? ""),
    liability_type: String(formData.get("liability_type") ?? "other"),
    current_balance: Number(formData.get("current_balance") ?? 0),
    currency_code: String(formData.get("currency_code") ?? "USD"),
    country: String(formData.get("country") ?? "US"),
    interest_rate: formData.get("interest_rate") ? Number(formData.get("interest_rate")) : null,
    notes: String(formData.get("notes") ?? "") || null,
  });
  if (error) throw new Error(error.message);
  revalidateFinancialHub();
}

export async function updateLiability(id: string, formData: FormData) {
  const { supabase, userId } = await getUserId();
  const { error } = await supabase
    .from("liabilities")
    .update({
      name: String(formData.get("name") ?? ""),
      liability_type: String(formData.get("liability_type") ?? "other"),
      current_balance: Number(formData.get("current_balance") ?? 0),
      currency_code: String(formData.get("currency_code") ?? "USD"),
      country: String(formData.get("country") ?? "US"),
      interest_rate: formData.get("interest_rate") ? Number(formData.get("interest_rate")) : null,
      notes: String(formData.get("notes") ?? "") || null,
    })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  revalidateFinancialHub();
}

export async function deleteLiability(id: string) {
  const { supabase, userId } = await getUserId();
  const { error } = await supabase.from("liabilities").delete().eq("id", id).eq("user_id", userId);
  if (error) throw new Error(error.message);
  revalidateFinancialHub();
}

export async function createIncomeSource(formData: FormData) {
  const { supabase, userId } = await getUserId();
  const { error } = await supabase.from("income_sources").insert({
    user_id: userId,
    name: String(formData.get("name") ?? ""),
    income_type: String(formData.get("income_type") ?? "salary"),
    amount: Number(formData.get("amount") ?? 0),
    frequency: String(formData.get("frequency") ?? "monthly"),
    currency_code: String(formData.get("currency_code") ?? "USD"),
    country: String(formData.get("country") ?? "US"),
    is_passive: formData.get("is_passive") === "on",
    category: String(formData.get("category") ?? "") || null,
    notes: String(formData.get("notes") ?? "") || null,
  });
  if (error) throw new Error(error.message);
  revalidateFinancialHub();
}

export async function updateIncomeSource(id: string, formData: FormData) {
  const { supabase, userId } = await getUserId();
  const { error } = await supabase
    .from("income_sources")
    .update({
      name: String(formData.get("name") ?? ""),
      income_type: String(formData.get("income_type") ?? "salary"),
      amount: Number(formData.get("amount") ?? 0),
      frequency: String(formData.get("frequency") ?? "monthly"),
      currency_code: String(formData.get("currency_code") ?? "USD"),
      country: String(formData.get("country") ?? "US"),
      is_passive: formData.get("is_passive") === "on",
      category: String(formData.get("category") ?? "") || null,
      notes: String(formData.get("notes") ?? "") || null,
    })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  revalidateFinancialHub();
}

export async function deleteIncomeSource(id: string) {
  const { supabase, userId } = await getUserId();
  const { error } = await supabase.from("income_sources").delete().eq("id", id).eq("user_id", userId);
  if (error) throw new Error(error.message);
  revalidateFinancialHub();
}

export async function createExpense(formData: FormData) {
  const { supabase, userId } = await getUserId();
  const { error } = await supabase.from("expenses").insert({
    user_id: userId,
    name: String(formData.get("name") ?? ""),
    expense_type: String(formData.get("expense_type") ?? "living"),
    amount: Number(formData.get("amount") ?? 0),
    frequency: String(formData.get("frequency") ?? "monthly"),
    currency_code: String(formData.get("currency_code") ?? "USD"),
    country: String(formData.get("country") ?? "US"),
    is_fixed: formData.get("is_fixed") === "on",
    category: String(formData.get("category") ?? "") || null,
    notes: String(formData.get("notes") ?? "") || null,
  });
  if (error) throw new Error(error.message);
  revalidateFinancialHub();
}

export async function updateExpense(id: string, formData: FormData) {
  const { supabase, userId } = await getUserId();
  const { error } = await supabase
    .from("expenses")
    .update({
      name: String(formData.get("name") ?? ""),
      expense_type: String(formData.get("expense_type") ?? "living"),
      amount: Number(formData.get("amount") ?? 0),
      frequency: String(formData.get("frequency") ?? "monthly"),
      currency_code: String(formData.get("currency_code") ?? "USD"),
      country: String(formData.get("country") ?? "US"),
      is_fixed: formData.get("is_fixed") === "on",
      category: String(formData.get("category") ?? "") || null,
      notes: String(formData.get("notes") ?? "") || null,
    })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  revalidateFinancialHub();
}

export async function deleteExpense(id: string) {
  const { supabase, userId } = await getUserId();
  const { error } = await supabase.from("expenses").delete().eq("id", id).eq("user_id", userId);
  if (error) throw new Error(error.message);
  revalidateFinancialHub();
}
