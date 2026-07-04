import type { PropertyMetrics } from "@/lib/types/real-estate";
import type { PropertyCurrency } from "@/lib/types/real-estate";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { formatCurrency, formatPercent } from "@/lib/utils";

interface PropertyMetricsGridProps {
  metrics: PropertyMetrics;
  currency: PropertyCurrency;
}

export function PropertyMetricsGrid({ metrics, currency }: PropertyMetricsGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        label="Equity"
        value={formatCurrency(metrics.equity, currency)}
      />
      <MetricCard
        label="Loan-to-Value"
        value={formatPercent(metrics.loanToValue)}
        changeType="neutral"
      />
      <MetricCard
        label="Net Operating Income"
        value={formatCurrency(metrics.monthlyNOI, currency)}
        change="monthly"
        changeType="neutral"
      />
      <MetricCard
        label="Cash Flow"
        value={formatCurrency(metrics.monthlyCashFlow, currency)}
        change="monthly"
        changeType={metrics.monthlyCashFlow >= 0 ? "positive" : "negative"}
      />
      <MetricCard
        label="Cap Rate"
        value={formatPercent(metrics.capRate)}
        changeType="neutral"
      />
      <MetricCard
        label="Cash-on-Cash Return"
        value={formatPercent(metrics.cashOnCashReturn)}
        change="annual"
        changeType="neutral"
      />
      <MetricCard
        label="DSCR"
        value={metrics.debtServiceCoverageRatio === Infinity ? "N/A" : metrics.debtServiceCoverageRatio.toFixed(2)}
        changeType="neutral"
      />
      <MetricCard
        label="Annual Depreciation"
        value={formatCurrency(metrics.annualDepreciation, currency)}
        changeType="neutral"
      />
    </div>
  );
}
