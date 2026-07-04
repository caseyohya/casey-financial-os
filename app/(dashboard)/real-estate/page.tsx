import { PageHeader } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { formatCurrency } from "@/lib/utils";
import { Home } from "lucide-react";

const placeholderProperties = [
  {
    name: "Primary Residence",
    address: "123 Executive Blvd, San Francisco, CA",
    type: "primary" as const,
    value: 1850000,
    mortgage: 620000,
    equity: 1230000,
  },
  {
    name: "Rental Property — Oak St",
    address: "456 Oak Street, Austin, TX",
    type: "rental" as const,
    value: 485000,
    mortgage: 210000,
    equity: 275000,
  },
];

export default function RealEstatePage() {
  const totalValue = placeholderProperties.reduce((s, p) => s + p.value, 0);
  const totalEquity = placeholderProperties.reduce((s, p) => s + p.equity, 0);
  const totalMortgage = placeholderProperties.reduce((s, p) => s + p.mortgage, 0);

  return (
    <div>
      <PageHeader
        title="Real Estate Platform"
        description="Property portfolio, equity tracking, and rental income"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Portfolio Value" value={formatCurrency(totalValue)} />
        <MetricCard
          label="Total Equity"
          value={formatCurrency(totalEquity)}
          change="+5.2% YTD"
          changeType="positive"
        />
        <MetricCard label="Mortgage Balance" value={formatCurrency(totalMortgage)} />
        <MetricCard label="Properties" value={String(placeholderProperties.length)} />
      </div>

      <div className="mt-8">
        <DashboardCard title="Properties" description="Your real estate holdings">
          <div className="space-y-4">
            {placeholderProperties.map((property) => (
              <div
                key={property.name}
                className="rounded-lg border border-navy-700 bg-navy-800 p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-white">{property.name}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{property.address}</p>
                  </div>
                  <span className="rounded-full bg-navy-700 px-2.5 py-0.5 text-xs capitalize text-slate-300">
                    {property.type}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-slate-500">Value</p>
                    <p className="font-medium text-white">{formatCurrency(property.value)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Mortgage</p>
                    <p className="font-medium text-white">{formatCurrency(property.mortgage)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Equity</p>
                    <p className="font-medium text-emerald-400">{formatCurrency(property.equity)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>

      <div className="mt-8">
        <DashboardCard title="Add Property" description="Manual data entry">
          <EmptyState
            title="Track more properties"
            description="Add rental properties, commercial holdings, or land to build a complete real estate portfolio view."
            icon={<Home className="h-8 w-8" />}
          />
        </DashboardCard>
      </div>
    </div>
  );
}
