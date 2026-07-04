'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Header from '@/components/Header'
import MetricsGrid from '@/components/MetricsGrid'
import { loadFinancialData } from '@/lib/data'
import { calculateFinancialMetrics } from '@/lib/finance'
import { ensureDemoProfile } from '@/lib/profile'
import { NAV_ITEMS } from '@/lib/constants'

const DATA_PAGES = NAV_ITEMS.filter((item) => item.href !== '/')

export default function Dashboard() {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const [metrics, setMetrics] = useState({
    totalAssets: 0,
    totalLiabilities: 0,
    netWorth: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
  })

  useEffect(() => {
    loadDashboardData()
  }, [pathname])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      await ensureDemoProfile()
      const data = await loadFinancialData()
      setMetrics(calculateFinancialMetrics(
        data.assets,
        data.liabilities,
        data.incomeSources,
        data.expenses,
        data.accounts
      ))
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-executive-darker">
      <Header />

      <main className="p-8 max-w-7xl mx-auto space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-2 text-slate-100">Financial Overview</h2>
          <p className="text-slate-400 mb-6">
            Metrics update automatically from your manual entries across all data pages.
          </p>
          <MetricsGrid
            netWorth={metrics.netWorth}
            totalAssets={metrics.totalAssets}
            totalLiabilities={metrics.totalLiabilities}
            monthlyIncome={metrics.monthlyIncome}
            monthlyExpenses={metrics.monthlyExpenses}
            isLoading={isLoading}
          />
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
