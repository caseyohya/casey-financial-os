import { supabase, Account, Asset, Expense, IncomeSource, Liability, MonthlySnapshot } from '@/lib/supabase'
import { DEMO_PROFILE_ID } from '@/lib/constants'

export async function loadFinancialData() {
  const [accountsRes, assetsRes, liabilitiesRes, incomeRes, expensesRes] = await Promise.all([
    supabase.from('accounts').select('*').eq('profile_id', DEMO_PROFILE_ID).order('created_at', { ascending: false }),
    supabase.from('assets').select('*').eq('profile_id', DEMO_PROFILE_ID).order('created_at', { ascending: false }),
    supabase.from('liabilities').select('*').eq('profile_id', DEMO_PROFILE_ID).order('created_at', { ascending: false }),
    supabase.from('income_sources').select('*').eq('profile_id', DEMO_PROFILE_ID).order('created_at', { ascending: false }),
    supabase.from('expenses').select('*').eq('profile_id', DEMO_PROFILE_ID).order('created_at', { ascending: false }),
  ])

  if (accountsRes.error) throw accountsRes.error
  if (assetsRes.error) throw assetsRes.error
  if (liabilitiesRes.error) throw liabilitiesRes.error
  if (incomeRes.error) throw incomeRes.error
  if (expensesRes.error) throw expensesRes.error

  return {
    accounts: (accountsRes.data || []) as Account[],
    assets: (assetsRes.data || []) as Asset[],
    liabilities: (liabilitiesRes.data || []) as Liability[],
    incomeSources: (incomeRes.data || []) as IncomeSource[],
    expenses: (expensesRes.data || []) as Expense[],
  }
}

export async function loadFinancialDataWithSnapshots() {
  const data = await loadFinancialData()

  const { data: snapshots, error } = await supabase
    .from('monthly_snapshots')
    .select('*')
    .eq('profile_id', DEMO_PROFILE_ID)
    .order('snapshot_month', { ascending: true })

  if (error) throw error

  return {
    ...data,
    snapshots: (snapshots || []) as MonthlySnapshot[],
  }
}
