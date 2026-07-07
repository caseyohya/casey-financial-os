"use client";

import type { BankingFilters as Filters } from "@/lib/types";
import { SelectField } from "@/components/forms/FormFields";
import { COUNTRIES, CURRENCIES, DEFAULT_FILTERS } from "@/lib/banking/constants";
import type { BankAccount, TransactionCategory } from "@/lib/types";

interface BankingFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  accounts: BankAccount[];
  categories: TransactionCategory[];
  showMonth?: boolean;
}

function buildMonthOptions(): { value: string; label: string }[] {
  const options = [{ value: "", label: "All months" }];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    options.push({ value, label });
  }
  return options;
}

export function BankingFilters({
  filters,
  onChange,
  accounts,
  categories,
  showMonth = true,
}: BankingFiltersProps) {
  const monthOptions = buildMonthOptions();

  const update = (key: keyof Filters, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="flex flex-wrap gap-3 rounded-lg border border-navy-700 bg-navy-800/50 p-4">
      <SelectField
        label="Account"
        value={filters.accountId}
        onChange={(e) => update("accountId", e.target.value)}
        options={[
          { value: "", label: "All accounts" },
          ...accounts.map((a) => ({ value: a.id, label: a.name })),
        ]}
        className="min-w-[160px]"
      />
      {showMonth && (
        <SelectField
          label="Month"
          value={filters.month}
          onChange={(e) => update("month", e.target.value)}
          options={monthOptions}
          className="min-w-[160px]"
        />
      )}
      <SelectField
        label="Category"
        value={filters.categoryId}
        onChange={(e) => update("categoryId", e.target.value)}
        options={[
          { value: "", label: "All categories" },
          ...categories.map((c) => ({ value: c.id, label: c.name })),
        ]}
        className="min-w-[160px]"
      />
      <SelectField
        label="Country"
        value={filters.country}
        onChange={(e) => update("country", e.target.value)}
        options={[{ value: "", label: "All countries" }, ...COUNTRIES]}
        className="min-w-[140px]"
      />
      <SelectField
        label="Currency"
        value={filters.currency}
        onChange={(e) => update("currency", e.target.value)}
        options={[{ value: "", label: "All currencies" }, ...CURRENCIES.map((c) => ({ value: c.value, label: c.label }))]}
        className="min-w-[140px]"
      />
      <button
        type="button"
        onClick={() => onChange({ ...DEFAULT_FILTERS })}
        className="self-end rounded-lg px-3 py-2 text-xs text-slate-400 hover:bg-navy-700 hover:text-white"
      >
        Clear filters
      </button>
    </div>
  );
}
