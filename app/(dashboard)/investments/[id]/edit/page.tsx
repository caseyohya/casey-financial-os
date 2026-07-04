import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { InvestmentForm } from "@/components/investments/InvestmentForm";
import { getInvestmentById, getInvestmentEntities } from "@/lib/data/investments";
import { Button } from "@/components/forms/FormFields";

interface EditInvestmentPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditInvestmentPage({ params }: EditInvestmentPageProps) {
  const { id } = await params;
  const [investment, entities] = await Promise.all([
    getInvestmentById(id),
    getInvestmentEntities(),
  ]);

  if (!investment) notFound();

  return (
    <div>
      <PageHeader title={`Edit ${investment.name}`} description="Update investment details">
        <Link href={`/investments/${id}`}>
          <Button variant="secondary">Cancel</Button>
        </Link>
      </PageHeader>

      <DashboardCard title="Investment Details">
        <InvestmentForm investment={investment} entities={entities} mode="edit" />
      </DashboardCard>
    </div>
  );
}
