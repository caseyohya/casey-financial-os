'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import MetricsGrid from '@/components/MetricsGrid'
import AddAssetForm from '@/components/AddAssetForm'
import AddLiabilityForm from '@/components/AddLiabilityForm'
import AddIncomeForm from '@/components/AddIncomeForm'
import AddExpenseForm from '@/components/AddExpenseForm'
import { supabase, Asset, Liability, IncomeSource, Expense } from '@/lib/supabase'

const DEMO_PROFILE_ID = 'demo-profile-001'

export default function Dashboard() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [liabilities, setLiabilities] = useState<Liability[]>([])
  const [income, setIncome] = useState<IncomeSource[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    checkAndInitializeData()
  }, [])

  const checkAndInitializeData = async () => {
    setIsLoading(true)
    try {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', DEMO_PROFILE_ID)
        .single()

      if (!existingProfile) {
        // Create demo profile
        const { error } = await supabase.from('profiles').insert([
          {
            id: DEMO_PROFILE_ID,
            email: 'casey@financialhub.local',
            full_name: 'Casey',
          },
        ])
        if (error) throw error
      }

      setIsInitialized(true)
      await loadData()
    } catch (error) {
      console.error('Error initializing:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadData = async () => {
    try {
      const [assetsRes, liabilitiesRes, incomeRes, expensesRes] = await Promise.all([
        supabase.from('assets').select('*').eq('profile_id', DEMO_PROFILE_ID),
        supabase.from('liabilities').select('*').eq('profile_id', DEMO_PROFILE_ID),
        supabase.from('income_sources').select('*').eq('profile_id', DEMO_PROFILE_ID),
        supabase.from('expenses').select('*').eq('profile_id', DEMO_PROFILE_ID),
      ])

      if (assetsRes.data) setAssets(assetsRes.data)
      if (liabilitiesRes.data) setLiabilities(liabilitiesRes.data)
      if (incomeRes.data) setIncome(incomeRes.data)
      if (expensesRes.data) setExpenses(expensesRes.data)
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  // Calculate metrics
  const totalAssets = assets.reduce((sum, asset) => sum + asset.value, 0)
  const totalLiabilities = liabilities.reduce((sum, liability) => sum + liability.balance, 0)
  const netWorth = totalAssets - totalLiabilities

  // Calculate monthly income (normalize frequencies)
  const monthlyIncome = income.reduce((sum, source) => {
    const monthlyAmount = source.frequency === 'Monthly'
      ? source.amount
      : source.frequency === 'Bi-weekly'
      ? (source.amount * 26) / 12
      : source.frequency === 'Weekly'
      ? (source.amount * 52) / 12
      : source.frequency === 'Yearly'
      ? source.amount / 12
      : 0
    return sum + monthlyAmount
  }, 0)

  // Calculate monthly expenses (normalize frequencies)
  const monthlyExpenses = expenses.reduce((sum, expense) => {
    const monthlyAmount = expense.frequency === 'Monthly'
      ? expense.amount
      : expense.frequency === 'Bi-weekly'
      ? (expense.amount * 26) / 12
      : expense.frequency === 'Weekly'
      ? (expense.amount * 52) / 12
      : expense.frequency === 'Yearly'
      ? expense.amount / 12
      : 0
    return sum + monthlyAmount
  }, 0)

  return (
    <div className="min-h-screen bg-executive-darker">
      <Header />

      <main className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Metrics Grid */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-slate-100">Financial Overview</h2>
          <MetricsGrid
            netWorth={netWorth}
            totalAssets={totalAssets}
            totalLiabilities={totalLiabilities}
            monthlyIncome={monthlyIncome}
            monthlyExpenses={monthlyExpenses}
            isLoading={!isInitialized}
          />
        </section>

        {/* Data Entry Section */}
        <section className="executive-card p-8">
          <h2 className="text-2xl font-bold mb-6 text-slate-100">Add Financial Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <AddAssetForm profileId={DEMO_PROFILE_ID} onSuccess={loadData} />
            <AddLiabilityForm profileId={DEMO_PROFILE_ID} onSuccess={loadData} />
            <AddIncomeForm profileId={DEMO_PROFILE_ID} onSuccess={loadData} />
            <AddExpenseForm profileId={DEMO_PROFILE_ID} onSuccess={loadData} />
          </div>
        </section>

        {/* Assets List */}
        {assets.length > 0 && (
          <section className="executive-card p-8">
            <h3 className="text-xl font-bold mb-4 text-slate-100">Assets</h3>
            <div className="space-y-2">
              {assets.map((asset) => (
                <div key={asset.id} className="flex justify-between p-3 bg-slate-800 rounded">
                  <div>
                    <p className="font-medium">{asset.name}</p>
                    <p className="text-xs text-slate-400">{asset.asset_type}</p>
                  </div>
                  <p className="font-semibold text-executive-success">${asset.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Liabilities List */}
        {liabilities.length > 0 && (
          <section className="executive-card p-8">
            <h3 className="text-xl font-bold mb-4 text-slate-100">Liabilities</h3>
            <div className="space-y-2">
              {liabilities.map((liability) => (
                <div key={liability.id} className="flex justify-between p-3 bg-slate-800 rounded">
                  <div>
                    <p className="font-medium">{liability.name}</p>
                    <p className="text-xs text-slate-400">{
                      liability.liability_type
                    } {liability.interest_rate && `@ ${liability.interest_rate}%`}</p>
                  </div>
                  <p className="font-semibold text-executive-danger">${liability.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Income Sources List */}
        {income.length > 0 && (
          <section className="executive-card p-8">
            <h3 className="text-xl font-bold mb-4 text-slate-100">Income Sources</h3>
            <div className="space-y-2">
              {income.map((source) => (
                <div key={source.id} className="flex justify-between p-3 bg-slate-800 rounded">
                  <div>
                    <p className="font-medium">{source.name}</p>
                    <p className="text-xs text-slate-400">{source.frequency}</p>
                  </div>
                  <p className="font-semibold text-executive-success">${source.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Expenses List */}
        {expenses.length > 0 && (
          <section className="executive-card p-8">
            <h3 className="text-xl font-bold mb-4 text-slate-100">Expenses</h3>
            <div className="space-y-2">
              {expenses.map((expense) => (
                <div key={expense.id} className="flex justify-between p-3 bg-slate-800 rounded">
                  <div>
                    <p className="font-medium">{expense.name}</p>
                    <p className="text-xs text-slate-400">{expense.category} - {expense.frequency}</p>
                  </div>
                  <p className="font-semibold text-executive-warning">${expense.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
