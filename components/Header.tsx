'use client'

import { BarChart3 } from 'lucide-react'

export default function Header() {
  return (
    <header className="bg-executive-dark border-b border-slate-800 px-8 py-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="w-8 h-8 text-executive-accent" />
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Casey Financial OS</h1>
          <p className="text-sm text-slate-400">Personal Chief Financial Officer Dashboard</p>
        </div>
      </div>
    </header>
  )
}
