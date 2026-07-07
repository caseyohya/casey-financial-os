'use client'

interface FormModalProps {
  title: string
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export default function FormModal({ title, isOpen, onClose, children }: FormModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="executive-card w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4 text-slate-100">{title}</h2>
        {children}
      </div>
    </div>
  )
}
