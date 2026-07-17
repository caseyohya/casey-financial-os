"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteTaxYear } from "@/app/(dashboard)/tax/actions";

interface DeleteTaxYearButtonProps {
  year: number;
}

export function DeleteTaxYearButton({ year }: DeleteTaxYearButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteTaxYear(year);
      if (result?.error) {
        setError(result.error);
        setConfirming(false);
      }
    });
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setConfirming(true);
        }}
        className="inline-flex items-center gap-1 rounded-md border border-navy-600 px-2 py-1 text-xs text-slate-400 hover:border-red-500/40 hover:text-red-400"
        aria-label={`Delete tax year ${year}`}
      >
        <Trash2 className="h-3 w-3" />
        Delete
      </button>
    );
  }

  return (
    <div
      className="flex flex-col gap-1"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={handleDelete}
          className="rounded-md bg-red-500/20 px-2 py-1 text-xs text-red-300 hover:bg-red-500/30 disabled:opacity-50"
        >
          {isPending ? "Deleting…" : `Confirm delete ${year}`}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => setConfirming(false)}
          className="rounded-md px-2 py-1 text-xs text-slate-400 hover:text-slate-200"
        >
          Cancel
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
