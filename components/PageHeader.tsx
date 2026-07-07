'use client'

import { Plus } from 'lucide-react'

interface PageHeaderProps {
  title: string
  description: string
  addLabel: string
  onAdd: () => void
}

export default function PageHeader({ title, description, addLabel, onAdd }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">{title}</h1>
        <p className="text-slate-400 mt-2">{description}</p>
      </div>
      <button onClick={onAdd} className="executive-button flex items-center gap-2">
        <Plus className="w-4 h-4" />
        {addLabel}
      </button>
    </div>
  )
}
