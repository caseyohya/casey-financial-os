'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface AddIncomeFormProps {
  profileId: string
  onSuccess: () => void
}

const FREQUENCIES = ['Monthly', 'Bi-weekly', 'Weekly', 'Yearly', 'One-time']

export default function AddIncomeForm({ profileId, onSuccess }: AddIncomeFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    frequency: 'Monthly',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.from('income_sources').insert([
        {
          profile_id: profileId,
          name: formData.name,
          amount: parseFloat(formData.amount),
          frequency: formData.frequency,
        },
      ])

      if (error) throw error

      setFormData({ name: '', amount: '', frequency: 'Monthly' })
      setIsOpen(false)
      onSuccess()
    } catch (error) {
      console.error('Error adding income:', error)
      alert('Failed to add income source')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="executive-button flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Add Income
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="executive-card w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Add Income Source</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
            <button
              type="submit"
              disabled={isLoading}
              className="executive-button flex-1 disabled:opacity-50"
            >
              {isLoading ? 'Adding...' : 'Add Income'}
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="executive-button-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
