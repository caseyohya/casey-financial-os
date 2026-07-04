"use client";

import { useMemo, useState, useTransition } from "react";
import type { ExecutiveDashboardData, ExecutiveFilters } from "@/lib/types/executive";
import { aggregateExecutiveKPIs, buildExecutiveCharts, generateAlerts, buildWhatChanged } from "@/lib/calculations/executive";
import type { RawModuleData } from "@/lib/types/executive";
import { ExecutiveFiltersBar } from "@/components/executive/ExecutiveFiltersBar";
import { ExecutiveKPIGrid } from "@/components/executive/ExecutiveKPIGrid";
import { ExecutiveChartsPanel } from "@/components/executive/ExecutiveChartsPanel";
import { PassiveIncomeProgress } from "@/components/executive/PassiveIncomeProgress";
import { AlertPanel } from "@/components/executive/AlertPanel";
import { WhatChangedSection } from "@/components/executive/WhatChangedSection";
import { FinancialHealthScore } from "@/components/executive/FinancialHealthScore";
import Link from "next/link";
import { Download, RefreshCw } from "lucide-react";
import { refreshSummaries } from "@/app/(dashboard)/executive-dashboard/actions";

interface ExecutiveDashboardClientProps {
  initialData: ExecutiveDashboardData;
  rawData: RawModuleData;
  historical: { year: number; month: number; net_worth: number; cash_flow: number; passive_income: number; noi: number; distributions: number }[];
}

export function ExecutiveDashboardClient({
  initialData,
  rawData,
  historical,
}: ExecutiveDashboardClientProps) {
  const [filters, setFilters] = useState<ExecutiveFilters>(initialData.filters);
  const [isPending, startTransition] = useTransition();

  const dashboard = useMemo(() => {
    const kpis = aggregateExecutiveKPIs(rawData, filters);
    const charts = buildExecutiveCharts(rawData, kpis, filters, historical);
    const alerts = generateAlerts(rawData, kpis);
    const prevMonth = filters.month === 1 ? 12 : filters.month - 1;
    const prevYear = filters.month === 1 ? filters.year - 1 : filters.year;
    const prev = historical.find((h) => h.year === prevYear && h.month === prevMonth);
    const whatChanged = buildWhatChanged(kpis, prev ? {
      netWorth: prev.net_worth,
      monthlyCashFlow: prev.cash_flow,
      passiveIncome: prev.passive_income,
      realEstateNOI: prev.noi,
      investmentValue: kpis.investmentValue,
    } : null);
    return { kpis, charts, alerts, whatChanged, filters };
  }, [rawData, filters, historical]);

  function handleRefresh() {
    startTransition(async () => {
      await refreshSummaries(filters);
    });
  }

  const reportUrl = `/api/executive/export/report?year=${filters.year}&month=${filters.month}&country=${filters.country}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <ExecutiveFiltersBar filters={filters} onChange={setFilters} />
        <div className="flex shrink-0 gap-2">
          <button
            onClick={handleRefresh}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-slate-300 hover:bg-navy-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link
            href={reportUrl}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-lg bg-gold-500 px-3 py-2 text-sm font-medium text-navy-950 hover:bg-gold-400"
          >
            <Download className="h-4 w-4" />
            Export Report
          </Link>
        </div>
      </div>

      <ExecutiveKPIGrid kpis={dashboard.kpis} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PassiveIncomeProgress kpis={dashboard.kpis} />
        </div>
        <FinancialHealthScore kpis={dashboard.kpis} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WhatChangedSection items={dashboard.whatChanged} currency={dashboard.kpis.currency} />
        </div>
        <AlertPanel alerts={dashboard.alerts} />
      </div>

      <ExecutiveChartsPanel charts={dashboard.charts} />

      <div className="rounded-xl border border-navy-700 bg-navy-900/50 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Module Navigation</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { href: "/financial-hub", label: "Financial Hub" },
            { href: "/banking", label: "Banking" },
            { href: "/real-estate", label: "Real Estate" },
            { href: "/investments", label: "Investments" },
            { href: "/tax", label: "Tax Intelligence" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg border border-navy-600 px-3 py-2 text-center text-sm text-slate-400 transition-colors hover:border-gold-500/40 hover:text-gold-400"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
