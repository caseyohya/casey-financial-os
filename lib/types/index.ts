export type AppModule =
  | "financial-hub"
  | "banking"
  | "real-estate"
  | "investments"
  | "tax"
  | "executive-dashboard";

export interface NavItem {
  id: AppModule;
  label: string;
  href: string;
  description: string;
  icon: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface BankAccount {
  id: string;
  user_id: string;
  name: string;
  institution: string;
  account_type: "checking" | "savings" | "credit" | "loan" | "other";
  balance: number;
  currency: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  description: string;
  amount: number;
  category: string;
  transaction_date: string;
  is_income: boolean;
  notes: string | null;
  created_at: string;
}

export interface RealEstateProperty {
  id: string;
  user_id: string;
  name: string;
  address: string;
  property_type: "primary" | "rental" | "commercial" | "land" | "other";
  purchase_price: number;
  current_value: number;
  mortgage_balance: number;
  monthly_rent: number | null;
  monthly_expenses: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvestmentHolding {
  id: string;
  user_id: string;
  symbol: string;
  name: string;
  asset_type: "stock" | "etf" | "bond" | "crypto" | "mutual_fund" | "other";
  quantity: number;
  cost_basis: number;
  current_price: number;
  account_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaxRecord {
  id: string;
  user_id: string;
  tax_year: number;
  filing_status: string;
  gross_income: number;
  taxable_income: number;
  federal_tax: number;
  state_tax: number;
  effective_rate: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface NetWorthSnapshot {
  id: string;
  user_id: string;
  snapshot_date: string;
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  notes: string | null;
  created_at: string;
}

export interface DashboardMetric {
  label: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}
