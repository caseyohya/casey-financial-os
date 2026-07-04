'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import Header from '@/components/Header'
import { supabase, Account } from '@/lib/supabase'

const DEMO_PROFILE_ID = 'demo-profile-001'
const ACCOUNT_TYPES = ['Checking', 'Savings', 'Money Market', 'Investment', 'Credit Card']

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    account_type: 'Checking',
    balance: '',
  })

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('profile_id', DEMO_PROFILE_ID)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAccounts(data || [])
    } catch (error) {
      console.error('Error loading accounts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingId) {
        // Update
        const { error } = await supabase
          .from('accounts')
          .update({
            name: formData.name,
            account_type: formData.account_type,
            balance: parseFloat(formData.balance),
          })
          .eq('id', editingId)

        if (error) throw error
      } else {
        // Insert
        const { error } = await supabase.from('accounts').insert([
          {
            profile_id: DEMO_PROFILE_ID,
            name: formData.name,
            account_type: formData.account_type,
            balance: parseFloat(formData.balance),
          },
        ])

        if (error) throw error
      }

      setFormData({ name: '', account_type: 'Checking', balance: '' })
      setEditingId(null)
      setIsFormOpen(false)
      await loadAccounts()
    } catch (error) {
      console.error('Error saving account:', error)
      alert('Failed to save account')
    }
  }

  const handleEdit = (account: Account) => {
    setFormData({
      name: account.name,
      account_type: account.account_type,
      balance: account.balance.toString(),
    })
    setEditingId(account.id)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this account?')) return

    try {
      const { error } = await supabase.from('accounts').delete().eq('id', id)
      if (error) throw error
      await loadAccounts()
    } catch (error) {
      console.error('Error deleting account:', error)
      alert('Failed to delete account')
    }
  }

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0)
  const accountsByType = accounts.reduce((acc, curr) => {
    acc[curr.account_type] = (acc[curr.account_type] || 0) + curr.balance
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="min-h-screen bg-executive-darker">
      <Header />

      <main className="p-8 max-w-6xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Accounts</h1>
            <p className="text-slate-400 mt-2">Manage your bank and investment accounts</p>
          </div>
          <button
            onClick={() => {
              setFormData({ name: '', account_type: 'Checking', balance: '' })
              setEditingId(null)
              setIsFormOpen(true)
            }}
            className="executive-button flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Account
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="executive-card p-6">
            <p className="metric-label">Total Balance</p>
            <p className="metric-value text-executive-accent">
              ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="executive-card p-6">
            <p className="metric-label">Total Accounts</p>
            <p className="metric-value text-executive-accent">{accounts.length}</p>
          </div>
        </div>

        {/* Account Type Breakdown */}
        {Object.keys(accountsByType).length > 0 && (
          <div className="executive-card p-6">
            <h2 className="text-xl font-bold mb-4 text-slate-100">Balance by Account Type</h2>
            <div className="space-y-3">
              {Object.entries(accountsByType).map(([type, balance]) => (
                <div key={type} className="flex justify-between items-center p-3 bg-slate-800 rounded">
                  <span className="text-slate-300">{type}</span>
                  <span className="font-semibold text-executive-success">
                    ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Accounts List */}
        <div className="executive-card overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400">Loading accounts...</div>
          ) : accounts.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              No accounts yet. Click "Add Account" to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Account Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">Type</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-slate-300">Balance</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {accounts.map((account) => (
                    <tr key={account.id} className="hover:bg-slate-800 transition-colors">
                      <td className="px-6 py-4 text-slate-100">{account.name}</td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-3 py-1 bg-slate-700 rounded-full text-sm text-slate-300">
                          {account.account_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-executive-success">
                        ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(account)}
                            className="p-2 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-slate-200"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(account.id)}
                            className="p-2 hover:bg-red-900/20 rounded transition-colors text-red-400 hover:text-red-300"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="executive-card w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Account' : 'Add New Account'}</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Account Name</label>
                <input
                  type="text"
                  className="executive-input w-full"
                  placeholder="e.g., Chase Checking"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Account Type</label>
                <select
                  className="executive-input w-full"
                  value={formData.account_type}
                  onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                >
                  {ACCOUNT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Current Balance ($)</label>
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

              <div className="flex gap-2 pt-4">
                <button type="submit" className="executive-button flex-1">
                  {editingId ? 'Update Account' : 'Add Account'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false)
                    setEditingId(null)
                    setFormData({ name: '', account_type: 'Checking', balance: '' })
                  }}
                  className="executive-button-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
