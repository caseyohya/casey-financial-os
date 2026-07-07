export type FilingStatus =
  | "single"
  | "married_joint"
  | "married_separate"
  | "head_of_household"
  | "qualifying_widow";

export type TaxYearStatus = "draft" | "in_progress" | "ready_for_cpa" | "filed";

export type Currency = "USD" | "JPY";

export type DocumentType =
  | "w2"
  | "1099_int"
  | "1099_div"
  | "1099_b"
  | "1099_misc"
  | "1099_nec"
  | "k1"
  | "mortgage_interest"
  | "property_tax"
  | "charitable"
  | "foreign_income"
  | "fbar_support"
  | "form_8938_support"
  | "schedule_e_support"
  | "depreciation_schedule"
  | "other";

export type IncomeType =
  | "wages"
  | "interest"
  | "dividends"
  | "rental"
  | "foreign_interest"
  | "capital_gain"
  | "k1_ordinary"
  | "royalties"
  | "other";

export type ExpenseType =
  | "mortgage_interest"
  | "property_tax"
  | "repairs"
  | "insurance"
  | "management"
  | "utilities"
  | "depreciation"
  | "other";

export type DeductionType =
  | "idc"
  | "charitable"
  | "medical"
  | "state_tax"
  | "mortgage_interest"
  | "depletion"
  | "section_179"
  | "other";

export type ExportType =
  | "cpa_package"
  | "fbar"
  | "form_8938"
  | "schedule_e"
  | "k1_summary"
  | "annual_summary";

export interface TaxYear {
  id: string;
  user_id: string;
  year: number;
  filing_status: FilingStatus;
  status: TaxYearStatus;
  usd_to_jpy_rate: number | null;
  jpy_to_usd_rate: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaxDocument {
  id: string;
  user_id: string;
  tax_year_id: string;
  name: string;
  document_type: DocumentType;
  file_path: string | null;
  file_size: number | null;
  mime_type: string | null;
  is_required: boolean;
  is_received: boolean;
  notes: string | null;
  uploaded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaxAccount {
  id: string;
  user_id: string;
  tax_year_id: string;
  account_name: string;
  institution: string;
  country: "US" | "JP" | "OTHER";
  currency: Currency;
  account_type: "checking" | "savings" | "brokerage" | "retirement" | "other";
  account_number_last4: string | null;
  is_foreign: boolean;
  year_end_balance: number | null;
  max_annual_balance: number | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaxIncomeItem {
  id: string;
  user_id: string;
  tax_year_id: string;
  income_type: IncomeType;
  description: string;
  amount: number;
  currency: Currency;
  source: string | null;
  is_foreign: boolean;
  country: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaxExpenseItem {
  id: string;
  user_id: string;
  tax_year_id: string;
  expense_type: ExpenseType;
  description: string;
  amount: number;
  currency: Currency;
  property_name: string | null;
  schedule_e_line: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaxDeduction {
  id: string;
  user_id: string;
  tax_year_id: string;
  deduction_type: DeductionType;
  description: string;
  amount: number;
  currency: Currency;
  investment_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaxForeignAccount {
  id: string;
  user_id: string;
  tax_year_id: string;
  account_name: string;
  institution: string;
  country: string;
  currency: Currency;
  account_type: "bank" | "securities" | "retirement" | "other";
  account_number: string | null;
  max_value_usd: number | null;
  year_end_value_usd: number | null;
  year_end_value_local: number | null;
  max_value_local: number | null;
  interest_earned: number;
  interest_currency: Currency;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaxFbarItem {
  id: string;
  user_id: string;
  tax_year_id: string;
  foreign_account_id: string | null;
  account_name: string;
  institution_name: string;
  country: string;
  account_number: string | null;
  max_value_usd: number | null;
  year_end_value_usd: number | null;
  account_type: "bank" | "securities" | "other";
  jointly_owned: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaxForm8938Item {
  id: string;
  user_id: string;
  tax_year_id: string;
  foreign_account_id: string | null;
  asset_description: string;
  institution: string;
  country: string;
  account_number: string | null;
  max_value_during_year: number | null;
  year_end_value: number | null;
  asset_type: "deposit" | "custodial" | "other";
  currency: Currency;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaxScheduleEItem {
  id: string;
  user_id: string;
  tax_year_id: string;
  property_name: string;
  property_address: string;
  days_rented: number;
  days_personal_use: number;
  gross_rents: number;
  advertising: number;
  auto_travel: number;
  cleaning: number;
  commissions: number;
  insurance: number;
  legal_professional: number;
  management_fees: number;
  mortgage_interest: number;
  other_interest: number;
  repairs: number;
  supplies: number;
  taxes: number;
  utilities: number;
  depreciation: number;
  other_expenses: number;
  currency: Currency;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaxK1Item {
  id: string;
  user_id: string;
  tax_year_id: string;
  entity_name: string;
  entity_ein: string | null;
  box_1_ordinary_income: number;
  box_2_net_rental: number;
  box_3_other_rental: number;
  box_4_guaranteed_payments: number;
  box_5_interest: number;
  box_6a_ordinary_dividends: number;
  box_6b_qualified_dividends: number;
  box_7_royalties: number;
  box_8_net_short_term: number;
  box_9a_net_long_term: number;
  box_9b_collectibles: number;
  box_9c_unrecaptured_1250: number;
  box_10_net_section_1231: number;
  box_11_other_income: number;
  box_12_section_179: number;
  box_13_other_deductions: number;
  box_14_self_employment: number;
  box_15_credits: number;
  box_16_foreign_transactions: number;
  box_17_amt_items: number;
  box_18_tax_exempt: number;
  box_19_distributions: number;
  box_20_other_info: string | null;
  idc_deduction: number;
  depletion: number;
  currency: Currency;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaxDepreciationItem {
  id: string;
  user_id: string;
  tax_year_id: string;
  property_name: string;
  asset_description: string;
  date_acquired: string | null;
  cost_basis: number;
  depreciation_method: "macrs" | "straight_line" | "other";
  useful_life_years: number | null;
  prior_depreciation: number;
  current_year_depreciation: number;
  accumulated_depreciation: number;
  remaining_basis: number;
  schedule_e_item_id: string | null;
  currency: Currency;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaxExport {
  id: string;
  user_id: string;
  tax_year_id: string;
  export_type: ExportType;
  file_name: string;
  file_path: string | null;
  generated_at: string;
  notes: string | null;
}

export interface TaxYearWithRelations extends TaxYear {
  documents: TaxDocument[];
  accounts: TaxAccount[];
  income_items: TaxIncomeItem[];
  expense_items: TaxExpenseItem[];
  deductions: TaxDeduction[];
  foreign_accounts: TaxForeignAccount[];
  fbar_items: TaxFbarItem[];
  form_8938_items: TaxForm8938Item[];
  schedule_e_items: TaxScheduleEItem[];
  k1_items: TaxK1Item[];
  depreciation_items: TaxDepreciationItem[];
  exports: TaxExport[];
}

export interface TaxYearFormData {
  year: number;
  filing_status: FilingStatus;
  status: TaxYearStatus;
  usd_to_jpy_rate?: number | null;
  jpy_to_usd_rate?: number | null;
  notes?: string;
}

export const FILING_STATUS_LABELS: Record<FilingStatus, string> = {
  single: "Single",
  married_joint: "Married Filing Jointly",
  married_separate: "Married Filing Separately",
  head_of_household: "Head of Household",
  qualifying_widow: "Qualifying Widow(er)",
};

export const TAX_YEAR_STATUS_LABELS: Record<TaxYearStatus, string> = {
  draft: "Draft",
  in_progress: "In Progress",
  ready_for_cpa: "Ready for CPA",
  filed: "Filed",
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  w2: "W-2",
  "1099_int": "1099-INT",
  "1099_div": "1099-DIV",
  "1099_b": "1099-B",
  "1099_misc": "1099-MISC",
  "1099_nec": "1099-NEC",
  k1: "K-1",
  mortgage_interest: "Mortgage Interest (1098)",
  property_tax: "Property Tax",
  charitable: "Charitable Donations",
  foreign_income: "Foreign Income",
  fbar_support: "FBAR Support",
  form_8938_support: "Form 8938 Support",
  schedule_e_support: "Schedule E Support",
  depreciation_schedule: "Depreciation Schedule",
  other: "Other",
};

export const DEFAULT_DOCUMENT_CHECKLIST: { document_type: DocumentType; name: string }[] = [
  { document_type: "w2", name: "W-2 Wage Statements" },
  { document_type: "1099_int", name: "1099-INT Interest Income" },
  { document_type: "1099_div", name: "1099-DIV Dividend Income" },
  { document_type: "1099_b", name: "1099-B Brokerage Sales" },
  { document_type: "k1", name: "K-1 Partnership/S-Corp Statements" },
  { document_type: "mortgage_interest", name: "1098 Mortgage Interest" },
  { document_type: "property_tax", name: "Property Tax Statements" },
  { document_type: "charitable", name: "Charitable Contribution Receipts" },
  { document_type: "foreign_income", name: "Foreign Income Documentation" },
  { document_type: "fbar_support", name: "FBAR Account Statements" },
  { document_type: "form_8938_support", name: "Form 8938 Asset Documentation" },
  { document_type: "schedule_e_support", name: "Schedule E Rental Records" },
  { document_type: "depreciation_schedule", name: "Depreciation Schedules" },
];

export interface TaxFlag {
  type: "missing_document" | "missing_balance" | "missing_max_balance";
  severity: "warning" | "error";
  message: string;
  entityId?: string;
  entityName?: string;
}

export interface AnnualTaxSummary {
  year: number;
  totalIncomeUsd: number;
  totalExpensesUsd: number;
  totalDeductionsUsd: number;
  foreignInterestIncome: number;
  rentalIncome: number;
  rentalExpenses: number;
  rentalNetIncome: number;
  idcDeductions: number;
  k1OrdinaryIncome: number;
  k1TotalDeductions: number;
  depreciationTotal: number;
  fbarAccountCount: number;
  fbarTotalMaxValue: number;
  form8938AccountCount: number;
  form8938TotalValue: number;
  documentsReceived: number;
  documentsRequired: number;
  flags: TaxFlag[];
}
