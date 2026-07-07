"use client";

import { cn } from "@/lib/utils";

interface ModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}

export function Modal({ title, isOpen, onClose, children, wide }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className={cn(
          "relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-xl border border-navy-700 bg-navy-900 p-6 shadow-xl",
          wide ? "max-w-2xl" : "max-w-lg"
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-navy-800 hover:text-white"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
