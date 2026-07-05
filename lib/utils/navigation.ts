import type { NavItem } from "@/lib/types";

export const NAV_ITEMS: NavItem[] = [
  {
    id: "executive-dashboard",
    label: "Executive Dashboard",
    href: "/executive-dashboard",
    description: "Unified overview of your entire financial position",
    icon: "LayoutDashboard",
  },
  {
    id: "financial-hub",
    label: "Financial Hub",
    href: "/financial-hub",
    description: "Central command for net worth and cash flow",
    icon: "Landmark",
  },
  {
    id: "banking",
    label: "Banking Platform",
    href: "/banking",
    description: "Accounts, balances, and transaction history",
    icon: "Building2",
  },
  {
    id: "real-estate",
    label: "Real Estate",
    href: "/real-estate",
    description: "Property portfolio and equity tracking",
    icon: "Home",
  },
  {
    id: "investments",
    label: "Investments",
    href: "/investments",
    description: "Holdings, allocation, and portfolio performance",
    icon: "TrendingUp",
  },
  {
    id: "tax",
    label: "Tax Intelligence",
    href: "/tax",
    description: "CPA-ready tax preparation organizer",
    icon: "FileText",
  },
];

export const APP_NAME = "Casey Financial OS";
export const APP_TAGLINE = "Your personal financial command center";
