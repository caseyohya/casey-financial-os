import type { Property } from "@/lib/types/real-estate";

export function formatPropertyAddress(property: Property): string {
  const parts = [
    property.address_line1,
    property.city,
    property.state_province,
    property.postal_code,
    property.country === "JP" ? "Japan" : "USA",
  ].filter(Boolean);
  return parts.join(", ");
}
