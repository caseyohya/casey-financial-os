"use client";

import { useState } from "react";
import { createTaxYear } from "@/app/(dashboard)/tax/actions";
import { InputField, SelectField, Button } from "@/components/forms/FormFields";
import type { FilingStatus } from "@/lib/types/tax";
import { FILING_STATUS_LABELS } from "@/lib/types/tax";

export function CreateTaxYearForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);

    const result = await createTaxYear({
      year: parseInt(formData.get("year") as string, 10),
      filing_status: formData.get("filing_status") as FilingStatus,
      status: "draft",
      usd_to_jpy_rate: formData.get("usd_to_jpy_rate")
        ? parseFloat(formData.get("usd_to_jpy_rate") as string)
        : null,
      jpy_to_usd_rate: formData.get("usd_to_jpy_rate")
        ? 1 / parseFloat(formData.get("usd_to_jpy_rate") as string)
        : null,
    });

    if (result && "error" in result) {
      setError(result.error ?? "Failed to create tax year");
      setIsLoading(false);
    }
  }

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} variant="primary">
        + New Tax Year
      </Button>
    );
  }

  return (
    <form action={handleSubmit} className="rounded-xl border border-navy-700 bg-navy-900 p-5">
      <h3 className="mb-4 text-sm font-semibold text-white">Create Tax Year</h3>
      <div className="grid gap-4 sm:grid-cols-3">
        <InputField
          label="Tax Year"
          name="year"
          type="number"
          defaultValue={currentYear}
          min={2000}
          max={2100}
          required
        />
        <SelectField
          label="Filing Status"
          name="filing_status"
          options={Object.entries(FILING_STATUS_LABELS).map(([value, label]) => ({
            value,
            label,
          }))}
          defaultValue="single"
        />
        <InputField
          label="USD/JPY Exchange Rate"
          name="usd_to_jpy_rate"
          type="number"
          step="0.000001"
          placeholder="e.g. 150.00"
        />
      </div>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      <div className="mt-4 flex gap-2">
        <Button type="submit" isLoading={isLoading}>
          Create
        </Button>
        <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
