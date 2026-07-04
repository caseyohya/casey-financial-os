'use client'

import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { MonthlySnapshot } from '@/lib/supabase'
import { CHART_COLORS } from '@/lib/constants'
import { ChartDataPoint, formatCurrencyCompact } from '@/lib/finance'
import { formatSnapshotMonth } from '@/lib/snapshots'

interface DashboardChartsProps {
  snapshots: MonthlySnapshot[]
  assetAllocation: ChartDataPoint[]
  incomeVsExpense: ChartDataPoint[]
  liabilitiesByCategory: ChartDataPoint[]
  isLoading?: boolean
}

function ChartShell({
  title,
  children,
  isLoading,
  emptyMessage,
  hasData,
}: {
  title: string
  children: React.ReactNode
  isLoading?: boolean
  emptyMessage: string
  hasData: boolean
}) {
  return (
    <div className="executive-card p-6">
      <h3 className="text-lg font-semibold text-slate-100 mb-4">{title}</h3>
      {isLoading ? (
        <div className="h-64 animate-pulse bg-slate-800 rounded" />
      ) : !hasData ? (
        <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
          {emptyMessage}
        </div>
      ) : (
        <div className="h-64">{children}</div>
      )}
    </div>
  )
}

function CurrencyTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { value: number; name: string; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm">
      {label && <p className="text-slate-400 mb-1">{label}</p>}
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {formatCurrencyCompact(entry.value)}
        </p>
      ))}
    </div>
  )
}

export default function DashboardCharts({
  snapshots,
  assetAllocation,
  incomeVsExpense,
  liabilitiesByCategory,
  isLoading,
}: DashboardChartsProps) {
  const netWorthTrend = snapshots.map((s) => ({
    month: formatSnapshotMonth(s.snapshot_month),
    netWorth: Number(s.net_worth),
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartShell
        title="Net Worth Trend"
        isLoading={isLoading}
        hasData={netWorthTrend.length > 0}
        emptyMessage="Snapshot history will appear after your first dashboard visit."
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={netWorthTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CurrencyTooltip />} />
            <Line
              type="monotone"
              dataKey="netWorth"
              name="Net Worth"
              stroke="#0ea5e9"
              strokeWidth={2}
              dot={{ fill: '#0ea5e9' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartShell>

      <ChartShell
        title="Asset Allocation"
        isLoading={isLoading}
        hasData={assetAllocation.length > 0}
        emptyMessage="Add assets or accounts to see allocation."
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={assetAllocation}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {assetAllocation.map((_, index) => (
                <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrencyCompact(Number(value ?? 0))} />
          </PieChart>
        </ResponsiveContainer>
      </ChartShell>

      <ChartShell
        title="Income vs Expense"
        isLoading={isLoading}
        hasData={incomeVsExpense.some((d) => d.value > 0)}
        emptyMessage="Add income and expense entries to compare monthly totals."
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={incomeVsExpense}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CurrencyTooltip />} />
            <Bar dataKey="value" name="Amount" radius={[4, 4, 0, 0]}>
              {incomeVsExpense.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={entry.name === 'Income' ? '#10b981' : '#f59e0b'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartShell>

      <ChartShell
        title="Liabilities by Category"
        isLoading={isLoading}
        hasData={liabilitiesByCategory.length > 0}
        emptyMessage="Add liabilities or credit card accounts to see breakdown."
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={liabilitiesByCategory} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis type="number" stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} width={120} />
            <Tooltip formatter={(value) => formatCurrencyCompact(Number(value ?? 0))} />
            <Bar dataKey="value" name="Balance" radius={[0, 4, 4, 0]}>
              {liabilitiesByCategory.map((_, index) => (
                <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartShell>
    </div>
  )
}
