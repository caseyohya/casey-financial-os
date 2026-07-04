import type { InvestmentMetrics, InvestmentCurrency } from "@/lib/types/investments";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { formatCurrency, formatPercent } from "@/lib/utils";

interface InvestmentMetricsGridProps {
  metrics: InvestmentMetrics;
  currency: InvestmentCurrency;
}

export function InvestmentMetricsGrid({ metrics, currency }: InvestmentMetricsGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard label="ROI" value={formatPercent(metrics.roi)} changeType={metrics.roi >= 0 ? "positive" : "negative"} />
      <MetricCard
        label="IRR (Estimate)"
        value={metrics.irrPlaceholder !== null ? formatPercent(metrics.irrPlaceholder) : "N/A"}
        changeType="neutral"
      />
      <MetricCard label="Cash Yield" value={formatPercent(metrics.cashYield)} changeType="neutral" />
      <MetricCard label="Total Distributions" value={formatCurrency(metrics.totalDistributions, currency)} />
      <MetricCard
        label="Unrealized G/L"
        value={formatCurrency(metrics.unrealizedGainLoss, currency)}
        changeType={metrics.unrealizedGainLoss >= 0 ? "positive" : "negative"}
      />
      <MetricCard
        label="Realized G/L"
        value={formatCurrency(metrics.realizedGainLoss, currency)}
        changeType={metrics.realizedGainLoss >= 0 ? "positive" : "negative"}
      />
      <MetricCard label="Remaining Basis" value={formatCurrency(metrics.remainingBasis, currency)} changeType="neutral" />
      <MetricCard label="Tax Basis" value={formatCurrency(metrics.taxBasis, currency)} changeType="neutral" />
    </div>
  );
}
