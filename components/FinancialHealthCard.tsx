'use client'

import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react'
import { FinancialHealthStatus } from '@/lib/finance'

interface FinancialHealthCardProps {
  status: FinancialHealthStatus
  isLoading?: boolean
}

const STATUS_CONFIG: Record<
  FinancialHealthStatus,
  { icon: React.ReactNode; color: string; description: string }
> = {
  Strong: {
    icon: <ShieldCheck className="w-8 h-8 text-executive-success" />,
    color: 'border-executive-success/40 bg-executive-success/5',
    description: 'Positive net worth, healthy cash flow, and manageable debt levels.',
  },
  Stable: {
    icon: <Shield className="w-8 h-8 text-executive-warning" />,
    color: 'border-executive-warning/40 bg-executive-warning/5',
    description: 'Financial position is manageable with room for improvement.',
  },
  'At Risk': {
    icon: <ShieldAlert className="w-8 h-8 text-executive-danger" />,
    color: 'border-executive-danger/40 bg-executive-danger/5',
    description: 'Review cash flow, debt levels, and liquidity to reduce risk.',
  },
}

export default function FinancialHealthCard({ status, isLoading }: FinancialHealthCardProps) {
  if (isLoading) {
    return <div className="executive-card h-24 animate-pulse bg-slate-800" />
  }

  const config = STATUS_CONFIG[status]

  return (
    <div className={`executive-card p-6 border ${config.color}`}>
      <div className="flex items-start gap-4">
        {config.icon}
        <div>
          <p className="metric-label">Financial Health</p>
          <p className="text-2xl font-bold text-slate-100 mt-1">{status}</p>
          <p className="text-sm text-slate-400 mt-2">{config.description}</p>
        </div>
      </div>
    </div>
  )
}
