export type PropertyCountry = "US" | "JP";
export type PropertyCurrency = "USD" | "JPY";
export type PropertyType = "rental" | "primary" | "commercial" | "land" | "other";
export type IncomeType = "rent" | "late_fee" | "parking" | "laundry" | "other";
export type ExpenseCategory =
  | "hoa"
  | "taxes"
  | "insurance"
  | "maintenance"
  | "repairs"
  | "management"
  | "utilities"
  | "mortgage_principal"
  | "mortgage_interest"
  | "other";
export type TenantStatus = "active" | "vacated" | "pending";
export type DocumentType =
  | "lease"
  | "mortgage_statement"
  | "tax_bill"
  | "insurance"
  | "repair"
  | "other";
export type ValuationSource = "manual" | "appraisal" | "market_estimate";

export interface Property {
  id: string;
  user_id: string;
  name: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state_province: string | null;
  postal_code: string | null;
  country: PropertyCountry;
  currency: PropertyCurrency;
  property_type: PropertyType;
  purchase_price: number;
  purchase_date: string | null;
  current_value: number;
  land_value: number;
  building_value: number;
  loan_balance: number;
  interest_rate: number | null;
  monthly_rent: number;
  hoa_monthly: number;
  taxes_annual: number;
  insurance_annual: number;
  maintenance_monthly: number;
  vacancy_rate_percent: number;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PropertyOwner {
  id: string;
  property_id: string;
  user_id: string;
  owner_name: string;
  ownership_percent: number;
  is_primary: boolean;
  notes: string | null;
  created_at: string;
}

export interface PropertyMortgage {
  id: string;
  property_id: string;
  lender: string;
  original_amount: number;
  current_balance: number;
  interest_rate: number;
  monthly_payment: number;
  start_date: string | null;
  term_months: number;
  currency: PropertyCurrency;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PropertyIncome {
  id: string;
  property_id: string;
  income_date: string;
  amount: number;
  currency: PropertyCurrency;
  income_type: IncomeType;
  tenant_id: string | null;
  is_vacancy_period: boolean;
  notes: string | null;
  created_at: string;
}

export interface PropertyExpense {
  id: string;
  property_id: string;
  expense_date: string;
  amount: number;
  currency: PropertyCurrency;
  category: ExpenseCategory;
  description: string | null;
  notes: string | null;
  created_at: string;
}

export interface PropertyTenant {
  id: string;
  property_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  lease_start: string;
  lease_end: string | null;
  monthly_rent: number;
  deposit: number;
  currency: PropertyCurrency;
  status: TenantStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PropertyValuation {
  id: string;
  property_id: string;
  valuation_date: string;
  value: number;
  currency: PropertyCurrency;
  source: ValuationSource;
  notes: string | null;
  created_at: string;
}

export interface PropertyDepreciation {
  id: string;
  property_id: string;
  tax_year: number;
  building_basis: number;
  land_basis: number;
  depreciation_method: string;
  useful_life_years: number;
  annual_depreciation: number;
  accumulated_depreciation: number;
  currency: PropertyCurrency;
  notes: string | null;
  created_at: string;
}

export interface PropertyDocument {
  id: string;
  property_id: string;
  user_id: string;
  name: string;
  document_type: DocumentType;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  notes: string | null;
  uploaded_at: string;
}

export interface PropertyMonthlySummary {
  id: string;
  property_id: string;
  year: number;
  month: number;
  gross_rent: number;
  vacancy_loss: number;
  other_income: number;
  total_income: number;
  operating_expenses: number;
  mortgage_principal: number;
  mortgage_interest: number;
  net_operating_income: number;
  cash_flow: number;
  currency: PropertyCurrency;
  created_at: string;
  updated_at: string;
}

export interface PropertyWithRelations extends Property {
  mortgages?: PropertyMortgage[];
  tenants?: PropertyTenant[];
  income?: PropertyIncome[];
  expenses?: PropertyExpense[];
  documents?: PropertyDocument[];
  monthly_summaries?: PropertyMonthlySummary[];
  depreciation?: PropertyDepreciation[];
}

export interface PropertyFormData {
  name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state_province?: string;
  postal_code?: string;
  country: PropertyCountry;
  currency: PropertyCurrency;
  property_type: PropertyType;
  purchase_price: number;
  purchase_date?: string;
  current_value: number;
  land_value: number;
  building_value: number;
  loan_balance: number;
  interest_rate?: number;
  monthly_rent: number;
  hoa_monthly: number;
  taxes_annual: number;
  insurance_annual: number;
  maintenance_monthly: number;
  vacancy_rate_percent: number;
  notes?: string;
}

export interface PropertyMetrics {
  equity: number;
  loanToValue: number;
  monthlyNOI: number;
  annualNOI: number;
  monthlyCashFlow: number;
  annualCashFlow: number;
  capRate: number;
  cashOnCashReturn: number;
  debtServiceCoverageRatio: number;
  annualDepreciation: number;
  grossMonthlyRent: number;
  vacancyLoss: number;
  operatingExpenses: number;
  debtService: number;
}

export interface PortfolioMetrics {
  byCurrency: Record<
    PropertyCurrency,
    {
      totalValue: number;
      totalEquity: number;
      totalLoanBalance: number;
      totalMonthlyNOI: number;
      totalMonthlyCashFlow: number;
      propertyCount: number;
      avgCapRate: number;
    }
  >;
  totalProperties: number;
}
