import { PageHeader } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TaxYearCard } from "@/components/tax/TaxYearCard";
import { CreateTaxYearForm } from "@/components/tax/CreateTaxYearForm";

export const dynamic = "force-dynamic";
import { getTaxYears, getTaxYearByYear } from "@/lib/data/tax";
import { buildAnnualTaxSummary } from "@/lib/calculations/tax";
import { formatCurrency } from "@/lib/utils";
import { FileText } from "lucide-react";

export default async function TaxPage() {
  const taxYears = await getTaxYears();

  const yearsWithSummaries = await Promise.all(
    taxYears.map(async (year) => {
      const data = await getTaxYearByYear(year.year);
      const summary = data ? buildAnnualTaxSummary(data) : null;
      return { year, summary };
    })
  );

  const totalFlags = yearsWithSummaries.reduce(
    (sum, y) => sum + (y.summary?.flags.length ?? 0),
    0
  );

  const currentYear = new Date().getFullYear();
  const activeSummary = yearsWithSummaries.find((y) => y.year.year === currentYear)?.summary
    ?? yearsWithSummaries[0]?.summary;

  return (
    <div>
      <PageHeader
        title="Tax Intelligence"
        description="CPA-ready tax preparation organizer — structured by tax year"
      >
        <CreateTaxYearForm />
      </PageHeader>

      <div className="mb-6 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-200">
        This is an organizer and CPA-preparation tool only. It does not file taxes, provide legal tax advice, submit IRS forms, or connect to IRS systems.
      </div>

      {taxYears.length > 0 && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Tax Years" value={String(taxYears.length)} />
          <MetricCard
            label="Open Flags"
            value={String(totalFlags)}
            changeType={totalFlags > 0 ? "negative" : "positive"}
          />
          {activeSummary && (
            <>
              <MetricCard
                label={`${activeSummary.year} Income (USD)`}
                value={formatCurrency(activeSummary.totalIncomeUsd)}
              />
              <MetricCard
                label="Documents Complete"
                value={`${activeSummary.documentsReceived}/${activeSummary.documentsRequired}`}
              />
            </>
          )}
        </div>
      )}

      {taxYears.length === 0 ? (
        <EmptyState
          title="Create your first tax year"
          description="Organize banking, real estate, investments, foreign accounts, and documents by tax year. Generate CPA-ready CSV exports when you're ready."
          icon={<FileText className="h-8 w-8" />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {yearsWithSummaries.map(({ year, summary }) => (
            <TaxYearCard
              key={year.id}
              taxYear={year}
              flagCount={summary?.flags.length ?? 0}
              documentsComplete={summary?.documentsReceived ?? 0}
              documentsTotal={summary?.documentsRequired ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
