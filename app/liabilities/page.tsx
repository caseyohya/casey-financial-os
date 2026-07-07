'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import PageHeader from '@/components/PageHeader'
import DataTable from '@/components/DataTable'
import FormModal from '@/components/FormModal'
import { supabase, Liability } from '@/lib/supabase'
import { DEMO_PROFILE_ID, LIABILITY_TYPES } from '@/lib/constants'
import { formatCurrency } from '@/lib/finance'
import { ensureDemoProfile } from '@/lib/profile'

const defaultForm = {
  name: '',
  liability_type: 'Credit Card',
  balance: '',
  interest_rate: '',
}

export default function LiabilitiesPage() {
  const [liabilities, setLiabilities] = useState<Liability[]>([])
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
      await loadLiabilities()
    } catch (error) {
      console.error('Error loading liabilities:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadLiabilities = async () => {
    const { data, error } = await supabase
      .from('liabilities')
      .select('*')
      .eq('profile_id', DEMO_PROFILE_ID)
      .order('created_at', { ascending: false })

    if (error) throw error
    setLiabilities(data || [])
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
        liability_type: formData.liability_type,
        balance: parseFloat(formData.balance),
        interest_rate: formData.interest_rate ? parseFloat(formData.interest_rate) : null,
      }

      if (editingId) {
        const { error } = await supabase.from('liabilities').update(payload).eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('liabilities').insert([{ ...payload, profile_id: DEMO_PROFILE_ID }])
        if (error) throw error
      }

      setIsFormOpen(false)
      setEditingId(null)
      setFormData(defaultForm)
      await loadLiabilities()
    } catch (error) {
      console.error('Error saving liability:', error)
      alert('Failed to save liability')
    }
  }

  const handleEdit = (liability: Liability) => {
    setFormData({
      name: liability.name,
      liability_type: liability.liability_type,
      balance: liability.balance.toString(),
      interest_rate: liability.interest_rate?.toString() || '',
    })
    setEditingId(liability.id)
    setIsFormOpen(true)
  }

  const handleDelete = async (liability: Liability) => {
    if (!confirm(`Delete "${liability.name}"?`)) return

    try {
      const { error } = await supabase.from('liabilities').delete().eq('id', liability.id)
      if (error) throw error
      await loadLiabilities()
    } catch (error) {
      console.error('Error deleting liability:', error)
      alert('Failed to delete liability')
    }
  }

  const totalBalance = liabilities.reduce((sum, liability) => sum + Number(liability.balance), 0)

  return (
    <div className="min-h-screen bg-executive-darker">
      <Header />

      <main className="p-8 max-w-6xl mx-auto space-y-8">
        <PageHeader
          title="Liabilities"
          description="Track mortgages, loans, credit cards, and other debts"
          addLabel="Add Liability"
          onAdd={openAddForm}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="executive-card p-6">
            <p className="metric-label">Total Liability Balance</p>
            <p className="metric-value text-executive-danger">${formatCurrency(totalBalance)}</p>
          </div>
          <div className="executive-card p-6">
            <p className="metric-label">Total Liabilities</p>
            <p className="metric-value text-executive-accent">{liabilities.length}</p>
          </div>
        </div>

        <DataTable
          columns={[
            {
              key: 'name',
              header: 'Name',
              render: (liability) => <span className="text-slate-100">{liability.name}</span>,
            },
            {
              key: 'type',
              header: 'Type',
              render: (liability) => (
                <span className="inline-block px-3 py-1 bg-slate-700 rounded-full text-sm text-slate-300">
                  {liability.liability_type}
                </span>
              ),
            },
            {
              key: 'rate',
              header: 'Interest Rate',
              render: (liability) => (
                <span className="text-slate-300">
                  {liability.interest_rate != null ? `${liability.interest_rate}%` : '—'}
                </span>
              ),
            },
            {
              key: 'balance',
              header: 'Balance',
              align: 'right',
              render: (liability) => (
                <span className="font-semibold text-executive-danger">
                  ${formatCurrency(Number(liability.balance))}
                </span>
              ),
            },
          ]}
          data={liabilities}
          isLoading={isLoading}
          emptyMessage='No liabilities yet. Click "Add Liability" to get started.'
          getRowKey={(liability) => liability.id}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </main>

      <FormModal
        title={editingId ? 'Edit Liability' : 'Add New Liability'}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingId(null)
          setFormData(defaultForm)
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Liability Name</label>
            <input
              type="text"
              className="executive-input w-full"
              placeholder="e.g., Primary Mortgage"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Liability Type</label>
            <select
              className="executive-input w-full"
              value={formData.liability_type}
              onChange={(e) => setFormData({ ...formData, liability_type: e.target.value })}
            >
              {LIABILITY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Balance ($)</label>
            <input
              type="number"
              className="executive-input w-full"
              placeholder="0.00"
              step="0.01"
              value={formData.balance}
              onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Interest Rate (%) — Optional</label>
            <input
              type="number"
              className="executive-input w-full"
              placeholder="0.00"
              step="0.01"
              value={formData.interest_rate}
              onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button type="submit" className="executive-button flex-1">
              {editingId ? 'Update Liability' : 'Add Liability'}
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
