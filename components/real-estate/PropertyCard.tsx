"use client";

import Link from "next/link";
import type { Property, PropertyMetrics } from "@/lib/types/real-estate";
import { formatPropertyAddress } from "@/lib/utils/real-estate";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Pencil, Trash2 } from "lucide-react";
import { deleteProperty } from "@/app/(dashboard)/real-estate/actions";
import { useState } from "react";

interface PropertyCardProps {
  property: Property;
  metrics: PropertyMetrics;
}

export function PropertyCard({ property, metrics }: PropertyCardProps) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${property.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    await deleteProperty(property.id);
  }

  return (
    <div className="rounded-lg border border-navy-700 bg-navy-800 p-4">
      <div className="flex items-start justify-between gap-4">
        <Link href={`/real-estate/${property.id}`} className="flex-1 hover:opacity-90">
          <div className="flex items-center gap-2">
            <p className="font-medium text-white">{property.name}</p>
            <span className="rounded bg-navy-700 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
              {property.currency}
            </span>
            <span className="rounded bg-navy-700 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
              {property.country}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">{formatPropertyAddress(property)}</p>
        </Link>
        <div className="flex items-center gap-2">
          <StatusBadge
            status={property.is_active ? "active" : "inactive"}
            label={property.property_type}
          />
          <Link
            href={`/real-estate/${property.id}/edit`}
            className="rounded p-1.5 text-slate-400 hover:bg-navy-700 hover:text-slate-200"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded p-1.5 text-slate-400 hover:bg-navy-700 hover:text-red-400 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Link href={`/real-estate/${property.id}`}>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-xs text-slate-500">Value</p>
            <p className="font-medium text-white">
              {formatCurrency(property.current_value, property.currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Equity</p>
            <p className="font-medium text-emerald-400">
              {formatCurrency(metrics.equity, property.currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Monthly NOI</p>
            <p className="font-medium text-white">
              {formatCurrency(metrics.monthlyNOI, property.currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Cap Rate</p>
            <p className="font-medium text-white">{formatPercent(metrics.capRate)}</p>
          </div>
        </div>
      </Link>
    </div>
  );
}
