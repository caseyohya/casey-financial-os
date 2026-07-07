export const DEMO_PROFILE_ID = '00000000-0000-0000-0000-000000000001'

export const ACCOUNT_TYPES = ['Checking', 'Savings', 'Money Market', 'Investment', 'Credit Card'] as const

export const ASSET_TYPES = [
  'Cash',
  'Savings Account',
  'Investment Account',
  'Real Estate',
  'Vehicle',
  'Other',
] as const

export const LIABILITY_TYPES = [
  'Credit Card',
  'Mortgage',
  'Auto Loan',
  'Student Loan',
  'Personal Loan',
  'Other',
] as const

export const EXPENSE_CATEGORIES = [
  'Housing',
  'Food',
  'Transportation',
  'Utilities',
  'Insurance',
  'Healthcare',
  'Entertainment',
  'Other',
] as const

export const FREQUENCIES = ['Monthly', 'Bi-weekly', 'Weekly', 'Yearly', 'One-time'] as const

export const NAV_ITEMS = [
  { href: '/', label: 'Dashboard' },
  { href: '/accounts', label: 'Accounts' },
  { href: '/assets', label: 'Assets' },
  { href: '/liabilities', label: 'Liabilities' },
  { href: '/income', label: 'Income' },
  { href: '/expenses', label: 'Expenses' },
  { href: '/report', label: 'Report' },
] as const

export const CHART_COLORS = [
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
] as const
