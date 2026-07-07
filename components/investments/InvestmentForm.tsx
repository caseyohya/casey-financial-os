"use client";

import { useState } from "react";
import { InputField, SelectField, TextareaField, Button } from "@/components/forms/FormFields";
import { createInvestment, updateInvestment } from "@/app/(dashboard)/investments/actions";
import type { Investment, InvestmentFormData, InvestmentEntity, InvestmentCategory } from "@/lib/types/investments";
import { CATEGORY_LABELS } from "@/lib/types/investments";

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }));

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD" },
  { value: "JPY", label: "JPY" },
];

const COUNTRY_OPTIONS = [
  { value: "US", label: "United States" },
  { value: "JP", label: "Japan" },
  { value: "OTHER", label: "Other" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "exited", label: "Exited" },
  { value: "written_off", label: "Written Off" },
  { value: "pending", label: "Pending" },
];

function investmentToForm(inv: Investment): InvestmentFormData {
  return {
    name: inv.name,
    entity_id: inv.entity_id ?? undefined,
    category: inv.category,
    purchase_date: inv.purchase_date ?? undefined,
    invested_capital: inv.invested_capital,
    current_value: inv.current_value,
    ownership_percent: inv.ownership_percent,
    currency: inv.currency,
    country: inv.country,
    status: inv.status,
    tax_basis: inv.tax_basis,
    remaining_basis: inv.remaining_basis,
    idc_deduction_total: inv.idc_deduction_total,
    notes: inv.notes ?? undefined,
  };
}

const defaultForm: InvestmentFormData = {
  name: "",
  category: "other_private",
  invested_capital: 0,
  current_value: 0,
  ownership_percent: 100,
  currency: "USD",
  country: "US",
  status: "active",
  tax_basis: 0,
  remaining_basis: 0,
  idc_deduction_total: 0,
};

interface InvestmentFormProps {
  investment?: Investment;
  entities?: InvestmentEntity[];
  mode: "create" | "edit";
}

export function InvestmentForm({ investment, entities = [], mode }: InvestmentFormProps) {
  const [form, setForm] = useState<InvestmentFormData>(
    investment ? investmentToForm(investment) : defaultForm
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof InvestmentFormData>(key: K, value: InvestmentFormData[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "invested_capital" && prev.tax_basis === 0) {
        next.tax_basis = value as number;
        next.remaining_basis = value as number;
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = mode === "create"
      ? await createInvestment(form)
      : await updateInvestment(investment!.id, form);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  const entityOptions = [
    { value: "", label: "No entity" },
    ...entities.map((e) => ({ value: e.id, label: e.name })),
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <InputField label="Investment Name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
        <SelectField label="Category" options={CATEGORY_OPTIONS} value={form.category} onChange={(e) => set("category", e.target.value as InvestmentCategory)} />
        <SelectField label="Entity" options={entityOptions} value={form.entity_id ?? ""} onChange={(e) => set("entity_id", e.target.value || undefined)} />
        <SelectField label="Status" options={STATUS_OPTIONS} value={form.status} onChange={(e) => set("status", e.target.value as InvestmentFormData["status"])} />
        <SelectField label="Currency" options={CURRENCY_OPTIONS} value={form.currency} onChange={(e) => set("currency", e.target.value as InvestmentFormData["currency"])} />
        <SelectField label="Country" options={COUNTRY_OPTIONS} value={form.country} onChange={(e) => set("country", e.target.value as InvestmentFormData["country"])} />
      </div>

      <div className="rounded-xl border border-navy-700 bg-navy-900/50 p-4">
        <h3 className="mb-4 text-sm font-semibold text-white">Capital & Valuation</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InputField label="Purchase Date" type="date" value={form.purchase_date ?? ""} onChange={(e) => set("purchase_date", e.target.value)} />
          <InputField label="Invested Capital" type="number" min="0" step="0.01" value={form.invested_capital} onChange={(e) => set("invested_capital", parseFloat(e.target.value) || 0)} />
          <InputField label="Current Value" type="number" min="0" step="0.01" value={form.current_value} onChange={(e) => set("current_value", parseFloat(e.target.value) || 0)} />
          <InputField label="Ownership %" type="number" min="0" max="100" step="0.01" value={form.ownership_percent} onChange={(e) => set("ownership_percent", parseFloat(e.target.value) || 0)} />
        </div>
      </div>

      <div className="rounded-xl border border-navy-700 bg-navy-900/50 p-4">
        <h3 className="mb-4 text-sm font-semibold text-white">Tax Basis</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InputField label="Tax Basis" type="number" min="0" step="0.01" value={form.tax_basis} onChange={(e) => set("tax_basis", parseFloat(e.target.value) || 0)} />
          <InputField label="Remaining Basis" type="number" min="0" step="0.01" value={form.remaining_basis} onChange={(e) => set("remaining_basis", parseFloat(e.target.value) || 0)} />
          {form.category === "oil_gas" && (
            <InputField label="IDC Deduction Total" type="number" min="0" step="0.01" value={form.idc_deduction_total} onChange={(e) => set("idc_deduction_total", parseFloat(e.target.value) || 0)} />
          )}
        </div>
      </div>

      <TextareaField label="Notes" value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />

      <Button type="submit" isLoading={loading}>
        {mode === "create" ? "Add Investment" : "Save Changes"}
      </Button>
    </form>
  );
}
