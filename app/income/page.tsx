'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import PageHeader from '@/components/PageHeader'
import DataTable from '@/components/DataTable'
import FormModal from '@/components/FormModal'
import { supabase, IncomeSource } from '@/lib/supabase'
import { DEMO_PROFILE_ID, FREQUENCIES } from '@/lib/constants'
import { formatCurrency, normalizeToMonthly } from '@/lib/finance'
import { ensureDemoProfile } from '@/lib/profile'

const defaultForm = {
  name: '',
  amount: '',
  frequency: 'Monthly',
}

export default function IncomePage() {
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState(defaultForm)

  useEffect(() => {
    initializeAndLoad()
  }, [])

  const initializeAndLoad = async () => {
    setIsLoading(true)
    try {
      await ensureDemoProfile()
      await loadIncomeSources()
    } catch (error) {
      console.error('Error loading income sources:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadIncomeSources = async () => {
    const { data, error } = await supabase
      .from('income_sources')
      .select('*')
      .eq('profile_id', DEMO_PROFILE_ID)
      .order('created_at', { ascending: false })

    if (error) throw error
    setIncomeSources(data || [])
  }

  const openAddForm = () => {
    setFormData(defaultForm)
    setEditingId(null)
    setIsFormOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        name: formData.name,
        amount: parseFloat(formData.amount),
        frequency: formData.frequency,
      }

      if (editingId) {
        const { error } = await supabase.from('income_sources').update(payload).eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('income_sources').insert([{ ...payload, profile_id: DEMO_PROFILE_ID }])
        if (error) throw error
      }

      setIsFormOpen(false)
      setEditingId(null)
      setFormData(defaultForm)
      await loadIncomeSources()
    } catch (error) {
      console.error('Error saving income source:', error)
      alert('Failed to save income source')
    }
  }

  const handleEdit = (source: IncomeSource) => {
    setFormData({
      name: source.name,
      amount: source.amount.toString(),
      frequency: source.frequency,
    })
    setEditingId(source.id)
    setIsFormOpen(true)
  }

  const handleDelete = async (source: IncomeSource) => {
    if (!confirm(`Delete "${source.name}"?`)) return

    try {
      const { error } = await supabase.from('income_sources').delete().eq('id', source.id)
      if (error) throw error
      await loadIncomeSources()
    } catch (error) {
      console.error('Error deleting income source:', error)
      alert('Failed to delete income source')
    }
  }

  const monthlyIncome = incomeSources.reduce(
    (sum, source) => sum + normalizeToMonthly(Number(source.amount), source.frequency),
    0
  )

  return (
    <div className="min-h-screen bg-executive-darker">
      <Header />

      <main className="p-8 max-w-6xl mx-auto space-y-8">
        <PageHeader
          title="Income Sources"
          description="Track salary, side income, and other recurring revenue"
          addLabel="Add Income"
          onAdd={openAddForm}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="executive-card p-6">
            <p className="metric-label">Monthly Income (Normalized)</p>
            <p className="metric-value text-executive-success">${formatCurrency(monthlyIncome)}</p>
          </div>
          <div className="executive-card p-6">
            <p className="metric-label">Income Sources</p>
            <p className="metric-value text-executive-accent">{incomeSources.length}</p>
          </div>
        </div>

        <DataTable
          columns={[
            {
              key: 'name',
              header: 'Source',
              render: (source) => <span className="text-slate-100">{source.name}</span>,
            },
            {
              key: 'frequency',
              header: 'Frequency',
              render: (source) => (
                <span className="inline-block px-3 py-1 bg-slate-700 rounded-full text-sm text-slate-300">
                  {source.frequency}
                </span>
              ),
            },
            {
              key: 'monthly',
              header: 'Monthly Equivalent',
              align: 'right',
              render: (source) => (
                <span className="text-slate-300">
                  ${formatCurrency(normalizeToMonthly(Number(source.amount), source.frequency))}
                </span>
              ),
            },
            {
              key: 'amount',
              header: 'Amount',
              align: 'right',
              render: (source) => (
                <span className="font-semibold text-executive-success">
                  ${formatCurrency(Number(source.amount))}
                </span>
              ),
            },
          ]}
          data={incomeSources}
          isLoading={isLoading}
          emptyMessage='No income sources yet. Click "Add Income" to get started.'
          getRowKey={(source) => source.id}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </main>

      <FormModal
        title={editingId ? 'Edit Income Source' : 'Add Income Source'}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingId(null)
          setFormData(defaultForm)
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Income Source</label>
            <input
              type="text"
              className="executive-input w-full"
              placeholder="e.g., Salary"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Amount ($)</label>
            <input
              type="number"
              className="executive-input w-full"
              placeholder="0.00"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Frequency</label>
            <select
              className="executive-input w-full"
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
            >
              {FREQUENCIES.map((freq) => (
                <option key={freq} value={freq}>
                  {freq}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-4">
            <button type="submit" className="executive-button flex-1">
              {editingId ? 'Update Income' : 'Add Income'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false)
                setEditingId(null)
                setFormData(defaultForm)
              }}
              className="executive-button-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </FormModal>
    </div>
  )
}
