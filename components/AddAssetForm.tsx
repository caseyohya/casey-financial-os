'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface AddAssetFormProps {
  profileId: string
  onSuccess: () => void
}

const ASSET_TYPES = ['Cash', 'Savings Account', 'Investment Account', 'Real Estate', 'Vehicle', 'Other']

export default function AddAssetForm({ profileId, onSuccess }: AddAssetFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    asset_type: 'Savings Account',
    value: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.from('assets').insert([
        {
          profile_id: profileId,
          name: formData.name,
          asset_type: formData.asset_type,
          value: parseFloat(formData.value),
        },
      ])

      if (error) throw error

      setFormData({ name: '', asset_type: 'Savings Account', value: '' })
      setIsOpen(false)
      onSuccess()
    } catch (error) {
      console.error('Error adding asset:', error)
      alert('Failed to add asset')
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
        Add Asset
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="executive-card w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Add New Asset</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Asset Name</label>
            <input
              type="text"
              className="executive-input w-full"
              placeholder="e.g., Emergency Fund"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Asset Type</label>
            <select
              className="executive-input w-full"
              value={formData.asset_type}
              onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })}
            >
              {ASSET_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Value ($)</label>
            <input
              type="number"
              className="executive-input w-full"
              placeholder="0.00"
              step="0.01"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="executive-button flex-1 disabled:opacity-50"
            >
              {isLoading ? 'Adding...' : 'Add Asset'}
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
