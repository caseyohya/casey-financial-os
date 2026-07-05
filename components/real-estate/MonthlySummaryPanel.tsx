"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { generateMonthlySummary } from "@/app/(dashboard)/real-estate/actions";
import { Button } from "@/components/forms/FormFields";
import { formatCurrency } from "@/lib/utils";
import type { PropertyCurrency, PropertyMonthlySummary } from "@/lib/types/real-estate";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

interface MonthlySummaryPanelProps {
  propertyId: string;
  currency: PropertyCurrency;
  summaries: PropertyMonthlySummary[];
}

export function MonthlySummaryPanel({ propertyId, currency, summaries }: MonthlySummaryPanelProps) {
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    const result = await generateMonthlySummary(propertyId, year, month);
    if (result?.error) setError(result.error);
    else router.refresh();
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-400">Year</label>
          <input
            type="number"
            min="2000"
            max="2100"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10) || year)}
            className="w-24 rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-white"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-400">Month</label>
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value, 10))}
            className="rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-white"
          >
            {MONTH_NAMES.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <Button type="button" isLoading={loading} onClick={handleGenerate}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Generate Summary
        </Button>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {summaries.length === 0 ? (
        <p className="text-sm text-slate-500">No monthly summaries yet. Generate one from income and expense records.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-700 text-left text-xs uppercase text-slate-500">
                <th className="pb-2 pr-4">Period</th>
                <th className="pb-2 pr-4">Gross Rent</th>
                <th className="pb-2 pr-4">Vacancy</th>
                <th className="pb-2 pr-4">OpEx</th>
                <th className="pb-2 pr-4">NOI</th>
                <th className="pb-2 pr-4">Principal</th>
                <th className="pb-2 pr-4">Interest</th>
                <th className="pb-2">Cash Flow</th>
              </tr>
            </thead>
            <tbody>
              {summaries.slice(0, 12).map((s) => (
                <tr key={s.id} className="border-b border-navy-800 text-slate-300">
                  <td className="py-2 pr-4">{MONTH_NAMES[s.month - 1]} {s.year}</td>
                  <td className="py-2 pr-4">{formatCurrency(s.gross_rent, currency)}</td>
                  <td className="py-2 pr-4 text-amber-400">{formatCurrency(s.vacancy_loss, currency)}</td>
                  <td className="py-2 pr-4">{formatCurrency(s.operating_expenses, currency)}</td>
                  <td className="py-2 pr-4">{formatCurrency(s.net_operating_income, currency)}</td>
                  <td className="py-2 pr-4">{formatCurrency(s.mortgage_principal, currency)}</td>
                  <td className="py-2 pr-4">{formatCurrency(s.mortgage_interest, currency)}</td>
                  <td className={`py-2 ${s.cash_flow >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {formatCurrency(s.cash_flow, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
