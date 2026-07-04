import type { ExecutiveKPIs } from "@/lib/types/executive";
import { formatCurrency } from "@/lib/utils";

interface PassiveIncomeProgressProps {
  kpis: ExecutiveKPIs;
}

export function PassiveIncomeProgress({ kpis }: PassiveIncomeProgressProps) {
  const progress = Math.min(kpis.passiveIncomeProgress, 100);

  return (
    <div className="rounded-xl border border-navy-700 bg-navy-900 p-5">
      <div className="flex items-baseline justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Passive Income Progress</h3>
          <p className="mt-0.5 text-xs text-slate-400">Target: $5,000/month</p>
        </div>
        <span className="text-2xl font-semibold text-gold-400">{progress.toFixed(0)}%</span>
      </div>
      <div className="mt-4 h-3 rounded-full bg-navy-700">
        <div
          className="h-3 rounded-full bg-gradient-to-r from-gold-600 to-gold-400 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-3 flex justify-between text-xs text-slate-400">
        <span>{formatCurrency(kpis.passiveIncome, kpis.currency)} / mo</span>
        <span>{formatCurrency(kpis.passiveIncomeTarget, kpis.currency)} goal</span>
      </div>
    </div>
  );
}
