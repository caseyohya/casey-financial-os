'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import PageHeader from '@/components/PageHeader'
import DataTable from '@/components/DataTable'
import FormModal from '@/components/FormModal'
import { supabase, Asset } from '@/lib/supabase'
import { ASSET_TYPES, DEMO_PROFILE_ID } from '@/lib/constants'
import { formatCurrency } from '@/lib/finance'
import { ensureDemoProfile } from '@/lib/profile'

const defaultForm = {
  name: '',
  asset_type: 'Savings Account',
  value: '',
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
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
      await loadAssets()
    } catch (error) {
      console.error('Error loading assets:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadAssets = async () => {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('profile_id', DEMO_PROFILE_ID)
      .order('created_at', { ascending: false })

    if (error) throw error
    setAssets(data || [])
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
        asset_type: formData.asset_type,
        value: parseFloat(formData.value),
      }

      if (editingId) {
        const { error } = await supabase.from('assets').update(payload).eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('assets').insert([{ ...payload, profile_id: DEMO_PROFILE_ID }])
        if (error) throw error
      }

      setIsFormOpen(false)
      setEditingId(null)
      setFormData(defaultForm)
      await loadAssets()
    } catch (error) {
      console.error('Error saving asset:', error)
      alert('Failed to save asset')
    }
  }

  const handleEdit = (asset: Asset) => {
    setFormData({
      name: asset.name,
      asset_type: asset.asset_type,
      value: asset.value.toString(),
    })
    setEditingId(asset.id)
    setIsFormOpen(true)
  }

  const handleDelete = async (asset: Asset) => {
    if (!confirm(`Delete "${asset.name}"?`)) return

    try {
      const { error } = await supabase.from('assets').delete().eq('id', asset.id)
      if (error) throw error
      await loadAssets()
    } catch (error) {
      console.error('Error deleting asset:', error)
      alert('Failed to delete asset')
    }
  }

  const totalValue = assets.reduce((sum, asset) => sum + Number(asset.value), 0)

  return (
    <div className="min-h-screen bg-executive-darker">
      <Header />

      <main className="p-8 max-w-6xl mx-auto space-y-8">
        <PageHeader
          title="Assets"
          description="Track savings, investments, real estate, and other holdings"
          addLabel="Add Asset"
          onAdd={openAddForm}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="executive-card p-6">
            <p className="metric-label">Total Asset Value</p>
            <p className="metric-value text-executive-success">${formatCurrency(totalValue)}</p>
          </div>
          <div className="executive-card p-6">
            <p className="metric-label">Total Assets</p>
            <p className="metric-value text-executive-accent">{assets.length}</p>
          </div>
        </div>

        <DataTable
          columns={[
            {
              key: 'name',
              header: 'Name',
              render: (asset) => <span className="text-slate-100">{asset.name}</span>,
            },
            {
              key: 'type',
              header: 'Type',
              render: (asset) => (
                <span className="inline-block px-3 py-1 bg-slate-700 rounded-full text-sm text-slate-300">
                  {asset.asset_type}
                </span>
              ),
            },
            {
              key: 'value',
              header: 'Value',
              align: 'right',
              render: (asset) => (
                <span className="font-semibold text-executive-success">
                  ${formatCurrency(Number(asset.value))}
                </span>
              ),
            },
          ]}
          data={assets}
          isLoading={isLoading}
          emptyMessage='No assets yet. Click "Add Asset" to get started.'
          getRowKey={(asset) => asset.id}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </main>

      <FormModal
        title={editingId ? 'Edit Asset' : 'Add New Asset'}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingId(null)
          setFormData(defaultForm)
        }}
      >
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
            <button type="submit" className="executive-button flex-1">
              {editingId ? 'Update Asset' : 'Add Asset'}
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
