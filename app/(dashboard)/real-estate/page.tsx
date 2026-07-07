import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { PropertyCard } from "@/components/real-estate/PropertyCard";
import { ExportButtons } from "@/components/real-estate/ExportButtons";
import { BarChartCard } from "@/components/charts/FinancialCharts";
import { getPortfolioData } from "@/lib/data/real-estate";
import { calculatePortfolioMetrics, calculatePropertyMetrics } from "@/lib/calculations/real-estate";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { Button } from "@/components/forms/FormFields";

export default async function RealEstatePortfolioPage() {
  const { properties, mortgagesByProperty, incomeByProperty, expensesByProperty } =
    await getPortfolioData();

  const portfolio = calculatePortfolioMetrics(
    properties,
    mortgagesByProperty,
    incomeByProperty,
    expensesByProperty
  );

  const propertyMetrics = properties.map((p) => ({
    property: p,
    metrics: calculatePropertyMetrics(
      p,
      mortgagesByProperty[p.id] ?? [],
      incomeByProperty[p.id] ?? [],
      expensesByProperty[p.id] ?? []
    ),
  }));

  const chartData = properties.map((p) => ({
    name: p.name.length > 12 ? `${p.name.slice(0, 12)}…` : p.name,
    value: p.current_value,
  }));

  return (
    <div>
      <PageHeader
        title="Real Estate Platform"
        description="U.S. and Japan rental property tracking, income, expenses, and CPA-ready reporting"
      >
        <Link href="/real-estate/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Button>
        </Link>
      </PageHeader>

      {properties.length === 0 ? (
        <EmptyState
          title="No properties yet"
          description="Add your first U.S. or Japan rental property to start tracking income, expenses, equity, and generate CPA-ready reports."
          action={
            <Link href="/real-estate/new">
              <Button>Add Property</Button>
            </Link>
          }
        />
      ) : (
        <>
          {/* USD Portfolio */}
          {portfolio.byCurrency.USD.propertyCount > 0 && (
            <div className="mb-8">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
                USD Portfolio
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  label="Portfolio Value"
                  value={formatCurrency(portfolio.byCurrency.USD.totalValue, "USD")}
                />
                <MetricCard
                  label="Total Equity"
                  value={formatCurrency(portfolio.byCurrency.USD.totalEquity, "USD")}
                />
                <MetricCard
                  label="Monthly Cash Flow"
                  value={formatCurrency(portfolio.byCurrency.USD.totalMonthlyCashFlow, "USD")}
                  changeType={portfolio.byCurrency.USD.totalMonthlyCashFlow >= 0 ? "positive" : "negative"}
                />
                <MetricCard
                  label="Avg Cap Rate"
                  value={formatPercent(portfolio.byCurrency.USD.avgCapRate)}
                />
              </div>
            </div>
          )}

          {/* JPY Portfolio */}
          {portfolio.byCurrency.JPY.propertyCount > 0 && (
            <div className="mb-8">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
                JPY Portfolio
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  label="Portfolio Value"
                  value={formatCurrency(portfolio.byCurrency.JPY.totalValue, "JPY")}
                />
                <MetricCard
                  label="Total Equity"
                  value={formatCurrency(portfolio.byCurrency.JPY.totalEquity, "JPY")}
                />
                <MetricCard
                  label="Monthly Cash Flow"
                  value={formatCurrency(portfolio.byCurrency.JPY.totalMonthlyCashFlow, "JPY")}
                  changeType={portfolio.byCurrency.JPY.totalMonthlyCashFlow >= 0 ? "positive" : "negative"}
                />
                <MetricCard
                  label="Avg Cap Rate"
                  value={formatPercent(portfolio.byCurrency.JPY.avgCapRate)}
                />
              </div>
            </div>
          )}

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <DashboardCard title="Properties" description={`${portfolio.totalProperties} active properties`}>
              <div className="space-y-4">
                {propertyMetrics.map(({ property, metrics }) => (
                  <PropertyCard key={property.id} property={property} metrics={metrics} />
                ))}
              </div>
            </DashboardCard>

            {chartData.length > 0 && (
              <DashboardCard title="Value by Property" description="Current market values">
                <BarChartCard data={chartData} />
              </DashboardCard>
            )}
          </div>

          <div className="mt-8">
            <DashboardCard title="CPA Exports" description="Schedule E-style and comprehensive CSV reports">
              <ExportButtons />
            </DashboardCard>
          </div>
        </>
      )}
    </div>
  );
}
