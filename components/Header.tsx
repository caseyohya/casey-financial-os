'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3 } from 'lucide-react'
import { NAV_ITEMS } from '@/lib/constants'

export default function Header() {
  const pathname = usePathname()

  return (
    <header className="bg-executive-dark border-b border-slate-800 px-8 py-6">
      <div className="max-w-7xl mx-auto flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-executive-accent" />
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Casey Financial OS</h1>
            <p className="text-sm text-slate-400">Personal Chief Financial Officer Dashboard</p>
          </div>
        </div>

        <nav className="flex flex-wrap gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-executive-accent text-white'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
