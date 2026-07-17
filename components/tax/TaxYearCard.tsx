import Link from "next/link";
import type { TaxYear } from "@/lib/types/tax";
import { FILING_STATUS_LABELS, TAX_YEAR_STATUS_LABELS } from "@/lib/types/tax";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { DeleteTaxYearButton } from "@/components/tax/DeleteTaxYearButton";
import { Calendar, ChevronRight } from "lucide-react";

interface TaxYearCardProps {
  taxYear: TaxYear;
  flagCount?: number;
  documentsComplete?: number;
  documentsTotal?: number;
}

export function TaxYearCard({
  taxYear,
  flagCount = 0,
  documentsComplete = 0,
  documentsTotal = 0,
}: TaxYearCardProps) {
  const statusMap = {
    draft: "inactive" as const,
    in_progress: "pending" as const,
    ready_for_cpa: "active" as const,
    filed: "active" as const,
  };

  return (
    <div className="rounded-xl border border-navy-700 bg-navy-900 p-5 transition-colors hover:border-gold-500/40 hover:bg-navy-800">
      <Link
        href={`/tax/${taxYear.year}`}
        className="group block"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-800 group-hover:bg-navy-700">
              <Calendar className="h-5 w-5 text-gold-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Tax Year {taxYear.year}</h3>
              <p className="text-xs text-slate-400">
                {FILING_STATUS_LABELS[taxYear.filing_status]}
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-gold-500" />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <StatusBadge
            status={statusMap[taxYear.status]}
            label={TAX_YEAR_STATUS_LABELS[taxYear.status]}
          />
          {flagCount > 0 && (
            <StatusBadge status="warning" label={`${flagCount} flags`} />
          )}
          {documentsTotal > 0 && (
            <span className="text-xs text-slate-400">
              Docs: {documentsComplete}/{documentsTotal}
            </span>
          )}
          {taxYear.usd_to_jpy_rate && (
            <span className="text-xs text-slate-500">
              USD/JPY: {taxYear.usd_to_jpy_rate}
            </span>
          )}
        </div>
      </Link>

      <div className="mt-4 flex justify-end border-t border-navy-700 pt-3">
        <DeleteTaxYearButton year={taxYear.year} />
      </div>
    </div>
  );
}
