'use client'

import { useEffect, useState } from 'react'
import { Printer, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import {
  assessFinancialHealth,
  buildAssetAllocation,
  buildLiabilitiesByCategory,
  calculateFinancialMetrics,
  formatCurrency,
  formatRatio,
  FinancialMetrics,
} from '@/lib/finance'
import { loadFinancialDataWithSnapshots } from '@/lib/data'
import { ensureDemoProfile } from '@/lib/profile'
import { formatSnapshotMonth } from '@/lib/snapshots'
import { Account, Asset, Expense, IncomeSource, Liability, MonthlySnapshot } from '@/lib/supabase'

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

export default function ReportPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [metrics, setMetrics] = useState<FinancialMetrics>(EMPTY_METRICS)
  const [healthStatus, setHealthStatus] = useState<'Strong' | 'Stable' | 'At Risk'>('Stable')
  const [snapshots, setSnapshots] = useState<MonthlySnapshot[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [liabilities, setLiabilities] = useState<Liability[]>([])
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [generatedAt, setGeneratedAt] = useState('')

  useEffect(() => {
    loadReport()
  }, [])

  const loadReport = async () => {
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

      setMetrics(calculated)
      setHealthStatus(assessFinancialHealth(calculated))
      setSnapshots(data.snapshots)
      setAccounts(data.accounts)
      setAssets(data.assets)
      setLiabilities(data.liabilities)
      setIncomeSources(data.incomeSources)
      setExpenses(data.expenses)
      setGeneratedAt(new Date().toLocaleString('en-US'))
    } catch (error) {
      console.error('Error loading report:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const assetAllocation = buildAssetAllocation(assets, accounts)
  const liabilitiesByCategory = buildLiabilitiesByCategory(liabilities, accounts)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-slate-500">Generating report...</p>
      </div>
    )
  }

  return (
    <div className="report-page min-h-screen bg-white text-slate-900">
      <div className="no-print bg-slate-900 border-b border-slate-800 px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-slate-300 hover:text-white flex items-center gap-2 text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <button
            onClick={() => window.print()}
            className="executive-button flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print / Save as PDF
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-10 space-y-10">
        <header className="border-b-2 border-slate-900 pb-6">
          <p className="text-sm uppercase tracking-widest text-slate-500">Casey Financial OS</p>
          <h1 className="text-4xl font-bold mt-2">Personal Financial Statement</h1>
          <p className="text-slate-600 mt-2">Generated {generatedAt}</p>
        </header>

        <section>
          <h2 className="text-xl font-bold uppercase tracking-wide border-b border-slate-300 pb-2 mb-4">
            Executive Summary
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <SummaryRow label="Net Worth" value={`$${formatCurrency(metrics.netWorth)}`} highlight />
            <SummaryRow label="Financial Health" value={healthStatus} />
            <SummaryRow label="Total Assets" value={`$${formatCurrency(metrics.totalAssets)}`} />
            <SummaryRow label="Total Liabilities" value={`$${formatCurrency(metrics.totalLiabilities)}`} />
            <SummaryRow label="Monthly Income" value={`$${formatCurrency(metrics.monthlyIncome)}`} />
            <SummaryRow label="Monthly Expenses" value={`$${formatCurrency(metrics.monthlyExpenses)}`} />
            <SummaryRow label="Monthly Cash Flow" value={`$${formatCurrency(metrics.monthlyCashFlow)}`} />
            <SummaryRow label="Liquid Assets" value={`$${formatCurrency(metrics.liquidAssets)}`} />
            <SummaryRow label="Debt-to-Asset Ratio" value={formatRatio(metrics.debtToAssetRatio, true)} />
            <SummaryRow label="Liquidity Ratio" value={formatRatio(metrics.liquidityRatio)} />
          </div>
        </section>

        {snapshots.length > 0 && (
          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide border-b border-slate-300 pb-2 mb-4">
              Net Worth History
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-300">
                  <th className="text-left py-2 font-semibold">Month</th>
                  <th className="text-right py-2 font-semibold">Net Worth</th>
                  <th className="text-right py-2 font-semibold">Cash Flow</th>
                </tr>
              </thead>
              <tbody>
                {snapshots.map((s) => (
                  <tr key={s.id} className="border-b border-slate-200">
                    <td className="py-2">{formatSnapshotMonth(s.snapshot_month)}</td>
                    <td className="py-2 text-right">${formatCurrency(Number(s.net_worth))}</td>
                    <td className="py-2 text-right">${formatCurrency(Number(s.monthly_cash_flow))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {assetAllocation.length > 0 && (
          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide border-b border-slate-300 pb-2 mb-4">
              Asset Allocation
            </h2>
            <ReportTable
              headers={['Category', 'Value', '% of Assets']}
              rows={assetAllocation.map((item) => [
                item.name,
                `$${formatCurrency(item.value)}`,
                metrics.totalAssets > 0
                  ? `${((item.value / metrics.totalAssets) * 100).toFixed(1)}%`
                  : '—',
              ])}
            />
          </section>
        )}

        {liabilitiesByCategory.length > 0 && (
          <section>
            <h2 className="text-xl font-bold uppercase tracking-wide border-b border-slate-300 pb-2 mb-4">
              Liabilities by Category
            </h2>
            <ReportTable
              headers={['Category', 'Balance', '% of Liabilities']}
              rows={liabilitiesByCategory.map((item) => [
                item.name,
                `$${formatCurrency(item.value)}`,
                metrics.totalLiabilities > 0
                  ? `${((item.value / metrics.totalLiabilities) * 100).toFixed(1)}%`
                  : '—',
              ])}
            />
          </section>
        )}

        <section>
          <h2 className="text-xl font-bold uppercase tracking-wide border-b border-slate-300 pb-2 mb-4">
            Account Register
          </h2>
          <ReportTable
            headers={['Account', 'Type', 'Balance']}
            rows={
              accounts.length
                ? accounts.map((a) => [a.name, a.account_type, `$${formatCurrency(Number(a.balance))}`])
                : [['No accounts recorded', '—', '—']]
            }
          />
        </section>

        <section>
          <h2 className="text-xl font-bold uppercase tracking-wide border-b border-slate-300 pb-2 mb-4">
            Income &amp; Expenses
          </h2>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-2">Income Sources</h3>
              <ReportTable
                headers={['Source', 'Amount', 'Frequency']}
                rows={
                  incomeSources.length
                    ? incomeSources.map((i) => [
                        i.name,
                        `$${formatCurrency(Number(i.amount))}`,
                        i.frequency,
                      ])
                    : [['No income recorded', '—', '—']]
                }
              />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Expenses</h3>
              <ReportTable
                headers={['Expense', 'Amount', 'Category']}
                rows={
                  expenses.length
                    ? expenses.map((e) => [
                        e.name,
                        `$${formatCurrency(Number(e.amount))}`,
                        e.category,
                      ])
                    : [['No expenses recorded', '—', '—']]
                }
              />
            </div>
          </div>
        </section>

        <footer className="border-t border-slate-300 pt-6 text-sm text-slate-500">
          <p>
            This report is generated from manually entered data in Casey Financial OS.
            It does not include bank sync or tax calculations.
          </p>
        </footer>
      </div>
    </div>
  )
}

function SummaryRow({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`text-lg font-semibold mt-1 ${highlight ? 'text-2xl font-bold' : ''}`}>{value}</p>
    </div>
  )
}

function ReportTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-300">
          {headers.map((h) => (
            <th key={h} className="text-left py-2 font-semibold">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-slate-200">
            {row.map((cell, j) => (
              <td key={j} className={`py-2 ${j > 0 ? 'text-right' : ''}`}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
