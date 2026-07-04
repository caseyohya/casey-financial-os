'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface AddLiabilityFormProps {
  profileId: string
  onSuccess: () => void
}

const LIABILITY_TYPES = ['Credit Card', 'Mortgage', 'Auto Loan', 'Student Loan', 'Personal Loan', 'Other']

export default function AddLiabilityForm({ profileId, onSuccess }: AddLiabilityFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    liability_type: 'Credit Card',
    balance: '',
    interest_rate: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.from('liabilities').insert([
        {
          profile_id: profileId,
          name: formData.name,
          liability_type: formData.liability_type,
          balance: parseFloat(formData.balance),
          interest_rate: formData.interest_rate ? parseFloat(formData.interest_rate) : null,
        },
      ])

      if (error) throw error

      setFormData({ name: '', liability_type: 'Credit Card', balance: '', interest_rate: '' })
      setIsOpen(false)
      onSuccess()
    } catch (error) {
      console.error('Error adding liability:', error)
      alert('Failed to add liability')
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
        Add Liability
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="executive-card w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Add New Liability</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
            <label className="block text-sm font-medium mb-2">Interest Rate (%) - Optional</label>
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
            <button
              type="submit"
              disabled={isLoading}
              className="executive-button flex-1 disabled:opacity-50"
            >
              {isLoading ? 'Adding...' : 'Add Liability'}
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
