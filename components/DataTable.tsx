'use client'

import { Edit2, Trash2 } from 'lucide-react'

export interface DataTableColumn<T> {
  key: string
  header: string
  align?: 'left' | 'right' | 'center'
  render: (item: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  isLoading: boolean
  emptyMessage: string
  getRowKey: (item: T) => string
  onEdit: (item: T) => void
  onDelete: (item: T) => void
}

export default function DataTable<T>({
  columns,
  data,
  isLoading,
  emptyMessage,
  getRowKey,
  onEdit,
  onDelete,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="executive-card p-8 text-center text-slate-400">
        Loading...
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="executive-card p-8 text-center text-slate-400">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="executive-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-800 border-b border-slate-700">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-sm font-semibold text-slate-300 ${
                    column.align === 'right'
                      ? 'text-right'
                      : column.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                  }`}
                >
                  {column.header}
                </th>
              ))}
              <th className="px-6 py-3 text-center text-sm font-semibold text-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {data.map((item) => (
              <tr key={getRowKey(item)} className="hover:bg-slate-800 transition-colors">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-6 py-4 ${
                      column.align === 'right'
                        ? 'text-right'
                        : column.align === 'center'
                        ? 'text-center'
                        : 'text-left'
                    }`}
                  >
                    {column.render(item)}
                  </td>
                ))}
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onEdit(item)}
                      className="p-2 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-slate-200"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(item)}
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
    </div>
  )
}
