import type { WhatChangedItem } from "@/lib/types/executive";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

interface WhatChangedSectionProps {
  items: WhatChangedItem[];
  currency?: string;
}

export function WhatChangedSection({ items, currency = "USD" }: WhatChangedSectionProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-navy-700 bg-navy-900 p-5">
        <h3 className="text-sm font-semibold text-white">What Changed This Month</h3>
        <p className="mt-2 text-sm text-slate-500">No significant changes from prior period. Add more historical data for comparisons.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-navy-700 bg-navy-900">
      <div className="border-b border-navy-700 px-5 py-4">
        <h3 className="text-sm font-semibold text-white">What Changed This Month</h3>
      </div>
      <div className="divide-y divide-navy-800">
        {items.map((item) => {
          const Icon = item.change > 0 ? ArrowUpRight : item.change < 0 ? ArrowDownRight : Minus;
          const color = item.change > 0 ? "text-emerald-400" : item.change < 0 ? "text-red-400" : "text-slate-400";
          return (
            <div key={item.label} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm text-slate-300">{item.label}</p>
                <p className="text-xs text-slate-500">
                  {formatCurrency(item.previous, currency)} → {formatCurrency(item.current, currency)}
                </p>
              </div>
              <div className={cn("flex items-center gap-1 text-sm font-medium", color)}>
                <Icon className="h-3.5 w-3.5" />
                <span>{formatPercent(item.changePercent)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
