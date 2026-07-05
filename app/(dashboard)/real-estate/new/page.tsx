import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { PropertyForm } from "@/components/real-estate/PropertyForm";
import { Button } from "@/components/forms/FormFields";

export default function NewPropertyPage() {
  return (
    <div>
      <PageHeader title="Add Property" description="Enter property details for U.S. or Japan rental tracking">
        <Link href="/real-estate">
          <Button variant="secondary">Cancel</Button>
        </Link>
      </PageHeader>

      <DashboardCard title="Property Details" description="All fields support manual data entry">
        <PropertyForm mode="create" />
      </DashboardCard>
    </div>
  );
}
