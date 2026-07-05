import { PageHeader } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { formatCurrency } from "@/lib/utils";
import { Building2 } from "lucide-react";

const placeholderAccounts = [
  {
    name: "Primary Checking",
    institution: "Chase",
    type: "checking" as const,
    balance: 45200,
  },
  {
    name: "High-Yield Savings",
    institution: "Marcus",
    type: "savings" as const,
    balance: 125000,
  },
  {
    name: "Business Checking",
    institution: "Wells Fargo",
    type: "checking" as const,
    balance: 287800,
  },
];

export default function BankingPage() {
  const totalBalance = placeholderAccounts.reduce((s, a) => s + a.balance, 0);

  return (
    <div>
      <PageHeader
        title="Banking Platform"
        description="Account balances and transaction history — read-only, manual entry"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total Cash" value={formatCurrency(totalBalance)} />
        <MetricCard label="Checking" value={formatCurrency(333000)} />
        <MetricCard label="Savings" value={formatCurrency(125000)} />
        <MetricCard
          label="Accounts"
          value={String(placeholderAccounts.length)}
          changeType="neutral"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardCard
            title="Accounts"
            description="Manually entered account balances"
          >
            <div className="space-y-3">
              {placeholderAccounts.map((account) => (
                <div
                  key={account.name}
                  className="flex items-center justify-between rounded-lg border border-navy-700 bg-navy-800 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{account.name}</p>
                    <p className="text-xs text-slate-400">{account.institution}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">
                      {formatCurrency(account.balance)}
                    </p>
                    <StatusBadge status="active" label={account.type} />
                  </div>
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>

        <DashboardCard title="Recent Activity" description="Latest transactions">
          <EmptyState
            title="No transactions yet"
            description="Add transactions manually to track spending and income. Plaid integration coming in a future release."
            icon={<Building2 className="h-8 w-8" />}
          />
        </DashboardCard>
      </div>
    </div>
  );
}
