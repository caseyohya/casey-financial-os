import type { TaxFlag } from "@/lib/types/tax";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { AlertTriangle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaxFlagsPanelProps {
  flags: TaxFlag[];
}

export function TaxFlagsPanel({ flags }: TaxFlagsPanelProps) {
  if (flags.length === 0) {
    return (
      <DashboardCard title="Audit Flags" description="Items needing attention">
        <p className="text-sm text-emerald-400">No flags — all required items are complete.</p>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      title="Audit Flags"
      description={`${flags.length} item${flags.length === 1 ? "" : "s"} needing attention`}
    >
      <ul className="space-y-2">
        {flags.map((flag, i) => (
          <li
            key={`${flag.type}-${flag.entityId ?? i}`}
            className={cn(
              "flex items-start gap-2 rounded-lg border px-3 py-2 text-sm",
              flag.severity === "error"
                ? "border-red-500/20 bg-red-500/5 text-red-300"
                : "border-amber-500/20 bg-amber-500/5 text-amber-300"
            )}
          >
            {flag.severity === "error" ? (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span>{flag.message}</span>
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
}
