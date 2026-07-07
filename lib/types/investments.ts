export type InvestmentCategory =
  | "oil_gas"
  | "startups"
  | "venture_funds"
  | "private_equity"
  | "software"
  | "gold"
  | "silver"
  | "platinum"
  | "other_private";

export type InvestmentCurrency = "USD" | "JPY";
export type InvestmentCountry = "US" | "JP" | "OTHER";
export type InvestmentStatus = "active" | "exited" | "written_off" | "pending";

export type TransactionType =
  | "capital_contribution"
  | "additional_contribution"
  | "withdrawal"
  | "realized_gain"
  | "realized_loss"
  | "return_of_capital"
  | "fee"
  | "other";

export type DistributionType = "cash" | "return_of_capital" | "income" | "dividend" | "other";
export type CapitalCallStatus = "pending" | "funded" | "overdue" | "cancelled";
export type TaxItemType =
  | "ordinary_income"
  | "capital_gain"
  | "capital_loss"
  | "idc_deduction"
  | "depletion"
  | "section_179"
  | "interest_income"
  | "dividend"
  | "foreign_tax"
  | "other";

export type MetalType = "gold" | "silver" | "platinum";
export type DocumentType = "k1" | "subscription" | "capital_call" | "distribution" | "valuation" | "other";

export interface InvestmentEntity {
  id: string;
  user_id: string;
  name: string;
  entity_type: string;
  ein: string | null;
  country: InvestmentCountry;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Investment {
  id: string;
  user_id: string;
  entity_id: string | null;
  name: string;
  category: InvestmentCategory;
  purchase_date: string | null;
  invested_capital: number;
  current_value: number;
  ownership_percent: number;
  currency: InvestmentCurrency;
  country: InvestmentCountry;
  status: InvestmentStatus;
  tax_basis: number;
  remaining_basis: number;
  idc_deduction_total: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvestmentTransaction {
  id: string;
  investment_id: string;
  transaction_date: string;
  transaction_type: TransactionType;
  amount: number;
  currency: InvestmentCurrency;
  description: string | null;
  notes: string | null;
  created_at: string;
}

export interface InvestmentDistribution {
  id: string;
  investment_id: string;
  distribution_date: string;
  amount: number;
  currency: InvestmentCurrency;
  distribution_type: DistributionType;
  tax_year: number | null;
  notes: string | null;
  created_at: string;
}

export interface InvestmentCapitalCall {
  id: string;
  investment_id: string;
  call_date: string;
  amount: number;
  currency: InvestmentCurrency;
  due_date: string | null;
  status: CapitalCallStatus;
  funded_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvestmentValuation {
  id: string;
  investment_id: string;
  valuation_date: string;
  value: number;
  currency: InvestmentCurrency;
  source: string;
  notes: string | null;
  created_at: string;
}

export interface InvestmentTaxItem {
  id: string;
  investment_id: string;
  tax_year: number;
  item_type: TaxItemType;
  amount: number;
  k1_line: string | null;
  description: string | null;
  notes: string | null;
  created_at: string;
}

export interface PreciousMetal {
  id: string;
  user_id: string;
  investment_id: string | null;
  metal_type: MetalType;
  quantity: number;
  unit: string;
  unit_cost: number;
  spot_value: number;
  storage_location: string | null;
  currency: InvestmentCurrency;
  purchase_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvestmentDocument {
  id: string;
  investment_id: string;
  user_id: string;
  name: string;
  document_type: DocumentType;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  tax_year: number | null;
  notes: string | null;
  uploaded_at: string;
}

export interface InvestmentMonthlySummary {
  id: string;
  investment_id: string;
  year: number;
  month: number;
  invested_capital: number;
  current_value: number;
  distributions_mtd: number;
  capital_calls_mtd: number;
  unrealized_gain: number;
  realized_gain: number;
  cash_yield: number;
  currency: InvestmentCurrency;
  created_at: string;
  updated_at: string;
}

export interface InvestmentWithRelations extends Investment {
  entity?: InvestmentEntity | null;
  transactions?: InvestmentTransaction[];
  distributions?: InvestmentDistribution[];
  capital_calls?: InvestmentCapitalCall[];
  valuations?: InvestmentValuation[];
  tax_items?: InvestmentTaxItem[];
  documents?: InvestmentDocument[];
  precious_metals?: PreciousMetal[];
  monthly_summaries?: InvestmentMonthlySummary[];
}

export interface InvestmentFormData {
  name: string;
  entity_id?: string;
  category: InvestmentCategory;
  purchase_date?: string;
  invested_capital: number;
  current_value: number;
  ownership_percent: number;
  currency: InvestmentCurrency;
  country: InvestmentCountry;
  status: InvestmentStatus;
  tax_basis: number;
  remaining_basis: number;
  idc_deduction_total: number;
  notes?: string;
}

export interface InvestmentMetrics {
  roi: number;
  irrPlaceholder: number | null;
  cashYield: number;
  totalDistributions: number;
  totalContributions: number;
  unrealizedGainLoss: number;
  realizedGainLoss: number;
  remainingBasis: number;
  taxBasis: number;
  totalValue: number;
  idcDeductions: number;
}

export interface PortfolioInvestmentMetrics {
  byCurrency: Record<
    InvestmentCurrency,
    {
      totalValue: number;
      totalInvested: number;
      totalDistributions: number;
      totalUnrealizedGain: number;
      totalRealizedGain: number;
      investmentCount: number;
      avgRoi: number;
      avgCashYield: number;
    }
  >;
  allocationByCategory: { name: string; value: number; category: InvestmentCategory }[];
  totalInvestments: number;
}

export const CATEGORY_LABELS: Record<InvestmentCategory, string> = {
  oil_gas: "Oil & Gas",
  startups: "Startups",
  venture_funds: "Venture Funds",
  private_equity: "Private Equity",
  software: "Software Investments",
  gold: "Gold",
  silver: "Silver",
  platinum: "Platinum",
  other_private: "Other Private Investments",
};
