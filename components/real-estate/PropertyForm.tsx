"use client";

import { useState } from "react";
import { InputField, SelectField, TextareaField, Button } from "@/components/forms/FormFields";
import { createProperty, updateProperty } from "@/app/(dashboard)/real-estate/actions";
import type { Property, PropertyFormData } from "@/lib/types/real-estate";

const COUNTRY_OPTIONS = [
  { value: "US", label: "United States" },
  { value: "JP", label: "Japan" },
];

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD — U.S. Dollar" },
  { value: "JPY", label: "JPY — Japanese Yen" },
];

const TYPE_OPTIONS = [
  { value: "rental", label: "Rental" },
  { value: "primary", label: "Primary Residence" },
  { value: "commercial", label: "Commercial" },
  { value: "land", label: "Land" },
  { value: "other", label: "Other" },
];

function propertyToFormData(property: Property): PropertyFormData {
  return {
    name: property.name,
    address_line1: property.address_line1,
    address_line2: property.address_line2 ?? undefined,
    city: property.city,
    state_province: property.state_province ?? undefined,
    postal_code: property.postal_code ?? undefined,
    country: property.country,
    currency: property.currency,
    property_type: property.property_type,
    purchase_price: property.purchase_price,
    purchase_date: property.purchase_date ?? undefined,
    current_value: property.current_value,
    land_value: property.land_value,
    building_value: property.building_value,
    loan_balance: property.loan_balance,
    interest_rate: property.interest_rate ?? undefined,
    monthly_rent: property.monthly_rent,
    hoa_monthly: property.hoa_monthly,
    taxes_annual: property.taxes_annual,
    insurance_annual: property.insurance_annual,
    maintenance_monthly: property.maintenance_monthly,
    vacancy_rate_percent: property.vacancy_rate_percent,
    notes: property.notes ?? undefined,
  };
}

const defaultForm: PropertyFormData = {
  name: "",
  address_line1: "",
  city: "",
  country: "US",
  currency: "USD",
  property_type: "rental",
  purchase_price: 0,
  current_value: 0,
  land_value: 0,
  building_value: 0,
  loan_balance: 0,
  monthly_rent: 0,
  hoa_monthly: 0,
  taxes_annual: 0,
  insurance_annual: 0,
  maintenance_monthly: 0,
  vacancy_rate_percent: 5,
};

interface PropertyFormProps {
  property?: Property;
  mode: "create" | "edit";
}

export function PropertyForm({ property, mode }: PropertyFormProps) {
  const [form, setForm] = useState<PropertyFormData>(
    property ? propertyToFormData(property) : defaultForm
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function updateField<K extends keyof PropertyFormData>(key: K, value: PropertyFormData[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "country") {
        next.currency = value === "JP" ? "JPY" : "USD";
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const action = mode === "create"
      ? () => createProperty(form)
      : () => updateProperty(property!.id, form);

    const result = await action();
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          label="Property Name"
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          required
        />
        <SelectField
          label="Property Type"
          options={TYPE_OPTIONS}
          value={form.property_type}
          onChange={(e) => updateField("property_type", e.target.value as PropertyFormData["property_type"])}
        />
        <SelectField
          label="Country"
          options={COUNTRY_OPTIONS}
          value={form.country}
          onChange={(e) => updateField("country", e.target.value as PropertyFormData["country"])}
        />
        <SelectField
          label="Currency"
          options={CURRENCY_OPTIONS}
          value={form.currency}
          onChange={(e) => updateField("currency", e.target.value as PropertyFormData["currency"])}
        />
      </div>

      <div className="rounded-xl border border-navy-700 bg-navy-900/50 p-4">
        <h3 className="mb-4 text-sm font-semibold text-white">Address</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <InputField
              label="Address Line 1"
              value={form.address_line1}
              onChange={(e) => updateField("address_line1", e.target.value)}
              required
            />
          </div>
          <InputField
            label="Address Line 2"
            value={form.address_line2 ?? ""}
            onChange={(e) => updateField("address_line2", e.target.value)}
          />
          <InputField
            label="City"
            value={form.city}
            onChange={(e) => updateField("city", e.target.value)}
            required
          />
          <InputField
            label={form.country === "JP" ? "Prefecture" : "State"}
            value={form.state_province ?? ""}
            onChange={(e) => updateField("state_province", e.target.value)}
          />
          <InputField
            label={form.country === "JP" ? "Postal Code" : "ZIP Code"}
            value={form.postal_code ?? ""}
            onChange={(e) => updateField("postal_code", e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border border-navy-700 bg-navy-900/50 p-4">
        <h3 className="mb-4 text-sm font-semibold text-white">Purchase & Valuation</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InputField
            label="Purchase Price"
            type="number"
            min="0"
            step="0.01"
            value={form.purchase_price}
            onChange={(e) => updateField("purchase_price", parseFloat(e.target.value) || 0)}
          />
          <InputField
            label="Purchase Date"
            type="date"
            value={form.purchase_date ?? ""}
            onChange={(e) => updateField("purchase_date", e.target.value)}
          />
          <InputField
            label="Current Value"
            type="number"
            min="0"
            step="0.01"
            value={form.current_value}
            onChange={(e) => updateField("current_value", parseFloat(e.target.value) || 0)}
          />
          <InputField
            label="Land Value"
            type="number"
            min="0"
            step="0.01"
            value={form.land_value}
            onChange={(e) => updateField("land_value", parseFloat(e.target.value) || 0)}
          />
          <InputField
            label="Building Value"
            type="number"
            min="0"
            step="0.01"
            value={form.building_value}
            onChange={(e) => updateField("building_value", parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="rounded-xl border border-navy-700 bg-navy-900/50 p-4">
        <h3 className="mb-4 text-sm font-semibold text-white">Mortgage & Income</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InputField
            label="Loan Balance"
            type="number"
            min="0"
            step="0.01"
            value={form.loan_balance}
            onChange={(e) => updateField("loan_balance", parseFloat(e.target.value) || 0)}
          />
          <InputField
            label="Interest Rate (%)"
            type="number"
            min="0"
            step="0.001"
            value={form.interest_rate ?? ""}
            onChange={(e) => updateField("interest_rate", parseFloat(e.target.value) || undefined)}
          />
          <InputField
            label="Monthly Rent"
            type="number"
            min="0"
            step="0.01"
            value={form.monthly_rent}
            onChange={(e) => updateField("monthly_rent", parseFloat(e.target.value) || 0)}
          />
          <InputField
            label="Vacancy Rate (%)"
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={form.vacancy_rate_percent}
            onChange={(e) => updateField("vacancy_rate_percent", parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="rounded-xl border border-navy-700 bg-navy-900/50 p-4">
        <h3 className="mb-4 text-sm font-semibold text-white">Monthly & Annual Expenses</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <InputField
            label="HOA (Monthly)"
            type="number"
            min="0"
            step="0.01"
            value={form.hoa_monthly}
            onChange={(e) => updateField("hoa_monthly", parseFloat(e.target.value) || 0)}
          />
          <InputField
            label="Property Taxes (Annual)"
            type="number"
            min="0"
            step="0.01"
            value={form.taxes_annual}
            onChange={(e) => updateField("taxes_annual", parseFloat(e.target.value) || 0)}
          />
          <InputField
            label="Insurance (Annual)"
            type="number"
            min="0"
            step="0.01"
            value={form.insurance_annual}
            onChange={(e) => updateField("insurance_annual", parseFloat(e.target.value) || 0)}
          />
          <InputField
            label="Maintenance (Monthly)"
            type="number"
            min="0"
            step="0.01"
            value={form.maintenance_monthly}
            onChange={(e) => updateField("maintenance_monthly", parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      <TextareaField
        label="Notes"
        value={form.notes ?? ""}
        onChange={(e) => updateField("notes", e.target.value)}
      />

      <div className="flex gap-3">
        <Button type="submit" isLoading={loading}>
          {mode === "create" ? "Add Property" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
