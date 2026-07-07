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
  const scheduleEUrl = `/api/real-estate/export/schedule-e?year=${taxYear}`;
  const cpaUrl = `/api/real-estate/export/cpa?year=${taxYear}`;

  return (
    <div className="flex flex-wrap gap-3">
      <Link href={scheduleEUrl} target="_blank" className={linkClass}>
        <FileSpreadsheet className="mr-2 h-4 w-4" />
        Schedule E Export ({taxYear})
      </Link>
      <Link href={cpaUrl} target="_blank" className={linkClass}>
        <Download className="mr-2 h-4 w-4" />
        CPA CSV Export ({taxYear})
      </Link>
    </div>
  );
}
