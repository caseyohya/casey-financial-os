"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/forms/FormFields";
import { deleteInvestment } from "@/app/(dashboard)/investments/actions";

interface DeleteInvestmentButtonProps {
  investmentId: string;
  investmentName: string;
}

export function DeleteInvestmentButton({ investmentId, investmentName }: DeleteInvestmentButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${investmentName}"? This cannot be undone.`)) return;
    setLoading(true);
    await deleteInvestment(investmentId);
  }

  return (
    <Button variant="secondary" onClick={handleDelete} isLoading={loading} className="border-red-500/30 text-red-400 hover:bg-red-500/10">
      <Trash2 className="mr-2 h-4 w-4" />
      Delete
    </Button>
  );
}
