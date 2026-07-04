"use client";

import type { ExecutiveFilters, ExecutiveCountryFilter, AssetCategory } from "@/lib/types/executive";
import { SelectField } from "@/components/forms/FormFields";

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: new Date(2000, i).toLocaleString("en-US", { month: "long" }),
}));

const YEARS = Array.from({ length: 5 }, (_, i) => {
  const y = new Date().getFullYear() - i;
  return { value: String(y), label: String(y) };
});

interface ExecutiveFiltersBarProps {
  filters: ExecutiveFilters;
  onChange: (filters: ExecutiveFilters) => void;
}

export function ExecutiveFiltersBar({ filters, onChange }: ExecutiveFiltersBarProps) {
  return (
    <div className="flex flex-wrap gap-3 rounded-xl border border-navy-700 bg-navy-900/60 px-4 py-3">
      <SelectField
        label="Year"
        options={YEARS}
        value={String(filters.year)}
        onChange={(e) => onChange({ ...filters, year: parseInt(e.target.value, 10) })}
        className="min-w-[100px]"
      />
      <SelectField
        label="Month"
        options={MONTHS}
        value={String(filters.month)}
        onChange={(e) => onChange({ ...filters, month: parseInt(e.target.value, 10) })}
        className="min-w-[120px]"
      />
      <SelectField
        label="Country"
        options={[
          { value: "ALL", label: "All Countries" },
          { value: "US", label: "United States" },
          { value: "JP", label: "Japan" },
        ]}
        value={filters.country}
        onChange={(e) => onChange({ ...filters, country: e.target.value as ExecutiveCountryFilter })}
        className="min-w-[140px]"
      />
      <SelectField
        label="Asset Category"
        options={[
          { value: "ALL", label: "All Categories" },
          { value: "cash", label: "Cash & Banking" },
          { value: "real_estate", label: "Real Estate" },
          { value: "investments", label: "Investments" },
          { value: "precious_metals", label: "Precious Metals" },
        ]}
        value={filters.category}
        onChange={(e) => onChange({ ...filters, category: e.target.value as AssetCategory })}
        className="min-w-[150px]"
      />
    </div>
  );
}
