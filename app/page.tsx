'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText } from 'lucide-react'
import Header from '@/components/Header'
import MetricsGrid from '@/components/MetricsGrid'
import FinancialHealthCard from '@/components/FinancialHealthCard'
import DashboardCharts from '@/components/DashboardCharts'
import ExportActions from '@/components/ExportActions'
import { loadFinancialDataWithSnapshots } from '@/lib/data'
import {
  assessFinancialHealth,
  buildAssetAllocation,
  buildIncomeVsExpense,
  buildLiabilitiesByCategory,
  calculateFinancialMetrics,
  FinancialMetrics,
} from '@/lib/finance'
import { ensureDemoProfile } from '@/lib/profile'
import { upsertMonthlySnapshot } from '@/lib/snapshots'
import { NAV_ITEMS } from '@/lib/constants'
import { Account, Asset, Expense, IncomeSource, Liability, MonthlySnapshot } from '@/lib/supabase'

const DATA_PAGES = NAV_ITEMS.filter((item) => !['/', '/report'].includes(item.href))

const EMPTY_METRICS: FinancialMetrics = {
  totalAssets: 0,
  totalLiabilities: 0,
  netWorth: 0,
  monthlyIncome: 0,
  monthlyExpenses: 0,
  monthlyCashFlow: 0,
  debtToAssetRatio: null,
  liquidityRatio: null,
  liquidAssets: 0,
}

export default function Dashboard() {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const [metrics, setMetrics] = useState<FinancialMetrics>(EMPTY_METRICS)
  const [healthStatus, setHealthStatus] = useState<'Strong' | 'Stable' | 'At Risk'>('Stable')
  const [snapshots, setSnapshots] = useState<MonthlySnapshot[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [liabilities, setLiabilities] = useState<Liability[]>([])
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [pathname])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      await ensureDemoProfile()
      const data = await loadFinancialDataWithSnapshots()

      const calculated = calculateFinancialMetrics(
        data.assets,
        data.liabilities,
        data.incomeSources,
        data.expenses,
        data.accounts
      )

      try {
        await upsertMonthlySnapshot(calculated)
        const refreshed = await loadFinancialDataWithSnapshots()
        setSnapshots(refreshed.snapshots)
      } catch (snapshotError) {
        console.error('Error saving monthly snapshot:', snapshotError)
        setSnapshots(data.snapshots)
      }

      setMetrics(calculated)
      setHealthStatus(assessFinancialHealth(calculated))
      setAccounts(data.accounts)
      setAssets(data.assets)
      setLiabilities(data.liabilities)
      setIncomeSources(data.incomeSources)
      setExpenses(data.expenses)
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const assetAllocation = buildAssetAllocation(assets, accounts)
  const incomeVsExpense = buildIncomeVsExpense(metrics)
  const liabilitiesByCategory = buildLiabilitiesByCategory(liabilities, accounts)

  return (
    <div className="min-h-screen bg-executive-darker">
      <Header />

      <main className="p-8 max-w-7xl mx-auto space-y-8">
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-100">Financial Overview</h2>
              <p className="text-slate-400 mt-1">
                Master financial statement — metrics update from your manual entries.
              </p>
            </div>
            <Link href="/report" className="executive-button-secondary flex items-center gap-2 w-fit">
              <FileText className="w-4 h-4" />
              View Summary Report
            </Link>
          </div>

          <div className="space-y-4">
            <MetricsGrid
              netWorth={metrics.netWorth}
              totalAssets={metrics.totalAssets}
              totalLiabilities={metrics.totalLiabilities}
              monthlyIncome={metrics.monthlyIncome}
              monthlyExpenses={metrics.monthlyExpenses}
              monthlyCashFlow={metrics.monthlyCashFlow}
              debtToAssetRatio={metrics.debtToAssetRatio}
              liquidityRatio={metrics.liquidityRatio}
              isLoading={isLoading}
            />
            <FinancialHealthCard status={healthStatus} isLoading={isLoading} />
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-6 text-slate-100">Analytics</h2>
          <DashboardCharts
            snapshots={snapshots}
            assetAllocation={assetAllocation}
            incomeVsExpense={incomeVsExpense}
            liabilitiesByCategory={liabilitiesByCategory}
            isLoading={isLoading}
          />
        </section>

        <section className="executive-card p-8">
          <h2 className="text-2xl font-bold mb-2 text-slate-100">Export</h2>
          <p className="text-slate-400 mb-4">
            Download your financial summary or full data for offline analysis.
          </p>
          {!isLoading && (
            <ExportActions
              metrics={metrics}
              data={{ accounts, assets, liabilities, incomeSources, expenses }}
            />
          )}
        </section>

        <section className="executive-card p-8">
          <h2 className="text-2xl font-bold mb-2 text-slate-100">Manage Financial Data</h2>
          <p className="text-slate-400 mb-6">
            Add, edit, or remove entries on each page. Changes are reflected here on your next visit.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DATA_PAGES.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="executive-card p-6 hover:border-executive-accent transition-colors"
              >
                <h3 className="text-lg font-semibold text-slate-100">{item.label}</h3>
                <p className="text-sm text-slate-400 mt-2">
                  List, add, edit, and delete {item.label.toLowerCase()} records
                </p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
