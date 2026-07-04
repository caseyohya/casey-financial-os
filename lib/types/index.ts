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
  country: "US" | "JP";
  exchange_rate_to_usd: number | null;
  is_active: boolean;
  data_source: "manual" | "csv" | "plaid";
  plaid_item_id: string | null;
  plaid_account_id: string | null;
  last_synced_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type TransactionType = "income" | "expense" | "transfer" | "investment";
export type DataSource = "manual" | "csv" | "plaid";
export type Country = "US" | "JP";
export type Currency = "USD" | "JPY";

export interface TransactionCategory {
  id: string;
  user_id: string;
  name: string;
  transaction_type: TransactionType;
  color: string;
  is_system: boolean;
  created_at: string;
}

export interface BankTransaction {
  id: string;
  user_id: string;
  account_id: string;
  description: string;
  amount: number;
  currency: string;
  exchange_rate_to_usd: number | null;
  transaction_type: TransactionType;
  category_id: string | null;
  category_name: string;
  transaction_date: string;
  is_recurring: boolean;
  recurring_transaction_id: string | null;
  import_file_id: string | null;
  external_id: string | null;
  data_source: DataSource;
  notes: string | null;
  created_at: string;
}

export interface BankBalance {
  id: string;
  user_id: string;
  account_id: string;
  balance: number;
  balance_date: string;
  currency: string;
  exchange_rate_to_usd: number | null;
  notes: string | null;
  data_source: DataSource;
  created_at: string;
}

export interface RecurringTransaction {
  id: string;
  user_id: string;
  account_id: string;
  description: string;
  amount: number;
  currency: string;
  exchange_rate_to_usd: number | null;
  transaction_type: TransactionType;
  category_id: string | null;
  frequency: "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly";
  next_occurrence: string | null;
  last_occurrence: string | null;
  is_active: boolean;
  data_source: DataSource;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CashFlowMonthly {
  id: string;
  user_id: string;
  year: number;
  month: number;
  currency: string;
  total_income: number;
  total_expenses: number;
  total_transfers: number;
  total_investments: number;
  net_cash_flow: number;
  exchange_rate_to_usd: number | null;
  computed_at: string;
}

export interface ImportFile {
  id: string;
  user_id: string;
  account_id: string | null;
  filename: string;
  file_size: number | null;
  column_mapping: ColumnMapping | null;
  status: "pending" | "mapped" | "imported" | "failed";
  row_count: number;
  imported_count: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface ColumnMapping {
  date: string;
  description: string;
  amount: string;
  category?: string;
  type?: string;
}

export interface BankingFilters {
  accountId: string;
  month: string;
  categoryId: string;
  country: string;
  currency: string;
}

/** @deprecated Use BankTransaction */
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
