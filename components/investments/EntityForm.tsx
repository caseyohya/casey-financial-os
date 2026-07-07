"use client";

import { useState } from "react";
import { InputField, SelectField, Button } from "@/components/forms/FormFields";
import { createInvestmentEntity } from "@/app/(dashboard)/investments/actions";

const ENTITY_TYPES = [
  { value: "llc", label: "LLC" },
  { value: "lp", label: "LP" },
  { value: "fund", label: "Fund" },
  { value: "spv", label: "SPV" },
  { value: "corporation", label: "Corporation" },
  { value: "trust", label: "Trust" },
  { value: "other", label: "Other" },
];

const COUNTRY_OPTIONS = [
  { value: "US", label: "United States" },
  { value: "JP", label: "Japan" },
  { value: "OTHER", label: "Other" },
];

export function EntityForm() {
  const [form, setForm] = useState({ name: "", entity_type: "llc", ein: "", country: "US" });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    const result = await createInvestmentEntity({
      name: form.name,
      entity_type: form.entity_type,
      ein: form.ein || undefined,
      country: form.country,
    });
    if (result?.error) setError(result.error);
    else {
      setSuccess(true);
      setForm({ name: "", entity_type: "llc", ein: "", country: "US" });
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-navy-700 bg-navy-800/50 p-4">
      <h4 className="text-sm font-semibold text-white">Create Investment Entity</h4>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {success && <p className="text-xs text-emerald-400">Entity created. Refresh to select it in the form below.</p>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <InputField label="Entity Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
        <SelectField label="Type" options={ENTITY_TYPES} value={form.entity_type} onChange={(e) => setForm((f) => ({ ...f, entity_type: e.target.value }))} />
        <InputField label="EIN (optional)" value={form.ein} onChange={(e) => setForm((f) => ({ ...f, ein: e.target.value }))} />
        <SelectField label="Country" options={COUNTRY_OPTIONS} value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} />
      </div>
      <Button type="submit" isLoading={loading}>Create Entity</Button>
    </form>
  );
}
