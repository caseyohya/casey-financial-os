"use client";

import { useState } from "react";
import type { TaxYearWithRelations } from "@/lib/types/tax";
import { buildAnnualTaxSummary, calculateScheduleETotals } from "@/lib/calculations/tax";
import {
  FILING_STATUS_LABELS,
  TAX_YEAR_STATUS_LABELS,
} from "@/lib/types/tax";
import { formatCurrency } from "@/lib/utils";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { TaxFlagsPanel } from "@/components/tax/TaxFlagsPanel";
import { DocumentChecklist } from "@/components/tax/DocumentChecklist";
import { ExportButtons } from "@/components/tax/ExportButtons";
import { TaxSectionForms } from "@/components/tax/TaxSectionForms";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "summary", label: "Summary" },
  { id: "accounts", label: "Accounts" },
  { id: "income", label: "Income" },
  { id: "expenses", label: "Expenses" },
  { id: "deductions", label: "Deductions" },
  { id: "foreign", label: "Foreign" },
  { id: "fbar", label: "FBAR" },
  { id: "form8938", label: "Form 8938" },
  { id: "schedule_e", label: "Schedule E" },
  { id: "k1", label: "K-1" },
  { id: "depreciation", label: "Depreciation" },
  { id: "documents", label: "Documents" },
  { id: "exports", label: "Exports" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface TaxYearWorkspaceProps {
  data: TaxYearWithRelations;
}

export function TaxYearWorkspace({ data }: TaxYearWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<TabId>("summary");
  const summary = buildAnnualTaxSummary(data);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <StatusBadge
          status={data.status === "filed" || data.status === "ready_for_cpa" ? "active" : "pending"}
          label={TAX_YEAR_STATUS_LABELS[data.status]}
        />
        <span className="text-sm text-slate-400">
          {FILING_STATUS_LABELS[data.filing_status]}
        </span>
        {data.usd_to_jpy_rate && (
          <span className="text-sm text-slate-500">
            USD/JPY: {data.usd_to_jpy_rate}
          </span>
        )}
        {summary.flags.length > 0 && (
          <StatusBadge status="warning" label={`${summary.flags.length} flags`} />
        )}
      </div>

      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-1 border-b border-navy-700 pb-px">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "whitespace-nowrap px-3 py-2 text-xs font-medium transition-colors",
                activeTab === tab.id
                  ? "border-b-2 border-gold-500 text-gold-500"
                  : "text-slate-400 hover:text-white"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "summary" && (
        <div className="space-y-6">
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-200">
            Organizer and CPA-preparation tool only. Does not file taxes, provide legal tax advice, or submit IRS forms.
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Total Income (USD)" value={formatCurrency(summary.totalIncomeUsd)} />
            <MetricCard label="Total Deductions (USD)" value={formatCurrency(summary.totalDeductionsUsd)} />
            <MetricCard label="Rental Net Income" value={formatCurrency(summary.rentalNetIncome)} />
            <MetricCard label="IDC Deductions" value={formatCurrency(summary.idcDeductions)} />
            <MetricCard label="Foreign Interest" value={formatCurrency(summary.foreignInterestIncome)} />
            <MetricCard label="K-1 Ordinary Income" value={formatCurrency(summary.k1OrdinaryIncome)} />
            <MetricCard label="Depreciation" value={formatCurrency(summary.depreciationTotal)} />
            <MetricCard
              label="Documents"
              value={`${summary.documentsReceived}/${summary.documentsRequired}`}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <DashboardCard title="Foreign Reporting" description="FBAR and Form 8938 totals">
              <div className="space-y-3">
                <div className="flex justify-between border-b border-navy-700 pb-2">
                  <span className="text-sm text-slate-400">FBAR Accounts</span>
                  <span className="text-sm text-white">{summary.fbarAccountCount}</span>
                </div>
                <div className="flex justify-between border-b border-navy-700 pb-2">
                  <span className="text-sm text-slate-400">FBAR Max Value (USD)</span>
                  <span className="text-sm text-white">{formatCurrency(summary.fbarTotalMaxValue)}</span>
                </div>
                <div className="flex justify-between border-b border-navy-700 pb-2">
                  <span className="text-sm text-slate-400">Form 8938 Accounts</span>
                  <span className="text-sm text-white">{summary.form8938AccountCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">Form 8938 Total Value</span>
                  <span className="text-sm text-white">{formatCurrency(summary.form8938TotalValue)}</span>
                </div>
              </div>
            </DashboardCard>

            <TaxFlagsPanel flags={summary.flags} />
          </div>

          <DashboardCard title="CPA Exports" description="Download CPA-ready CSV packages">
            <ExportButtons year={data.year} />
          </DashboardCard>
        </div>
      )}

      {activeTab === "accounts" && (
        <TaxSectionForms
          section="accounts"
          data={data}
          items={data.accounts}
          renderItem={(a) => (
            <>
              <td className="py-2 pr-4 text-white">{a.account_name}</td>
              <td className="py-2 pr-4 text-slate-300">{a.institution}</td>
              <td className="py-2 pr-4 text-slate-300">{a.country}</td>
              <td className="py-2 pr-4 text-slate-300">{a.currency}</td>
              <td className="py-2 pr-4 text-slate-300">{a.is_foreign ? "Yes" : "No"}</td>
              <td className={cn("py-2 pr-4", a.year_end_balance == null && "text-red-400")}>
                {a.year_end_balance != null ? formatCurrency(a.year_end_balance, a.currency, a.currency === "JPY" ? "ja-JP" : "en-US") : "Missing"}
              </td>
              <td className={cn("py-2", a.max_annual_balance == null && "text-red-400")}>
                {a.max_annual_balance != null ? formatCurrency(a.max_annual_balance, a.currency, a.currency === "JPY" ? "ja-JP" : "en-US") : "Missing"}
              </td>
            </>
          )}
          columns={["Account", "Institution", "Country", "Currency", "Foreign", "Year-End", "Max Annual"]}
        />
      )}

      {activeTab === "income" && (
        <TaxSectionForms
          section="income"
          data={data}
          items={data.income_items}
          renderItem={(i) => (
            <>
              <td className="py-2 pr-4 text-slate-300">{i.income_type}</td>
              <td className="py-2 pr-4 text-white">{i.description}</td>
              <td className="py-2 pr-4 text-slate-300">
                {formatCurrency(i.amount, i.currency, i.currency === "JPY" ? "ja-JP" : "en-US")}
              </td>
              <td className="py-2 pr-4 text-slate-300">{i.is_foreign ? "Yes" : "No"}</td>
              <td className="py-2 text-slate-300">{i.source ?? "—"}</td>
            </>
          )}
          columns={["Type", "Description", "Amount", "Foreign", "Source"]}
        />
      )}

      {activeTab === "expenses" && (
        <TaxSectionForms
          section="expenses"
          data={data}
          items={data.expense_items}
          renderItem={(e) => (
            <>
              <td className="py-2 pr-4 text-slate-300">{e.expense_type}</td>
              <td className="py-2 pr-4 text-white">{e.description}</td>
              <td className="py-2 pr-4 text-slate-300">
                {formatCurrency(e.amount, e.currency, e.currency === "JPY" ? "ja-JP" : "en-US")}
              </td>
              <td className="py-2 text-slate-300">{e.property_name ?? "—"}</td>
            </>
          )}
          columns={["Type", "Description", "Amount", "Property"]}
        />
      )}

      {activeTab === "deductions" && (
        <TaxSectionForms
          section="deductions"
          data={data}
          items={data.deductions}
          renderItem={(d) => (
            <>
              <td className="py-2 pr-4 text-slate-300">{d.deduction_type}</td>
              <td className="py-2 pr-4 text-white">{d.description}</td>
              <td className="py-2 pr-4 text-slate-300">
                {formatCurrency(d.amount, d.currency, d.currency === "JPY" ? "ja-JP" : "en-US")}
              </td>
              <td className="py-2 text-slate-300">{d.investment_name ?? "—"}</td>
            </>
          )}
          columns={["Type", "Description", "Amount", "Investment"]}
        />
      )}

      {activeTab === "foreign" && (
        <TaxSectionForms
          section="foreign"
          data={data}
          items={data.foreign_accounts}
          renderItem={(f) => (
            <>
              <td className="py-2 pr-4 text-white">{f.account_name}</td>
              <td className="py-2 pr-4 text-slate-300">{f.institution}</td>
              <td className="py-2 pr-4 text-slate-300">{f.country}</td>
              <td className="py-2 pr-4 text-slate-300">
                {formatCurrency(f.interest_earned, f.interest_currency, f.interest_currency === "JPY" ? "ja-JP" : "en-US")}
              </td>
              <td className={cn("py-2 pr-4", f.year_end_value_usd == null && "text-red-400")}>
                {f.year_end_value_usd != null ? formatCurrency(f.year_end_value_usd) : "Missing"}
              </td>
              <td className={cn("py-2", f.max_value_usd == null && "text-red-400")}>
                {f.max_value_usd != null ? formatCurrency(f.max_value_usd) : "Missing"}
              </td>
            </>
          )}
          columns={["Account", "Institution", "Country", "Interest", "Year-End USD", "Max USD"]}
        />
      )}

      {activeTab === "fbar" && (
        <TaxSectionForms
          section="fbar"
          data={data}
          items={data.fbar_items}
          renderItem={(f) => (
            <>
              <td className="py-2 pr-4 text-white">{f.account_name}</td>
              <td className="py-2 pr-4 text-slate-300">{f.institution_name}</td>
              <td className="py-2 pr-4 text-slate-300">{f.country}</td>
              <td className="py-2 pr-4 text-slate-300">{f.account_type}</td>
              <td className={cn("py-2 pr-4", f.max_value_usd == null && "text-red-400")}>
                {f.max_value_usd != null ? formatCurrency(f.max_value_usd) : "Missing"}
              </td>
              <td className={cn("py-2", f.year_end_value_usd == null && "text-red-400")}>
                {f.year_end_value_usd != null ? formatCurrency(f.year_end_value_usd) : "Missing"}
              </td>
            </>
          )}
          columns={["Account", "Institution", "Country", "Type", "Max USD", "Year-End USD"]}
        />
      )}

      {activeTab === "form8938" && (
        <TaxSectionForms
          section="form8938"
          data={data}
          items={data.form_8938_items}
          renderItem={(f) => (
            <>
              <td className="py-2 pr-4 text-white">{f.asset_description}</td>
              <td className="py-2 pr-4 text-slate-300">{f.institution}</td>
              <td className="py-2 pr-4 text-slate-300">{f.country}</td>
              <td className="py-2 pr-4 text-slate-300">{f.asset_type}</td>
              <td className="py-2 pr-4 text-slate-300">
                {f.max_value_during_year != null ? formatCurrency(f.max_value_during_year, f.currency) : "—"}
              </td>
              <td className="py-2 text-slate-300">
                {f.year_end_value != null ? formatCurrency(f.year_end_value, f.currency) : "—"}
              </td>
            </>
          )}
          columns={["Asset", "Institution", "Country", "Type", "Max Value", "Year-End"]}
        />
      )}

      {activeTab === "schedule_e" && (
        <TaxSectionForms
          section="schedule_e"
          data={data}
          items={data.schedule_e_items}
          renderItem={(s) => {
            const totals = calculateScheduleETotals(s);
            return (
              <>
                <td className="py-2 pr-4 text-white">{s.property_name}</td>
                <td className="py-2 pr-4 text-slate-300">{s.days_rented}</td>
                <td className="py-2 pr-4 text-emerald-400">
                  {formatCurrency(s.gross_rents, s.currency, s.currency === "JPY" ? "ja-JP" : "en-US")}
                </td>
                <td className="py-2 pr-4 text-red-400">
                  {formatCurrency(totals.totalExpenses, s.currency, s.currency === "JPY" ? "ja-JP" : "en-US")}
                </td>
                <td className="py-2 text-white">
                  {formatCurrency(totals.netIncome, s.currency, s.currency === "JPY" ? "ja-JP" : "en-US")}
                </td>
              </>
            );
          }}
          columns={["Property", "Days Rented", "Gross Rents", "Expenses", "Net Income"]}
        />
      )}

      {activeTab === "k1" && (
        <TaxSectionForms
          section="k1"
          data={data}
          items={data.k1_items}
          renderItem={(k) => (
            <>
              <td className="py-2 pr-4 text-white">{k.entity_name}</td>
              <td className="py-2 pr-4 text-slate-300">{k.entity_ein ?? "—"}</td>
              <td className="py-2 pr-4 text-slate-300">{formatCurrency(k.box_1_ordinary_income, k.currency)}</td>
              <td className="py-2 pr-4 text-slate-300">{formatCurrency(k.idc_deduction, k.currency)}</td>
              <td className="py-2 text-slate-300">{formatCurrency(k.depletion, k.currency)}</td>
            </>
          )}
          columns={["Entity", "EIN", "Ordinary Income", "IDC", "Depletion"]}
        />
      )}

      {activeTab === "depreciation" && (
        <TaxSectionForms
          section="depreciation"
          data={data}
          items={data.depreciation_items}
          renderItem={(d) => (
            <>
              <td className="py-2 pr-4 text-white">{d.property_name}</td>
              <td className="py-2 pr-4 text-slate-300">{d.asset_description}</td>
              <td className="py-2 pr-4 text-slate-300">{formatCurrency(d.cost_basis, d.currency)}</td>
              <td className="py-2 pr-4 text-slate-300">{formatCurrency(d.current_year_depreciation, d.currency)}</td>
              <td className="py-2 text-slate-300">{formatCurrency(d.remaining_basis, d.currency)}</td>
            </>
          )}
          columns={["Property", "Asset", "Cost Basis", "Current Year", "Remaining"]}
        />
      )}

      {activeTab === "documents" && (
        <DocumentChecklist
          documents={data.documents}
          taxYearId={data.id}
          year={data.year}
        />
      )}

      {activeTab === "exports" && (
        <div className="space-y-6">
          <DashboardCard title="CPA-Ready CSV Exports" description="Download organized data for your CPA">
            <ExportButtons year={data.year} />
          </DashboardCard>

          {data.exports.length > 0 && (
            <DashboardCard title="Export History" description="Previously generated exports">
              <div className="space-y-2">
                {data.exports.map((exp) => (
                  <div key={exp.id} className="flex justify-between border-b border-navy-700 pb-2 text-sm">
                    <span className="text-white">{exp.file_name}</span>
                    <span className="text-slate-500">{new Date(exp.generated_at).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </DashboardCard>
          )}
        </div>
      )}
    </div>
  );
}
