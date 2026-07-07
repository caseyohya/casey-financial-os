import type { ExecutiveKPIs } from "@/lib/types/executive";
import { cn } from "@/lib/utils";

interface FinancialHealthScoreProps {
  kpis: ExecutiveKPIs;
}

function ScoreRing({ score, label }: { score: number; label: string }) {
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "#10b981" : score >= 40 ? "#d4a853" : "#ef4444";

  return (
    <div className="flex flex-col items-center">
      <svg width="100" height="100" className="-rotate-90">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#243044" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="-mt-14 text-xl font-semibold text-white">{score}</span>
      <span className="mt-8 text-xs text-slate-400">{label}</span>
    </div>
  );
}

export function FinancialHealthScore({ kpis }: FinancialHealthScoreProps) {
  const factors = [
    { label: "Cash Flow", score: kpis.monthlyCashFlow >= 0 ? 85 : 35 },
    { label: "Liquidity", score: Math.min(kpis.liquidityRatio * 15, 100) },
    { label: "Debt Mgmt", score: Math.max(0, 100 - kpis.debtRatio) },
    { label: "Passive Inc", score: Math.min(kpis.passiveIncomeProgress, 100) },
  ];

  return (
    <div className="rounded-xl border border-navy-700 bg-navy-900 p-5">
      <h3 className="text-sm font-semibold text-white">Monthly Financial Health</h3>
      <p className="mt-0.5 text-xs text-slate-400">Composite score from key ratios</p>

      <div className="mt-6 flex flex-wrap items-center justify-around gap-6">
        <ScoreRing score={kpis.healthScore} label="Overall" />
        {factors.map((f) => (
          <div key={f.label} className="text-center">
            <p className={cn(
              "text-lg font-semibold",
              f.score >= 70 ? "text-emerald-400" : f.score >= 40 ? "text-gold-400" : "text-red-400"
            )}>
              {Math.round(f.score)}
            </p>
            <p className="text-xs text-slate-500">{f.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
