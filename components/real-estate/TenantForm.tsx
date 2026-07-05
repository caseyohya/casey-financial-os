"use client";

import { useState } from "react";
import { InputField, SelectField, Button } from "@/components/forms/FormFields";
import { addPropertyTenant } from "@/app/(dashboard)/real-estate/actions";
import type { PropertyCurrency } from "@/lib/types/real-estate";

interface TenantFormProps {
  propertyId: string;
  currency: PropertyCurrency;
}

export function TenantForm({ propertyId, currency }: TenantFormProps) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    lease_start: "",
    lease_end: "",
    monthly_rent: 0,
    deposit: 0,
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await addPropertyTenant(propertyId, { ...form, currency });
    if (result?.error) setError(result.error);
    else setForm({ name: "", email: "", phone: "", lease_start: "", lease_end: "", monthly_rent: 0, deposit: 0, notes: "" });
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <InputField label="Tenant Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
        <InputField label="Monthly Rent" type="number" min="0" value={form.monthly_rent || ""} onChange={(e) => setForm((f) => ({ ...f, monthly_rent: parseFloat(e.target.value) || 0 }))} />
        <InputField label="Lease Start" type="date" value={form.lease_start} onChange={(e) => setForm((f) => ({ ...f, lease_start: e.target.value }))} required />
        <InputField label="Lease End" type="date" value={form.lease_end} onChange={(e) => setForm((f) => ({ ...f, lease_end: e.target.value }))} />
        <InputField label="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        <InputField label="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
      </div>
      <Button type="submit" isLoading={loading}>Add Tenant</Button>
    </form>
  );
}
