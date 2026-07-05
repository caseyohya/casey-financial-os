import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { PropertyMetricsGrid } from "@/components/real-estate/PropertyMetricsGrid";
import { IncomeExpenseForms } from "@/components/real-estate/IncomeExpenseForms";
import { TenantForm } from "@/components/real-estate/TenantForm";
import { DocumentUploadForm } from "@/components/real-estate/DocumentUploadForm";
import { MonthlySummaryPanel } from "@/components/real-estate/MonthlySummaryPanel";
import { ExportButtons } from "@/components/real-estate/ExportButtons";
import { getPropertyById, formatPropertyAddress } from "@/lib/data/real-estate";
import { calculatePropertyMetrics, detectVacancyPeriods } from "@/lib/calculations/real-estate";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/forms/FormFields";
import { Pencil } from "lucide-react";
import { MortgageForm } from "@/components/real-estate/MortgageForm";
import { StatusBadge } from "@/components/dashboard/StatusBadge";

interface PropertyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  const { id } = await params;
  const property = await getPropertyById(id);

  if (!property) notFound();

  const metrics = calculatePropertyMetrics(
    property,
    property.mortgages ?? [],
    property.income ?? [],
    property.expenses ?? []
  );

  const vacancyPeriods = detectVacancyPeriods(property.tenants ?? []);

  return (
    <div>
      <PageHeader
        title={property.name}
        description={formatPropertyAddress(property)}
      >
        <div className="flex items-center gap-2">
          <StatusBadge status="active" label={`${property.country} · ${property.currency}`} />
          <Link href={`/real-estate/${id}/edit`}>
            <Button variant="secondary">
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </PageHeader>

      <PropertyMetricsGrid metrics={metrics} currency={property.currency} />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Property Details">
          <div className="space-y-3 text-sm">
            {[
              ["Purchase Price", formatCurrency(property.purchase_price, property.currency)],
              ["Purchase Date", property.purchase_date ? formatDate(property.purchase_date) : "—"],
              ["Current Value", formatCurrency(property.current_value, property.currency)],
              ["Land Value", formatCurrency(property.land_value, property.currency)],
              ["Building Value", formatCurrency(property.building_value, property.currency)],
              ["Loan Balance", formatCurrency(property.loan_balance, property.currency)],
              ["Interest Rate", property.interest_rate ? `${property.interest_rate}%` : "—"],
              ["Monthly Rent", formatCurrency(property.monthly_rent, property.currency)],
              ["HOA (Monthly)", formatCurrency(property.hoa_monthly, property.currency)],
              ["Taxes (Annual)", formatCurrency(property.taxes_annual, property.currency)],
              ["Insurance (Annual)", formatCurrency(property.insurance_annual, property.currency)],
              ["Maintenance (Monthly)", formatCurrency(property.maintenance_monthly, property.currency)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-navy-700 pb-2 last:border-0">
                <span className="text-slate-400">{label}</span>
                <span className="font-medium text-white">{value}</span>
              </div>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard title="Mortgages" description="Active loan accounts">
          {(property.mortgages ?? []).length === 0 ? (
            <p className="text-sm text-slate-500">No mortgages recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {(property.mortgages ?? []).map((m) => (
                <div key={m.id} className="rounded-lg border border-navy-700 bg-navy-800 p-3 text-sm">
                  <p className="font-medium text-white">{m.lender || "Mortgage"}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-400">
                    <span>Balance: {formatCurrency(m.current_balance, m.currency)}</span>
                    <span>Rate: {m.interest_rate}%</span>
                    <span>Payment: {formatCurrency(m.monthly_payment, m.currency)}/mo</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <MortgageForm propertyId={id} currency={property.currency} />
        </DashboardCard>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Income & Expenses" description="Track monthly rent and operating costs">
          <IncomeExpenseForms propertyId={id} currency={property.currency} />
          {(property.income ?? []).length > 0 && (
            <div className="mt-6 space-y-2">
              <h4 className="text-xs font-semibold uppercase text-slate-500">Recent Income</h4>
              {(property.income ?? []).slice(0, 5).map((i) => (
                <div key={i.id} className="flex justify-between text-sm">
                  <span className="text-slate-400">{formatDate(i.income_date)} — {i.income_type}</span>
                  <span className="text-white">{formatCurrency(i.amount, i.currency)}</span>
                </div>
              ))}
            </div>
          )}
          {(property.expenses ?? []).length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-xs font-semibold uppercase text-slate-500">Recent Expenses</h4>
              {(property.expenses ?? []).slice(0, 5).map((e) => (
                <div key={e.id} className="flex justify-between text-sm">
                  <span className="text-slate-400">{formatDate(e.expense_date)} — {e.category}</span>
                  <span className="text-white">{formatCurrency(e.amount, e.currency)}</span>
                </div>
              ))}
            </div>
          )}
        </DashboardCard>

        <DashboardCard title="Tenants & Vacancy" description="Lease tracking and vacancy periods">
          <TenantForm propertyId={id} currency={property.currency} />
          {(property.tenants ?? []).length > 0 && (
            <div className="mt-6 space-y-3">
              {(property.tenants ?? []).map((t) => (
                <div key={t.id} className="rounded-lg border border-navy-700 bg-navy-800 p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-white">{t.name}</span>
                    <StatusBadge status={t.status === "active" ? "active" : "inactive"} label={t.status} />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {formatDate(t.lease_start)} — {t.lease_end ? formatDate(t.lease_end) : "Present"}
                  </p>
                  <p className="text-xs text-slate-400">{formatCurrency(t.monthly_rent, t.currency)}/mo</p>
                </div>
              ))}
            </div>
          )}
          {vacancyPeriods.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-semibold uppercase text-slate-500">Vacancy Periods</h4>
              {vacancyPeriods.map((v, i) => (
                <p key={i} className="mt-1 text-sm text-amber-400">
                  {formatDate(v.start)} → {formatDate(v.end)} ({v.days} days)
                </p>
              ))}
            </div>
          )}
        </DashboardCard>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Monthly Summary" description="Aggregated NOI, mortgage splits, and cash flow by month">
          <MonthlySummaryPanel
            propertyId={id}
            currency={property.currency}
            summaries={property.monthly_summaries ?? []}
          />
        </DashboardCard>

        <DashboardCard title="Documents" description="Leases, mortgage statements, tax bills, insurance, repairs">
          <DocumentUploadForm propertyId={id} />
          {(property.documents ?? []).length > 0 && (
            <div className="mt-4 space-y-2">
              {(property.documents ?? []).map((d) => (
                <div key={d.id} className="flex justify-between text-sm">
                  <span className="text-slate-300">{d.name}</span>
                  <span className="text-xs capitalize text-slate-500">{d.document_type.replace("_", " ")}</span>
                </div>
              ))}
            </div>
          )}
        </DashboardCard>
      </div>

      <div className="mt-8">
        <DashboardCard title="CPA Exports" description="Schedule E and comprehensive CSV for your accountant">
          <ExportButtons />
        </DashboardCard>
      </div>
    </div>
  );
}
