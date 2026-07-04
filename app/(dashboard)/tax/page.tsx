import { PageHeader } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { BarChartCard } from "@/components/charts/FinancialCharts";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { FileText } from "lucide-react";

const taxHistory = [
  { name: "2021", value: 98500 },
  { name: "2022", value: 112000 },
  { name: "2023", value: 108500 },
  { name: "2024", value: 124800 },
  { name: "2025", value: 0 },
];

export default function TaxPage() {
  return (
    <div>
      <PageHeader
        title="Tax Intelligence"
        description="Tax records, effective rates, and planning insights"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="2024 Total Tax" value={formatCurrency(124800)} />
        <MetricCard
          label="Effective Rate"
          value="28.4%"
          changeType="neutral"
        />
        <MetricCard label="Federal Tax" value={formatCurrency(89200)} />
        <MetricCard label="State Tax" value={formatCurrency(35600)} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Tax Liability History" description="Annual total tax paid">
          <BarChartCard data={taxHistory} />
        </DashboardCard>

        <DashboardCard title="2024 Tax Summary" description="Most recent filing">
          <div className="space-y-4">
            {[
              { label: "Gross Income", value: formatCurrency(440000) },
              { label: "Taxable Income", value: formatCurrency(385000) },
              { label: "Federal Tax", value: formatCurrency(89200) },
              { label: "State Tax (CA)", value: formatCurrency(35600) },
              { label: "Effective Rate", value: formatPercent(28.4) },
              { label: "Filing Status", value: "Married Filing Jointly" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between border-b border-navy-700 pb-3 last:border-0"
              >
                <span className="text-sm text-slate-400">{item.label}</span>
                <span className="text-sm font-medium text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>

      <div className="mt-8">
        <DashboardCard title="Tax Records" description="Manual data entry">
          <EmptyState
            title="Add tax records"
            description="Enter annual tax filings to track liability trends, effective rates, and plan for upcoming years."
            icon={<FileText className="h-8 w-8" />}
          />
        </DashboardCard>
      </div>
    </div>
  );
}
