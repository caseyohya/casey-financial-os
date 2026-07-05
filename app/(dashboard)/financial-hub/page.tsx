import { PageHeader } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { BarChartCard } from "@/components/charts/FinancialCharts";
import { formatCurrency } from "@/lib/utils";
import { Wallet } from "lucide-react";

const cashFlowData = [
  { name: "Jan", value: 8200 },
  { name: "Feb", value: 9100 },
  { name: "Mar", value: 7800 },
  { name: "Apr", value: 10500 },
  { name: "May", value: 11200 },
  { name: "Jun", value: 12400 },
];

export default function FinancialHubPage() {
  return (
    <div>
      <PageHeader
        title="Financial Hub"
        description="Central command for net worth tracking and cash flow analysis"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Net Worth"
          value={formatCurrency(1385000)}
          change="+2.8% YTD"
          changeType="positive"
        />
        <MetricCard
          label="Liquid Assets"
          value={formatCurrency(333000)}
          changeType="neutral"
        />
        <MetricCard
          label="Monthly Income"
          value={formatCurrency(28500)}
          change="+3.1%"
          changeType="positive"
        />
        <MetricCard
          label="Monthly Expenses"
          value={formatCurrency(16100)}
          change="-1.2%"
          changeType="positive"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Cash Flow" description="Monthly net cash flow">
          <BarChartCard data={cashFlowData} />
        </DashboardCard>

        <DashboardCard title="Financial Summary" description="Key ratios and metrics">
          <div className="space-y-4">
            {[
              { label: "Savings Rate", value: "43.5%" },
              { label: "Debt-to-Asset Ratio", value: "25.1%" },
              { label: "Emergency Fund", value: "8.2 months" },
              { label: "Investment Allocation", value: "35.0%" },
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
        <DashboardCard title="Manual Data Entry" description="Add your financial data">
          <EmptyState
            title="No custom entries yet"
            description="Start by adding accounts, properties, and holdings across the platform modules. Data entered in other modules will appear here automatically."
            icon={<Wallet className="h-8 w-8" />}
          />
        </DashboardCard>
      </div>
    </div>
  );
}
