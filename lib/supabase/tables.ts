export const APP_MODULES = [
  {
    id: "financial-hub",
    label: "Financial Hub",
    tables: ["accounts", "assets", "liabilities", "income_sources", "expenses"],
  },
  {
    id: "banking",
    label: "Banking Platform",
    tables: [
      "bank_accounts",
      "bank_transactions",
      "bank_balances",
      "transaction_categories",
      "recurring_transactions",
      "cash_flow_monthly",
    ],
  },
  {
    id: "real-estate",
    label: "Real Estate",
    tables: [
      "properties",
      "property_owners",
      "property_mortgages",
      "property_income",
      "property_expenses",
      "property_monthly_summary",
    ],
  },
  {
    id: "investments",
    label: "Investments",
    tables: [
      "investments",
      "investment_entities",
      "investment_transactions",
      "investment_distributions",
      "investment_capital_calls",
      "investment_monthly_summary",
    ],
  },
  {
    id: "tax",
    label: "Tax Intelligence",
    tables: [
      "tax_years",
      "tax_documents",
      "tax_accounts",
      "tax_income_items",
      "tax_expense_items",
      "tax_deductions",
    ],
  },
  {
    id: "executive-dashboard",
    label: "Executive Dashboard",
    tables: [
      "executive_net_worth_summary",
      "executive_cash_flow_summary",
      "executive_passive_income_summary",
      "tax_records",
      "net_worth_snapshots",
    ],
  },
] as const;

export const REQUIRED_STORAGE_BUCKETS = [
  "property-documents",
  "investment-documents",
] as const;

export const ALL_REQUIRED_TABLES = [
  ...new Set(APP_MODULES.flatMap((module) => module.tables)),
];
