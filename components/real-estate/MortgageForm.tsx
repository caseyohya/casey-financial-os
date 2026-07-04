"use client";

import { useState } from "react";
import { InputField, Button } from "@/components/forms/FormFields";
import { addPropertyMortgage } from "@/app/(dashboard)/real-estate/actions";
import type { PropertyCurrency } from "@/lib/types/real-estate";

interface MortgageFormProps {
  propertyId: string;
  currency: PropertyCurrency;
}

export function MortgageForm({ propertyId, currency }: MortgageFormProps) {
  const [form, setForm] = useState({
    lender: "",
    original_amount: 0,
    current_balance: 0,
    interest_rate: 0,
    monthly_payment: 0,
    start_date: "",
    term_months: 360,
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await addPropertyMortgage(propertyId, { ...form, currency });
    if (result?.error) setError(result.error);
    else setForm({ lender: "", original_amount: 0, current_balance: 0, interest_rate: 0, monthly_payment: 0, start_date: "", term_months: 360, notes: "" });
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3 border-t border-navy-700 pt-4">
      <h4 className="text-xs font-semibold uppercase text-slate-500">Add Mortgage</h4>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <InputField label="Lender" value={form.lender} onChange={(e) => setForm((f) => ({ ...f, lender: e.target.value }))} />
        <InputField label="Current Balance" type="number" min="0" value={form.current_balance || ""} onChange={(e) => setForm((f) => ({ ...f, current_balance: parseFloat(e.target.value) || 0 }))} />
        <InputField label="Interest Rate (%)" type="number" min="0" step="0.001" value={form.interest_rate || ""} onChange={(e) => setForm((f) => ({ ...f, interest_rate: parseFloat(e.target.value) || 0 }))} />
        <InputField label="Monthly Payment" type="number" min="0" value={form.monthly_payment || ""} onChange={(e) => setForm((f) => ({ ...f, monthly_payment: parseFloat(e.target.value) || 0 }))} />
      </div>
      <Button type="submit" isLoading={loading}>Add Mortgage</Button>
    </form>
  );
}
