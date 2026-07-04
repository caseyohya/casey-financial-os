'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import PageHeader from '@/components/PageHeader'
import DataTable from '@/components/DataTable'
import FormModal from '@/components/FormModal'
import { supabase, Expense } from '@/lib/supabase'
import { DEMO_PROFILE_ID, EXPENSE_CATEGORIES, FREQUENCIES } from '@/lib/constants'
import { formatCurrency, normalizeToMonthly } from '@/lib/finance'
import { ensureDemoProfile } from '@/lib/profile'

const defaultForm = {
  name: '',
  category: 'Other',
  amount: '',
  frequency: 'Monthly',
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
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
      await loadExpenses()
    } catch (error) {
      console.error('Error loading expenses:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadExpenses = async () => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('profile_id', DEMO_PROFILE_ID)
      .order('created_at', { ascending: false })

    if (error) throw error
    setExpenses(data || [])
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
        category: formData.category,
        amount: parseFloat(formData.amount),
        frequency: formData.frequency,
      }

      if (editingId) {
        const { error } = await supabase.from('expenses').update(payload).eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('expenses').insert([{ ...payload, profile_id: DEMO_PROFILE_ID }])
        if (error) throw error
      }

      setIsFormOpen(false)
      setEditingId(null)
      setFormData(defaultForm)
      await loadExpenses()
    } catch (error) {
      console.error('Error saving expense:', error)
      alert('Failed to save expense')
    }
  }

  const handleEdit = (expense: Expense) => {
    setFormData({
      name: expense.name,
      category: expense.category,
      amount: expense.amount.toString(),
      frequency: expense.frequency,
    })
    setEditingId(expense.id)
    setIsFormOpen(true)
  }

  const handleDelete = async (expense: Expense) => {
    if (!confirm(`Delete "${expense.name}"?`)) return

    try {
      const { error } = await supabase.from('expenses').delete().eq('id', expense.id)
      if (error) throw error
      await loadExpenses()
    } catch (error) {
      console.error('Error deleting expense:', error)
      alert('Failed to delete expense')
    }
  }

  const monthlyExpenses = expenses.reduce(
    (sum, expense) => sum + normalizeToMonthly(Number(expense.amount), expense.frequency),
    0
  )

  return (
    <div className="min-h-screen bg-executive-darker">
      <Header />

      <main className="p-8 max-w-6xl mx-auto space-y-8">
        <PageHeader
          title="Expenses"
          description="Track recurring and one-time spending by category"
          addLabel="Add Expense"
          onAdd={openAddForm}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="executive-card p-6">
            <p className="metric-label">Monthly Expenses (Normalized)</p>
            <p className="metric-value text-executive-warning">${formatCurrency(monthlyExpenses)}</p>
          </div>
          <div className="executive-card p-6">
            <p className="metric-label">Total Expenses</p>
            <p className="metric-value text-executive-accent">{expenses.length}</p>
          </div>
        </div>

        <DataTable
          columns={[
            {
              key: 'name',
              header: 'Name',
              render: (expense) => <span className="text-slate-100">{expense.name}</span>,
            },
            {
              key: 'category',
              header: 'Category',
              render: (expense) => (
                <span className="inline-block px-3 py-1 bg-slate-700 rounded-full text-sm text-slate-300">
                  {expense.category}
                </span>
              ),
            },
            {
              key: 'frequency',
              header: 'Frequency',
              render: (expense) => <span className="text-slate-300">{expense.frequency}</span>,
            },
            {
              key: 'monthly',
              header: 'Monthly Equivalent',
              align: 'right',
              render: (expense) => (
                <span className="text-slate-300">
                  ${formatCurrency(normalizeToMonthly(Number(expense.amount), expense.frequency))}
                </span>
              ),
            },
            {
              key: 'amount',
              header: 'Amount',
              align: 'right',
              render: (expense) => (
                <span className="font-semibold text-executive-warning">
                  ${formatCurrency(Number(expense.amount))}
                </span>
              ),
            },
          ]}
          data={expenses}
          isLoading={isLoading}
          emptyMessage='No expenses yet. Click "Add Expense" to get started.'
          getRowKey={(expense) => expense.id}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </main>

      <FormModal
        title={editingId ? 'Edit Expense' : 'Add Expense'}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingId(null)
          setFormData(defaultForm)
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Expense Name</label>
            <input
              type="text"
              className="executive-input w-full"
              placeholder="e.g., Rent"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              className="executive-input w-full"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
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
              {editingId ? 'Update Expense' : 'Add Expense'}
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
