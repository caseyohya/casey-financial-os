export type AccountType =
  | "checking"
  | "savings"
  | "brokerage"
  | "retirement"
  | "credit"
  | "loan"
  | "other";

export type AssetType =
  | "cash"
  | "real_estate"
  | "investment"
  | "precious_metal"
  | "vehicle"
  | "other";

export type LiabilityType =
  | "mortgage"
  | "credit_card"
  | "student_loan"
  | "auto_loan"
  | "personal_loan"
  | "other";

export type IncomeFrequency =
  | "one_time"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "quarterly"
  | "annually";

export type ExpenseFrequency = IncomeFrequency;

export interface HubAccount {
  id: string;
  user_id: string;
  name: string;
  account_type: AccountType;
  currency_code: "USD" | "JPY";
  country: "US" | "JP";
  balance: number;
  institution: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HubAsset {
  id: string;
  user_id: string;
  name: string;
  asset_type: AssetType;
  category: string | null;
  currency_code: "USD" | "JPY";
  country: "US" | "JP";
  current_value: number;
  acquisition_date: string | null;
  acquisition_cost: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface HubLiability {
  id: string;
  user_id: string;
  name: string;
  liability_type: LiabilityType;
  category: string | null;
  currency_code: "USD" | "JPY";
  country: "US" | "JP";
  current_balance: number;
  interest_rate: number | null;
  maturity_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface HubIncomeSource {
  id: string;
  user_id: string;
  name: string;
  income_type: string;
  category: string | null;
  currency_code: "USD" | "JPY";
  country: "US" | "JP";
  amount: number;
  frequency: IncomeFrequency;
  is_passive: boolean;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface HubExpense {
  id: string;
  user_id: string;
  name: string;
  expense_type: string;
  category: string | null;
  currency_code: "USD" | "JPY";
  country: "US" | "JP";
  amount: number;
  frequency: ExpenseFrequency;
  is_fixed: boolean;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinancialHubData {
  accounts: HubAccount[];
  assets: HubAsset[];
  liabilities: HubLiability[];
  incomeSources: HubIncomeSource[];
  expenses: HubExpense[];
}

export interface FinancialHubMetrics {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyCashFlow: number;
  passiveIncome: number;
  liquidAssets: number;
}
