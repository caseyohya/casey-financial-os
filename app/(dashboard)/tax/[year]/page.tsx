import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { TaxYearWorkspace } from "@/components/tax/TaxYearWorkspace";
import { getTaxYearByYear } from "@/lib/data/tax";
import { ArrowLeft } from "lucide-react";

interface TaxYearPageProps {
  params: Promise<{ year: string }>;
}

export default async function TaxYearPage({ params }: TaxYearPageProps) {
  const { year: yearStr } = await params;
  const year = parseInt(yearStr, 10);

  if (isNaN(year)) notFound();

  const data = await getTaxYearByYear(year);
  if (!data) notFound();

  return (
    <div>
      <div className="mb-4">
        <Link
          href="/tax"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-gold-500"
        >
          <ArrowLeft className="h-4 w-4" />
          All Tax Years
        </Link>
      </div>

      <PageHeader
        title={`Tax Year ${year}`}
        description="Annual tax organizer — audit-friendly, CPA-ready"
      />

      <TaxYearWorkspace data={data} />
    </div>
  );
}
