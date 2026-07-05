import { PageHeader } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { PieChartCard } from "@/components/charts/FinancialCharts";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { TrendingUp } from "lucide-react";

const placeholderHoldings = [
  { symbol: "VTI", name: "Vanguard Total Stock", type: "etf", value: 285000, weight: 44 },
  { symbol: "AAPL", name: "Apple Inc.", type: "stock", value: 125000, weight: 19 },
  { symbol: "MSFT", name: "Microsoft Corp.", type: "stock", value: 98000, weight: 15 },
  { symbol: "BND", name: "Vanguard Total Bond", type: "bond", value: 87000, weight: 13 },
  { symbol: "BTC", name: "Bitcoin", type: "crypto", value: 52500, weight: 9 },
];

const allocationData = placeholderHoldings.map((h) => ({
  name: h.symbol,
  value: h.value,
}));

export default function InvestmentsPage() {
  const totalValue = placeholderHoldings.reduce((s, h) => s + h.value, 0);

  return (
    <div>
      <PageHeader
        title="Investment Platform"
        description="Portfolio holdings, allocation, and performance — read-only tracking"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Portfolio Value" value={formatCurrency(totalValue)} />
        <MetricCard
          label="Total Gain"
          value={formatCurrency(142500)}
          change={formatPercent(28.3)}
          changeType="positive"
        />
        <MetricCard label="Holdings" value={String(placeholderHoldings.length)} />
        <MetricCard
          label="Day Change"
          value={formatCurrency(3200)}
          change={formatPercent(0.5)}
          changeType="positive"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Allocation" description="Portfolio breakdown by holding">
          <PieChartCard data={allocationData} />
        </DashboardCard>

        <DashboardCard title="Holdings" description="Current positions">
          <div className="space-y-3">
            {placeholderHoldings.map((holding) => (
              <div
                key={holding.symbol}
                className="flex items-center justify-between rounded-lg border border-navy-700 bg-navy-800 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    {holding.symbol}
                    <span className="ml-2 text-xs font-normal text-slate-400">
                      {holding.name}
                    </span>
                  </p>
                  <p className="text-xs capitalize text-slate-500">{holding.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">
                    {formatCurrency(holding.value)}
                  </p>
                  <p className="text-xs text-slate-400">{holding.weight}%</p>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>

      <div className="mt-8">
        <DashboardCard title="Add Holding" description="Manual data entry">
          <EmptyState
            title="Expand your portfolio"
            description="Add stocks, ETFs, bonds, and crypto holdings manually. No trading or execution — read-only tracking only."
            icon={<TrendingUp className="h-8 w-8" />}
          />
        </DashboardCard>
      </div>
    </div>
  );
}
