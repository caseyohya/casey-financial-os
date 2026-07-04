import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  className?: string;
}

export function MetricCard({
  label,
  value,
  change,
  changeType = "neutral",
  className,
}: MetricCardProps) {
  const ChangeIcon =
    changeType === "positive"
      ? ArrowUpRight
      : changeType === "negative"
        ? ArrowDownRight
        : Minus;

  const changeColor =
    changeType === "positive"
      ? "text-emerald-400"
      : changeType === "negative"
        ? "text-red-400"
        : "text-slate-400";

  return (
    <div
      className={cn(
        "rounded-xl border border-navy-700 bg-navy-900 p-5",
        className
      )}
    >
      <p className="text-sm font-medium text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
        {value}
      </p>
      {change && (
        <div className={cn("mt-2 flex items-center gap-1 text-sm", changeColor)}>
          <ChangeIcon className="h-3.5 w-3.5" />
          <span>{change}</span>
        </div>
      )}
    </div>
  );
}
