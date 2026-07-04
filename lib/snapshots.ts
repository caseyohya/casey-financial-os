import { supabase, MonthlySnapshot } from '@/lib/supabase'
import { DEMO_PROFILE_ID } from '@/lib/constants'
import { FinancialMetrics } from '@/lib/finance'

function getCurrentSnapshotMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

export async function upsertMonthlySnapshot(metrics: FinancialMetrics): Promise<void> {
  const snapshotMonth = getCurrentSnapshotMonth()

  const { error } = await supabase.from('monthly_snapshots').upsert(
    {
      profile_id: DEMO_PROFILE_ID,
      snapshot_month: snapshotMonth,
      total_assets: metrics.totalAssets,
      total_liabilities: metrics.totalLiabilities,
      net_worth: metrics.netWorth,
      monthly_income: metrics.monthlyIncome,
      monthly_expenses: metrics.monthlyExpenses,
      monthly_cash_flow: metrics.monthlyCashFlow,
      debt_to_asset_ratio: metrics.debtToAssetRatio,
      liquidity_ratio: metrics.liquidityRatio,
    },
    { onConflict: 'profile_id,snapshot_month' }
  )

  if (error) throw error
}

export async function loadMonthlySnapshots(): Promise<MonthlySnapshot[]> {
  const { data, error } = await supabase
    .from('monthly_snapshots')
    .select('*')
    .eq('profile_id', DEMO_PROFILE_ID)
    .order('snapshot_month', { ascending: true })

  if (error) throw error
  return (data || []) as MonthlySnapshot[]
}

export function formatSnapshotMonth(snapshotMonth: string): string {
  const [year, month] = snapshotMonth.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}
