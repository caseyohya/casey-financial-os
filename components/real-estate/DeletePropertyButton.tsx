"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteProperty } from "@/app/(dashboard)/real-estate/actions";
import { Button } from "@/components/forms/FormFields";

interface DeletePropertyButtonProps {
  propertyId: string;
  propertyName: string;
}

export function DeletePropertyButton({ propertyId, propertyName }: DeletePropertyButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);
    const result = await deleteProperty(propertyId);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="secondary"
        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
        onClick={() => setConfirming(true)}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete Property
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
      <p className="text-sm text-slate-300">
        Delete <span className="font-medium text-white">{propertyName}</span>? This removes all
        income, expenses, tenants, mortgages, and documents for this property.
      </p>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      <div className="mt-4 flex gap-3">
        <Button
          type="button"
          className="bg-red-600 text-white hover:bg-red-500"
          isLoading={loading}
          onClick={handleDelete}
        >
          Confirm Delete
        </Button>
        <Button type="button" variant="secondary" disabled={loading} onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
