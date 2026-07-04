import { buildAnnualTaxSummary } from "@/lib/calculations/investments";
import type { Investment, InvestmentTaxItem } from "@/lib/types/investments";
import { formatCurrency } from "@/lib/utils";
import { DashboardCard } from "@/components/dashboard/DashboardCard";

interface TaxSummaryPanelProps {
  investments: Investment[];
  taxItemsByInvestment: Record<string, InvestmentTaxItem[]>;
  year?: number;
}

export function TaxSummaryPanel({ investments, taxItemsByInvestment, year }: TaxSummaryPanelProps) {
  const taxYear = year ?? new Date().getFullYear();
  const summary = buildAnnualTaxSummary(investments, taxItemsByInvestment, taxYear);

  if (summary.length === 0) {
    return (
      <DashboardCard title={`${taxYear} Tax Summary`} description="K-1 items across all investments">
        <p className="text-sm text-slate-500">No tax items recorded for {taxYear}. Add K-1 items on individual investment pages.</p>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title={`${taxYear} Investment Tax Summary`} description="Manual K-1 tracking — not automated filing">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-700 text-left text-xs text-slate-500">
              <th className="pb-2 pr-4">Investment</th>
              <th className="pb-2 pr-4">Ordinary</th>
              <th className="pb-2 pr-4">Cap Gain</th>
              <th className="pb-2 pr-4">Cap Loss</th>
              <th className="pb-2 pr-4">IDC</th>
              <th className="pb-2">Net</th>
            </tr>
          </thead>
          <tbody>
            {summary.map((row) => (
              <tr key={row.investmentName} className="border-b border-navy-800">
                <td className="py-2 pr-4 text-white">{row.investmentName}</td>
                <td className="py-2 pr-4 text-slate-300">{formatCurrency(row.ordinaryIncome)}</td>
                <td className="py-2 pr-4 text-emerald-400">{formatCurrency(row.capitalGain)}</td>
                <td className="py-2 pr-4 text-red-400">{formatCurrency(row.capitalLoss)}</td>
                <td className="py-2 pr-4 text-slate-300">{formatCurrency(row.idcDeduction)}</td>
                <td className="py-2 font-medium text-white">{formatCurrency(row.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardCard>
  );
}
