'use client'

import { Download, FileSpreadsheet } from 'lucide-react'
import { FinancialDataExport, exportAllDataCsv, exportSummaryCsv } from '@/lib/export'
import { FinancialMetrics } from '@/lib/finance'

interface ExportActionsProps {
  metrics: FinancialMetrics
  data: FinancialDataExport
}

export default function ExportActions({ metrics, data }: ExportActionsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={() => exportSummaryCsv(metrics)}
        className="executive-button flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        Export Summary CSV
      </button>
      <button
        onClick={() => exportAllDataCsv(data)}
        className="executive-button-secondary flex items-center gap-2"
      >
        <FileSpreadsheet className="w-4 h-4" />
        Export All Data CSV
      </button>
    </div>
  )
}
