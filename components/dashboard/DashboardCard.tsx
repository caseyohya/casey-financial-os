import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function DashboardCard({
  title,
  description,
  children,
  className,
  action,
}: DashboardCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-navy-700 bg-navy-900",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-navy-700 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {description && (
            <p className="mt-0.5 text-xs text-slate-400">{description}</p>
          )}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
