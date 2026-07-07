import type { ExecutiveKPIs } from "@/lib/types/executive";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { formatCurrency, formatPercent } from "@/lib/utils";

interface ExecutiveKPIGridProps {
  kpis: ExecutiveKPIs;
}

export function ExecutiveKPIGrid({ kpis }: ExecutiveKPIGridProps) {
  const c = kpis.currency;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
          Financial Position
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          <MetricCard label="Net Worth" value={formatCurrency(kpis.netWorth, c)} changeType="neutral" />
          <MetricCard label="Total Assets" value={formatCurrency(kpis.totalAssets, c)} changeType="neutral" />
          <MetricCard label="Total Liabilities" value={formatCurrency(kpis.totalLiabilities, c)} changeType="neutral" />
          <MetricCard label="Cash Position" value={formatCurrency(kpis.cashPosition, c)} changeType="neutral" />
          <MetricCard label="Debt Ratio" value={formatPercent(kpis.debtRatio)} changeType={kpis.debtRatio > 40 ? "negative" : "positive"} />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
          Cash Flow
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Monthly Income" value={formatCurrency(kpis.monthlyIncome, c)} changeType="positive" />
          <MetricCard label="Monthly Expenses" value={formatCurrency(kpis.monthlyExpenses, c)} changeType="neutral" />
          <MetricCard
            label="Monthly Cash Flow"
            value={formatCurrency(kpis.monthlyCashFlow, c)}
            changeType={kpis.monthlyCashFlow >= 0 ? "positive" : "negative"}
          />
          <MetricCard label="Liquidity Ratio" value={`${kpis.liquidityRatio.toFixed(1)} mo`} changeType="neutral" />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
          Performance
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Passive Income" value={formatCurrency(kpis.passiveIncome, c)} changeType="positive" />
          <MetricCard label="Real Estate NOI" value={formatCurrency(kpis.realEstateNOI, c)} changeType="neutral" />
          <MetricCard label="Investment Value" value={formatCurrency(kpis.investmentValue, c)} changeType="neutral" />
          <MetricCard label="Avg Investment ROI" value={formatPercent(kpis.investmentROI)} changeType="positive" />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
          Tax & Independence
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard label="Est. Tax" value={formatCurrency(kpis.estimatedTax, c)} change={`${kpis.effectiveTaxRate}% effective`} changeType="neutral" />
          <MetricCard label="FI Score" value={`${kpis.fiScore}/100`} changeType={kpis.fiScore >= 70 ? "positive" : "neutral"} />
          <MetricCard label="Health Score" value={`${kpis.healthScore}/100`} changeType={kpis.healthScore >= 70 ? "positive" : "neutral"} />
        </div>
      </div>
    </div>
  );
}
