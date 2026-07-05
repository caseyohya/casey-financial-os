import { Download } from "lucide-react";

interface ExportButtonsProps {
  year: number;
}

const EXPORTS = [
  { type: "annual_summary", label: "Annual Summary" },
  { type: "cpa_package", label: "CPA Package" },
  { type: "fbar", label: "FBAR" },
  { type: "form_8938", label: "Form 8938" },
  { type: "schedule_e", label: "Schedule E" },
  { type: "k1_summary", label: "K-1 Summary" },
] as const;

export function ExportButtons({ year }: ExportButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {EXPORTS.map((exp) => (
        <a
          key={exp.type}
          href={`/api/tax/export/${year}?type=${exp.type}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-navy-600 bg-navy-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-gold-500 hover:text-gold-500"
        >
          <Download className="h-3.5 w-3.5" />
          {exp.label}
        </a>
      ))}
    </div>
  );
}
