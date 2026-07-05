import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { PropertyForm } from "@/components/real-estate/PropertyForm";
import { DeletePropertyButton } from "@/components/real-estate/DeletePropertyButton";
import { getPropertyById } from "@/lib/data/real-estate";
import { Button } from "@/components/forms/FormFields";

interface EditPropertyPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPropertyPage({ params }: EditPropertyPageProps) {
  const { id } = await params;
  const property = await getPropertyById(id);

  if (!property) notFound();

  return (
    <div>
      <PageHeader title={`Edit ${property.name}`} description="Update property details">
        <Link href={`/real-estate/${id}`}>
          <Button variant="secondary">Cancel</Button>
        </Link>
      </PageHeader>

      <DashboardCard title="Property Details">
        <PropertyForm property={property} mode="edit" />
      </DashboardCard>

      <div className="mt-8">
        <DashboardCard title="Danger Zone" description="Permanently remove this property and all related records">
          <DeletePropertyButton propertyId={id} propertyName={property.name} />
        </DashboardCard>
      </div>
    </div>
  );
}
