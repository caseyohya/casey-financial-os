import { PageHeader } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { AreaChartCard } from "@/components/charts/FinancialCharts";
import { formatCurrency } from "@/lib/utils";

const netWorthData = [
  { name: "Jan", value: 1250000 },
  { name: "Feb", value: 1280000 },
  { name: "Mar", value: 1310000 },
  { name: "Apr", value: 1295000 },
  { name: "May", value: 1340000 },
  { name: "Jun", value: 1385000 },
];

export default function ExecutiveDashboardPage() {
  return (
    <div>
      <PageHeader
        title="Executive Dashboard"
        description="Unified overview of your entire financial position"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Net Worth"
          value={formatCurrency(1385000)}
          change="+2.8% this month"
          changeType="positive"
        />
        <MetricCard
          label="Total Assets"
          value={formatCurrency(1850000)}
          change="+1.5% this month"
          changeType="positive"
        />
        <MetricCard
          label="Total Liabilities"
          value={formatCurrency(465000)}
          change="-0.8% this month"
          changeType="positive"
        />
        <MetricCard
          label="Monthly Cash Flow"
          value={formatCurrency(12400)}
          change="+4.2% vs last month"
          changeType="positive"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <DashboardCard
          title="Net Worth Trend"
          description="6-month historical view"
        >
          <AreaChartCard data={netWorthData} />
        </DashboardCard>

        <DashboardCard
          title="Asset Allocation"
          description="Portfolio breakdown by category"
        >
          <div className="space-y-4">
            {[
              { label: "Real Estate", value: 42, amount: 777000 },
              { label: "Investments", value: 35, amount: 647500 },
              { label: "Cash & Banking", value: 18, amount: 333000 },
              { label: "Other", value: 5, amount: 92500 },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">{item.label}</span>
                  <span className="text-slate-400">
                    {formatCurrency(item.amount)} ({item.value}%)
                  </span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-navy-700">
                  <div
                    className="h-2 rounded-full bg-gold-500"
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>

      <div className="mt-8">
        <DashboardCard title="Quick Actions" description="Navigate to your modules">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { href: "/financial-hub", label: "Financial Hub" },
              { href: "/banking", label: "Banking Platform" },
              { href: "/real-estate", label: "Real Estate" },
              { href: "/investments", label: "Investments" },
              { href: "/tax", label: "Tax Intelligence" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg border border-navy-600 bg-navy-800 px-4 py-3 text-sm text-slate-300 transition-colors hover:border-gold-500/50 hover:text-gold-400"
              >
                {link.label} →
              </a>
            ))}
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
