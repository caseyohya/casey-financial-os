import Link from "next/link";
import { Download, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExportButtonsProps {
  year?: number;
}

const linkClass = cn(
  "inline-flex items-center justify-center rounded-lg border border-navy-600 bg-navy-800 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-navy-700"
);

export function ExportButtons({ year }: ExportButtonsProps) {
  const taxYear = year ?? new Date().getFullYear();

  return (
    <div className="flex flex-wrap gap-3">
      <Link href={`/api/investments/export/tax-summary?year=${taxYear}`} target="_blank" className={linkClass}>
        <FileSpreadsheet className="mr-2 h-4 w-4" />
        Annual Tax Summary ({taxYear})
      </Link>
      <Link href={`/api/investments/export/cpa?year=${taxYear}`} target="_blank" className={linkClass}>
        <Download className="mr-2 h-4 w-4" />
        CPA CSV Export ({taxYear})
      </Link>
    </div>
  );
}
