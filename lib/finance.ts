import { Account, Asset, Expense, IncomeSource, Liability } from '@/lib/supabase'

export interface FinancialMetrics {
  totalAssets: number
  totalLiabilities: number
  netWorth: number
  monthlyIncome: number
  monthlyExpenses: number
}

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

  return {
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
    monthlyIncome,
    monthlyExpenses,
  }
}

export function formatCurrency(value: number, fractionDigits = 2): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}
