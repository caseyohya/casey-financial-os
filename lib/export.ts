import { Account, Asset, Expense, IncomeSource, Liability } from '@/lib/supabase'
import { FinancialMetrics, formatCurrency, formatRatio } from '@/lib/finance'

export interface FinancialDataExport {
  accounts: Account[]
  assets: Asset[]
  liabilities: Liability[]
  incomeSources: IncomeSource[]
  expenses: Expense[]
}

function escapeCsvValue(value: string | number | null | undefined): string {
  const str = value == null ? '' : String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function rowsToCsv(rows: (string | number | null | undefined)[][]): string {
  return rows.map((row) => row.map(escapeCsvValue).join(',')).join('\n')
}

function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function exportSummaryCsv(metrics: FinancialMetrics): void {
  const rows = [
    ['Metric', 'Value'],
    ['Total Assets', formatCurrency(metrics.totalAssets)],
    ['Total Liabilities', formatCurrency(metrics.totalLiabilities)],
    ['Net Worth', formatCurrency(metrics.netWorth)],
    ['Monthly Income', formatCurrency(metrics.monthlyIncome)],
    ['Monthly Expenses', formatCurrency(metrics.monthlyExpenses)],
    ['Monthly Cash Flow', formatCurrency(metrics.monthlyCashFlow)],
    ['Debt-to-Asset Ratio', formatRatio(metrics.debtToAssetRatio, true)],
    ['Liquidity Ratio', formatRatio(metrics.liquidityRatio)],
    ['Liquid Assets', formatCurrency(metrics.liquidAssets)],
    ['Exported At', new Date().toISOString()],
  ]

  downloadCsv(`financial-summary-${getDateStamp()}.csv`, rowsToCsv(rows))
}

export function exportAllDataCsv(data: FinancialDataExport): void {
  const sections: string[] = []

  sections.push('ACCOUNTS')
  sections.push(
    rowsToCsv([
      ['Name', 'Type', 'Balance', 'Created At'],
      ...data.accounts.map((a) => [a.name, a.account_type, a.balance, a.created_at]),
    ])
  )

  sections.push('\nASSETS')
  sections.push(
    rowsToCsv([
      ['Name', 'Type', 'Value', 'Created At'],
      ...data.assets.map((a) => [a.name, a.asset_type, a.value, a.created_at]),
    ])
  )

  sections.push('\nLIABILITIES')
  sections.push(
    rowsToCsv([
      ['Name', 'Type', 'Balance', 'Interest Rate', 'Created At'],
      ...data.liabilities.map((l) => [
        l.name,
        l.liability_type,
        l.balance,
        l.interest_rate ?? '',
        l.created_at,
      ]),
    ])
  )

  sections.push('\nINCOME SOURCES')
  sections.push(
    rowsToCsv([
      ['Name', 'Amount', 'Frequency', 'Created At'],
      ...data.incomeSources.map((i) => [i.name, i.amount, i.frequency, i.created_at]),
    ])
  )

  sections.push('\nEXPENSES')
  sections.push(
    rowsToCsv([
      ['Name', 'Category', 'Amount', 'Frequency', 'Created At'],
      ...data.expenses.map((e) => [e.name, e.category, e.amount, e.frequency, e.created_at]),
    ])
  )

  downloadCsv(`financial-data-${getDateStamp()}.csv`, sections.join('\n'))
}

function getDateStamp(): string {
  return new Date().toISOString().slice(0, 10)
}
