import type { ExecutiveAlert } from "@/lib/types/executive";
import { AlertTriangle, Info, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const severityStyles = {
  info: { icon: Info, border: "border-blue-500/20", bg: "bg-blue-500/5", text: "text-blue-400" },
  warning: { icon: AlertTriangle, border: "border-amber-500/20", bg: "bg-amber-500/5", text: "text-amber-400" },
  critical: { icon: AlertCircle, border: "border-red-500/20", bg: "bg-red-500/5", text: "text-red-400" },
};

interface AlertPanelProps {
  alerts: ExecutiveAlert[];
}

export function AlertPanel({ alerts }: AlertPanelProps) {
  return (
    <div className="rounded-xl border border-navy-700 bg-navy-900">
      <div className="border-b border-navy-700 px-5 py-4">
        <h3 className="text-sm font-semibold text-white">Alerts</h3>
        <p className="text-xs text-slate-400">Read-only monitoring — no actions available</p>
      </div>
      <div className="space-y-2 p-4">
        {alerts.map((alert) => {
          const style = severityStyles[alert.severity];
          const Icon = style.icon;
          return (
            <div
              key={alert.id}
              className={cn("flex gap-3 rounded-lg border px-3 py-2.5", style.border, style.bg)}
            >
              <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", style.text)} />
              <div>
                <p className="text-sm font-medium text-white">{alert.title}</p>
                <p className="text-xs text-slate-400">{alert.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
