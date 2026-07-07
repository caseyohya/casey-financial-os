import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { InvestmentForm } from "@/components/investments/InvestmentForm";
import { EntityForm } from "@/components/investments/EntityForm";
import { getInvestmentEntities } from "@/lib/data/investments";
import { Button } from "@/components/forms/FormFields";

export default async function NewInvestmentPage() {
  const entities = await getInvestmentEntities();

  return (
    <div>
      <PageHeader title="Add Investment" description="Track a private investment, fund, or precious metals position">
        <Link href="/investments">
          <Button variant="secondary">Cancel</Button>
        </Link>
      </PageHeader>

      <DashboardCard title="Investment Entity" description="LLCs, LPs, funds, and SPVs">
        <EntityForm />
      </DashboardCard>

      <DashboardCard title="Investment Details" description="Manual entry — no brokerage connection">
        <InvestmentForm mode="create" entities={entities} />
      </DashboardCard>
    </div>
  );
}
