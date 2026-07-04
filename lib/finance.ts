import { Account, Asset, Expense, IncomeSource, Liability } from '@/lib/supabase'

export interface FinancialMetrics {
  totalAssets: number
  totalLiabilities: number
  netWorth: number
  monthlyIncome: number
  monthlyExpenses: number
  monthlyCashFlow: number
  debtToAssetRatio: number | null
  liquidityRatio: number | null
  liquidAssets: number
}

export type FinancialHealthStatus = 'Strong' | 'Stable' | 'At Risk'

const LIQUID_ACCOUNT_TYPES = new Set(['Checking', 'Savings', 'Money Market'])
const LIQUID_ASSET_TYPES = new Set(['Cash', 'Savings Account'])

export function normalizeToMonthly(amount: number, frequency: string): number {
  switch (frequency) {
    case 'Monthly':
      return amount
    case 'Bi-weekly':
      return (amount * 26) / 12
    case 'Weekly':
      return (amount * 52) / 12
    case 'Yearly':
      return amount / 12
    default:
      return 0
  }
}

export function calculateLiquidAssets(assets: Asset[], accounts: Account[]): number {
  const liquidAssetTotal = assets
    .filter((asset) => LIQUID_ASSET_TYPES.has(asset.asset_type))
    .reduce((sum, asset) => sum + Number(asset.value), 0)

  const liquidAccountTotal = accounts
    .filter((account) => LIQUID_ACCOUNT_TYPES.has(account.account_type))
    .reduce((sum, account) => sum + Number(account.balance), 0)

  return liquidAssetTotal + liquidAccountTotal
}

export function calculateFinancialMetrics(
  assets: Asset[],
  liabilities: Liability[],
  incomeSources: IncomeSource[],
  expenses: Expense[],
  accounts: Account[] = []
): FinancialMetrics {
  const assetTotal = assets.reduce((sum, asset) => sum + Number(asset.value), 0)
  const accountAssets = accounts
    .filter((account) => account.account_type !== 'Credit Card')
    .reduce((sum, account) => sum + Number(account.balance), 0)
  const totalAssets = assetTotal + accountAssets

  const liabilityTotal = liabilities.reduce((sum, liability) => sum + Number(liability.balance), 0)
  const creditCardBalances = accounts
    .filter((account) => account.account_type === 'Credit Card')
    .reduce((sum, account) => sum + Number(account.balance), 0)
  const totalLiabilities = liabilityTotal + creditCardBalances

  const monthlyIncome = incomeSources.reduce(
    (sum, source) => sum + normalizeToMonthly(Number(source.amount), source.frequency),
    0
  )

  const monthlyExpenses = expenses.reduce(
    (sum, expense) => sum + normalizeToMonthly(Number(expense.amount), expense.frequency),
    0
  )

  const monthlyCashFlow = monthlyIncome - monthlyExpenses
  const liquidAssets = calculateLiquidAssets(assets, accounts)

  const debtToAssetRatio = totalAssets > 0 ? totalLiabilities / totalAssets : null
  const liquidityRatio = totalLiabilities > 0 ? liquidAssets / totalLiabilities : null

  return {
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
    monthlyIncome,
    monthlyExpenses,
    monthlyCashFlow,
    debtToAssetRatio,
    liquidityRatio,
    liquidAssets,
  }
}

export function assessFinancialHealth(metrics: FinancialMetrics): FinancialHealthStatus {
  let score = 0

  if (metrics.netWorth >= 0) score += 1
  if (metrics.monthlyCashFlow >= 0) score += 1
  if (metrics.debtToAssetRatio !== null && metrics.debtToAssetRatio < 0.5) score += 1
  if (metrics.liquidityRatio !== null && metrics.liquidityRatio >= 1) score += 1
  if (metrics.totalLiabilities === 0) score += 1

  if (score >= 4) return 'Strong'
  if (score >= 2) return 'Stable'
  return 'At Risk'
}

export function formatCurrency(value: number, fractionDigits = 2): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}

export function formatCurrencyCompact(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatRatio(value: number | null, asPercent = false): string {
  if (value === null) return '—'
  if (asPercent) return `${(value * 100).toFixed(1)}%`
  return `${value.toFixed(2)}x`
}

export interface ChartDataPoint {
  name: string
  value: number
}

export function buildAssetAllocation(
  assets: Asset[],
  accounts: Account[]
): ChartDataPoint[] {
  const allocation: Record<string, number> = {}

  for (const asset of assets) {
    allocation[asset.asset_type] = (allocation[asset.asset_type] || 0) + Number(asset.value)
  }

  for (const account of accounts) {
    if (account.account_type === 'Credit Card') continue
    const label = `${account.account_type} Account`
    allocation[label] = (allocation[label] || 0) + Number(account.balance)
  }

  return Object.entries(allocation)
    .map(([name, value]) => ({ name, value }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
}

export function buildLiabilitiesByCategory(
  liabilities: Liability[],
  accounts: Account[]
): ChartDataPoint[] {
  const byCategory: Record<string, number> = {}

  for (const liability of liabilities) {
    byCategory[liability.liability_type] =
      (byCategory[liability.liability_type] || 0) + Number(liability.balance)
  }

  const creditCardTotal = accounts
    .filter((account) => account.account_type === 'Credit Card')
    .reduce((sum, account) => sum + Number(account.balance), 0)

  if (creditCardTotal > 0) {
    byCategory['Credit Card (Accounts)'] =
      (byCategory['Credit Card (Accounts)'] || 0) + creditCardTotal
  }

  return Object.entries(byCategory)
    .map(([name, value]) => ({ name, value }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
}

export function buildIncomeVsExpense(metrics: FinancialMetrics): ChartDataPoint[] {
  return [
    { name: 'Income', value: metrics.monthlyIncome },
    { name: 'Expenses', value: metrics.monthlyExpenses },
  ]
}
