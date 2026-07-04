import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { InvestmentMetricsGrid } from "@/components/investments/InvestmentMetricsGrid";
import { ActivityForms } from "@/components/investments/ActivityForms";
import { DocumentUploadForm } from "@/components/investments/DocumentUploadForm";
import { ExportButtons } from "@/components/investments/ExportButtons";
import { getInvestmentById } from "@/lib/data/investments";
import { calculateInvestmentMetrics } from "@/lib/calculations/investments";
import { CATEGORY_LABELS } from "@/lib/types/investments";
import { formatCurrency, formatDate, formatPercent } from "@/lib/utils";
import { Button } from "@/components/forms/FormFields";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Pencil } from "lucide-react";

interface InvestmentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function InvestmentDetailPage({ params }: InvestmentDetailPageProps) {
  const { id } = await params;
  const investment = await getInvestmentById(id);
  if (!investment) notFound();

  const metrics = calculateInvestmentMetrics(
    investment,
    investment.transactions ?? [],
    investment.distributions ?? [],
    investment.tax_items ?? [],
    investment.precious_metals ?? []
  );

  return (
    <div>
      <PageHeader title={investment.name} description={CATEGORY_LABELS[investment.category]}>
        <div className="flex items-center gap-2">
          <StatusBadge status={investment.status === "active" ? "active" : "inactive"} label={`${investment.currency} · ${investment.status}`} />
          <Link href={`/investments/${id}/edit`}>
            <Button variant="secondary"><Pencil className="mr-2 h-4 w-4" />Edit</Button>
          </Link>
        </div>
      </PageHeader>

      <InvestmentMetricsGrid metrics={metrics} currency={investment.currency} />

      {metrics.idcDeductions > 0 && (
        <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          Oil & Gas IDC Deductions: {formatCurrency(metrics.idcDeductions, investment.currency)}
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Investment Details">
          <div className="space-y-3 text-sm">
            {[
              ["Entity", investment.entity?.name ?? "—"],
              ["Purchase Date", investment.purchase_date ? formatDate(investment.purchase_date) : "—"],
              ["Invested Capital", formatCurrency(investment.invested_capital, investment.currency)],
              ["Current Value", formatCurrency(investment.current_value, investment.currency)],
              ["Ownership", `${investment.ownership_percent}%`],
              ["Tax Basis", formatCurrency(metrics.taxBasis, investment.currency)],
              ["Remaining Basis", formatCurrency(metrics.remainingBasis, investment.currency)],
              ["IRR (Estimate)", metrics.irrPlaceholder !== null ? formatPercent(metrics.irrPlaceholder) : "N/A"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-navy-700 pb-2 last:border-0">
                <span className="text-slate-400">{label}</span>
                <span className="font-medium text-white">{value}</span>
              </div>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard title="Activity History">
          {(investment.transactions ?? []).length === 0 && (investment.distributions ?? []).length === 0 ? (
            <p className="text-sm text-slate-500">No activity recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {(investment.transactions ?? []).slice(0, 5).map((t) => (
                <div key={t.id} className="flex justify-between text-sm">
                  <span className="text-slate-400">{formatDate(t.transaction_date)} — {t.transaction_type.replace(/_/g, " ")}</span>
                  <span className="text-white">{formatCurrency(t.amount, t.currency)}</span>
                </div>
              ))}
              {(investment.distributions ?? []).slice(0, 5).map((d) => (
                <div key={d.id} className="flex justify-between text-sm">
                  <span className="text-slate-400">{formatDate(d.distribution_date)} — distribution</span>
                  <span className="text-emerald-400">{formatCurrency(d.amount, d.currency)}</span>
                </div>
              ))}
            </div>
          )}
        </DashboardCard>
      </div>

      <div className="mt-8">
        <DashboardCard title="Record Activity" description="Contributions, distributions, capital calls, K-1 items">
          <ActivityForms investmentId={id} currency={investment.currency} category={investment.category} />
        </DashboardCard>
      </div>

      {(investment.capital_calls ?? []).length > 0 && (
        <div className="mt-8">
          <DashboardCard title="Capital Calls">
            <div className="space-y-2">
              {(investment.capital_calls ?? []).map((c) => (
                <div key={c.id} className="flex justify-between rounded-lg border border-navy-700 bg-navy-800 px-4 py-3 text-sm">
                  <span className="text-slate-300">{formatDate(c.call_date)} — {c.status}</span>
                  <span className="text-white">{formatCurrency(c.amount, c.currency)}</span>
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>
      )}

      {(investment.precious_metals ?? []).length > 0 && (
        <div className="mt-8">
          <DashboardCard title="Precious Metals">
            <div className="space-y-3">
              {(investment.precious_metals ?? []).map((m) => (
                <div key={m.id} className="rounded-lg border border-navy-700 bg-navy-800 p-3 text-sm">
                  <p className="font-medium capitalize text-white">{m.metal_type}</p>
                  <p className="text-xs text-slate-400">
                    {m.quantity} {m.unit} @ {formatCurrency(m.spot_value, m.currency)}/unit
                    {m.storage_location && ` · ${m.storage_location}`}
                  </p>
                  <p className="mt-1 text-white">{formatCurrency(m.quantity * m.spot_value, m.currency)}</p>
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Documents" description="K-1s, subscription docs, capital calls, valuations">
          <DocumentUploadForm investmentId={id} />
          {(investment.documents ?? []).length > 0 && (
            <div className="mt-4 space-y-2">
              {(investment.documents ?? []).map((d) => (
                <div key={d.id} className="flex justify-between text-sm">
                  <span className="text-slate-300">{d.name}</span>
                  <span className="text-xs capitalize text-slate-500">{d.document_type.replace("_", " ")}</span>
                </div>
              ))}
            </div>
          )}
        </DashboardCard>

        <DashboardCard title="CPA Exports">
          <ExportButtons />
        </DashboardCard>
      </div>
    </div>
  );
}
