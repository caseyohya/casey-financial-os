'use client'

import { TrendingUp, TrendingDown, DollarSign, PieChart, ArrowUpRight, ArrowDownLeft } from 'lucide-react'

interface MetricsGridProps {
  netWorth: number
  totalAssets: number
  totalLiabilities: number
  monthlyIncome: number
  monthlyExpenses: number
  isLoading?: boolean
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export default function MetricsGrid({
  netWorth,
  totalAssets,
  totalLiabilities,
  monthlyIncome,
  monthlyExpenses,
  isLoading = false,
}: MetricsGridProps) {
  const monthlyCashFlow = monthlyIncome - monthlyExpenses
  const cashFlowPositive = monthlyCashFlow >= 0

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="metric-card h-32 animate-pulse bg-slate-800" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Net Worth */}
      <div className="metric-card">
        <div className="flex items-start justify-between">
          <div>
            <p className="metric-label">Net Worth</p>
            <p className="metric-value" style={{ color: netWorth >= 0 ? '#10b981' : '#ef4444' }}>
              {formatCurrency(netWorth)}
            </p>
          </div>
          <PieChart className="w-8 h-8 text-slate-600" />
        </div>
      </div>

      {/* Total Assets */}
      <div className="metric-card">
        <div className="flex items-start justify-between">
          <div>
            <p className="metric-label">Total Assets</p>
            <p className="metric-value text-executive-success">
              {formatCurrency(totalAssets)}
            </p>
          </div>
          <TrendingUp className="w-8 h-8 text-executive-success" />
        </div>
      </div>

      {/* Total Liabilities */}
      <div className="metric-card">
        <div className="flex items-start justify-between">
          <div>
            <p className="metric-label">Total Liabilities</p>
            <p className="metric-value text-executive-danger">
              {formatCurrency(totalLiabilities)}
            </p>
          </div>
          <TrendingDown className="w-8 h-8 text-executive-danger" />
        </div>
      </div>

      {/* Monthly Income */}
      <div className="metric-card">
        <div className="flex items-start justify-between">
          <div>
            <p className="metric-label">Monthly Income</p>
            <p className="metric-value text-executive-success">
              {formatCurrency(monthlyIncome)}
            </p>
          </div>
          <ArrowDownLeft className="w-8 h-8 text-executive-success" />
        </div>
      </div>

      {/* Monthly Expenses */}
      <div className="metric-card">
        <div className="flex items-start justify-between">
          <div>
            <p className="metric-label">Monthly Expenses</p>
            <p className="metric-value text-executive-warning">
              {formatCurrency(monthlyExpenses)}
            </p>
          </div>
          <ArrowUpRight className="w-8 h-8 text-executive-warning" />
        </div>
      </div>
    </div>
  )
}
