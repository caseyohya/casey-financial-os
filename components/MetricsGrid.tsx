'use client'

import {
  TrendingUp,
  TrendingDown,
  PieChart,
  ArrowUpRight,
  ArrowDownLeft,
  Activity,
  Scale,
  Droplets,
} from 'lucide-react'
import { formatCurrencyCompact, formatRatio } from '@/lib/finance'

interface MetricsGridProps {
  netWorth: number
  totalAssets: number
  totalLiabilities: number
  monthlyIncome: number
  monthlyExpenses: number
  monthlyCashFlow: number
  debtToAssetRatio: number | null
  liquidityRatio: number | null
  isLoading?: boolean
}

interface KpiCardProps {
  label: string
  value: string
  valueClass?: string
  icon: React.ReactNode
}

function KpiCard({ label, value, valueClass = 'text-executive-accent', icon }: KpiCardProps) {
  return (
    <div className="metric-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="metric-label">{label}</p>
          <p className={`metric-value text-3xl ${valueClass}`}>{value}</p>
        </div>
        {icon}
      </div>
    </div>
  )
}

export default function MetricsGrid({
  netWorth,
  totalAssets,
  totalLiabilities,
  monthlyIncome,
  monthlyExpenses,
  monthlyCashFlow,
  debtToAssetRatio,
  liquidityRatio,
  isLoading = false,
}: MetricsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="metric-card h-28 animate-pulse bg-slate-800" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        label="Net Worth"
        value={formatCurrencyCompact(netWorth)}
        valueClass={netWorth >= 0 ? 'text-executive-success' : 'text-executive-danger'}
        icon={<PieChart className="w-7 h-7 text-slate-600" />}
      />
      <KpiCard
        label="Total Assets"
        value={formatCurrencyCompact(totalAssets)}
        valueClass="text-executive-success"
        icon={<TrendingUp className="w-7 h-7 text-executive-success" />}
      />
      <KpiCard
        label="Total Liabilities"
        value={formatCurrencyCompact(totalLiabilities)}
        valueClass="text-executive-danger"
        icon={<TrendingDown className="w-7 h-7 text-executive-danger" />}
      />
      <KpiCard
        label="Monthly Income"
        value={formatCurrencyCompact(monthlyIncome)}
        valueClass="text-executive-success"
        icon={<ArrowDownLeft className="w-7 h-7 text-executive-success" />}
      />
      <KpiCard
        label="Monthly Expenses"
        value={formatCurrencyCompact(monthlyExpenses)}
        valueClass="text-executive-warning"
        icon={<ArrowUpRight className="w-7 h-7 text-executive-warning" />}
      />
      <KpiCard
        label="Monthly Cash Flow"
        value={formatCurrencyCompact(monthlyCashFlow)}
        valueClass={monthlyCashFlow >= 0 ? 'text-executive-success' : 'text-executive-danger'}
        icon={<Activity className="w-7 h-7 text-slate-600" />}
      />
      <KpiCard
        label="Debt-to-Asset Ratio"
        value={formatRatio(debtToAssetRatio, true)}
        valueClass={
          debtToAssetRatio !== null && debtToAssetRatio < 0.5
            ? 'text-executive-success'
            : 'text-executive-warning'
        }
        icon={<Scale className="w-7 h-7 text-slate-600" />}
      />
      <KpiCard
        label="Liquidity Ratio"
        value={formatRatio(liquidityRatio)}
        valueClass={
          liquidityRatio !== null && liquidityRatio >= 1
            ? 'text-executive-success'
            : 'text-executive-warning'
        }
        icon={<Droplets className="w-7 h-7 text-slate-600" />}
      />
    </div>
  )
}
