"use client";

import Link from "next/link";
import { useState } from "react";
import type { Investment, InvestmentMetrics } from "@/lib/types/investments";
import { CATEGORY_LABELS } from "@/lib/types/investments";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Pencil, Trash2 } from "lucide-react";
import { deleteInvestment } from "@/app/(dashboard)/investments/actions";

interface InvestmentCardProps {
  investment: Investment;
  metrics: InvestmentMetrics;
}

export function InvestmentCard({ investment, metrics }: InvestmentCardProps) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${investment.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    await deleteInvestment(investment.id);
  }

  return (
    <div className="rounded-lg border border-navy-700 bg-navy-800 p-4">
      <div className="flex items-start justify-between gap-4">
        <Link href={`/investments/${investment.id}`} className="flex-1 hover:opacity-90">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-white">{investment.name}</p>
            <span className="rounded bg-navy-700 px-1.5 py-0.5 text-[10px] text-slate-400">
              {investment.currency}
            </span>
            <span className="rounded bg-navy-700 px-1.5 py-0.5 text-[10px] text-slate-400">
              {CATEGORY_LABELS[investment.category]}
            </span>
          </div>
          {investment.purchase_date && (
            <p className="mt-0.5 text-xs text-slate-400">
              Purchased {new Date(investment.purchase_date).toLocaleDateString()}
            </p>
          )}
        </Link>
        <div className="flex items-center gap-2">
          <StatusBadge status={investment.status === "active" ? "active" : "inactive"} label={investment.status} />
          <Link href={`/investments/${investment.id}/edit`} className="rounded p-1.5 text-slate-400 hover:bg-navy-700 hover:text-slate-200">
            <Pencil className="h-4 w-4" />
          </Link>
          <button onClick={handleDelete} disabled={deleting} className="rounded p-1.5 text-slate-400 hover:bg-navy-700 hover:text-red-400 disabled:opacity-50">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Link href={`/investments/${investment.id}`}>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-xs text-slate-500">Current Value</p>
            <p className="font-medium text-white">{formatCurrency(metrics.totalValue, investment.currency)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">ROI</p>
            <p className={`font-medium ${metrics.roi >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {formatPercent(metrics.roi)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Unrealized G/L</p>
            <p className={`font-medium ${metrics.unrealizedGainLoss >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {formatCurrency(metrics.unrealizedGainLoss, investment.currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Distributions</p>
            <p className="font-medium text-white">{formatCurrency(metrics.totalDistributions, investment.currency)}</p>
          </div>
        </div>
      </Link>
    </div>
  );
}
