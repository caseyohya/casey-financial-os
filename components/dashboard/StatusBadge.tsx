import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "active" | "inactive" | "pending" | "warning" | "neutral";
  label?: string;
}

const statusStyles = {
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  inactive: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  warning: "bg-red-500/10 text-red-400 border-red-500/20",
  neutral: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        statusStyles[status]
      )}
    >
      {label ?? status}
    </span>
  );
}
