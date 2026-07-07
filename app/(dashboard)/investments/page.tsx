import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { InvestmentCard } from "@/components/investments/InvestmentCard";
import { TaxSummaryPanel } from "@/components/investments/TaxSummaryPanel";
import { ExportButtons } from "@/components/investments/ExportButtons";
import { PieChartCard } from "@/components/charts/FinancialCharts";
import { getPortfolioData } from "@/lib/data/investments";
import { calculatePortfolioMetrics, calculateInvestmentMetrics } from "@/lib/calculations/investments";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { Button } from "@/components/forms/FormFields";

export default async function InvestmentsPortfolioPage() {
  const {
    investments,
    transactionsByInvestment,
    distributionsByInvestment,
    taxItemsByInvestment,
    metalsByInvestment,
  } = await getPortfolioData();

  const portfolio = calculatePortfolioMetrics(
    investments,
    transactionsByInvestment,
    distributionsByInvestment,
    taxItemsByInvestment,
    metalsByInvestment
  );

  const investmentMetrics = investments.map((inv) => ({
    investment: inv,
    metrics: calculateInvestmentMetrics(
      inv,
      transactionsByInvestment[inv.id] ?? [],
      distributionsByInvestment[inv.id] ?? [],
      taxItemsByInvestment[inv.id] ?? [],
      metalsByInvestment[inv.id] ?? []
    ),
  }));

  const allocationData = portfolio.allocationByCategory.map((a) => ({
    name: a.name,
    value: a.value,
  }));

  return (
    <div>
      <PageHeader
        title="Investment Platform"
        description="Private investments, oil & gas, startups, precious metals — manual read-only tracking"
      >
        <Link href="/investments/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Investment
          </Button>
        </Link>
      </PageHeader>

      {investments.length === 0 ? (
        <EmptyState
          title="No investments yet"
          description="Track private equity, venture funds, oil & gas, startups, software investments, and precious metals. No brokerage APIs — manual entry only."
          action={
            <Link href="/investments/new">
              <Button>Add Investment</Button>
            </Link>
          }
        />
      ) : (
        <>
          {(["USD", "JPY"] as const).map((currency) =>
            portfolio.byCurrency[currency].investmentCount > 0 ? (
              <div key={currency} className="mb-8">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
                  {currency} Portfolio
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <MetricCard label="Portfolio Value" value={formatCurrency(portfolio.byCurrency[currency].totalValue, currency)} />
                  <MetricCard label="Invested Capital" value={formatCurrency(portfolio.byCurrency[currency].totalInvested, currency)} />
                  <MetricCard
                    label="Unrealized Gain"
                    value={formatCurrency(portfolio.byCurrency[currency].totalUnrealizedGain, currency)}
                    changeType={portfolio.byCurrency[currency].totalUnrealizedGain >= 0 ? "positive" : "negative"}
                  />
                  <MetricCard label="Avg ROI" value={formatPercent(portfolio.byCurrency[currency].avgRoi)} />
                </div>
              </div>
            ) : null
          )}

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {allocationData.length > 0 && (
              <DashboardCard title="Portfolio Allocation" description="By investment category">
                <PieChartCard data={allocationData} />
              </DashboardCard>
            )}

            <DashboardCard title="Investments" description={`${portfolio.totalInvestments} active positions`}>
              <div className="space-y-4">
                {investmentMetrics.map(({ investment, metrics }) => (
                  <InvestmentCard key={investment.id} investment={investment} metrics={metrics} />
                ))}
              </div>
            </DashboardCard>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <TaxSummaryPanel investments={investments} taxItemsByInvestment={taxItemsByInvestment} />
            <DashboardCard title="CPA Exports" description="Annual tax summary and comprehensive CSV">
              <ExportButtons />
            </DashboardCard>
          </div>
        </>
      )}
    </div>
  );
}
