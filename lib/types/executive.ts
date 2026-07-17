export type ExecutiveCountryFilter = "ALL" | "US" | "JP";
export type ExecutiveCurrency = "USD" | "JPY";
export type AssetCategory = "cash" | "real_estate" | "investments" | "precious_metals" | "other" | "ALL";

export interface ExecutiveFilters {
  year: number;
  month: number;
  country: ExecutiveCountryFilter;
  category: AssetCategory;
}

export interface ExecutiveKPIs {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  cashPosition: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyCashFlow: number;
  passiveIncome: number;
  passiveIncomeTarget: number;
  passiveIncomeProgress: number;
  realEstateNOI: number;
  realEstateEquity: number;
  investmentValue: number;
  investmentROI: number;
  estimatedTax: number;
  effectiveTaxRate: number;
  debtRatio: number;
  liquidityRatio: number;
  fiScore: number;
  healthScore: number;
  currency: ExecutiveCurrency;
}

export interface ExecutiveAlert {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
}

export interface WhatChangedItem {
  label: string;
  previous: number;
  current: number;
  change: number;
  changePercent: number;
}

export interface ExecutiveChartData {
  netWorthTrend: { name: string; value: number }[];
  cashFlowTrend: { name: string; income: number; expenses: number; cashFlow: number }[];
  passiveIncomeTrend: { name: string; value: number; target: number }[];
  assetAllocation: { name: string; value: number }[];
  countryAllocation: { name: string; value: number }[];
  incomeSources: { name: string; value: number }[];
  expenseCategories: { name: string; value: number }[];
  realEstateNOITrend: { name: string; value: number }[];
  investmentDistributionTrend: { name: string; value: number }[];
  taxExposureByYear: { name: string; value: number }[];
}

export interface ExecutiveDashboardData {
  kpis: ExecutiveKPIs;
  charts: ExecutiveChartData;
  alerts: ExecutiveAlert[];
  whatChanged: WhatChangedItem[];
  filters: ExecutiveFilters;
}

export interface RawModuleData {
  bankAccounts: { balance: number; account_type: string; currency: string; country?: string }[];
  transactions: { amount: number; transaction_type: string; transaction_date: string; category_name: string }[];
  hubAccounts: { balance: number; account_type: string; is_active: boolean }[];
  hubAssets: { current_value: number }[];
  hubLiabilities: { current_balance: number }[];
  hubIncomeSources: {
    amount: number;
    frequency: string;
    is_passive: boolean;
    is_active: boolean;
  }[];
  hubExpenses: {
    amount: number;
    frequency: string;
    is_active: boolean;
  }[];
  properties: {
    id?: string;
    current_value: number;
    loan_balance: number;
    monthly_rent: number;
    country: string;
    currency: string;
    hoa_monthly: number;
    taxes_annual: number;
    insurance_annual: number;
    maintenance_monthly: number;
  }[];
  propertyIncome: { amount: number; income_date: string; income_type: string }[];
  investments: {
    id?: string;
    current_value: number;
    invested_capital: number;
    country: string;
    currency: string;
    category: string;
  }[];
  distributions: { amount: number; distribution_date: string }[];
  taxRecords: { tax_year: number; federal_tax: number; state_tax: number; gross_income: number; effective_rate: number }[];
  netWorthSnapshots: { snapshot_date: string; net_worth: number; total_assets: number; total_liabilities: number }[];
  capitalCallsPending: number;
  preciousMetalsValue: number;
}
