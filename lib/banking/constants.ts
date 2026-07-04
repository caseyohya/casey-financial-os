import type { Country, Currency, TransactionType } from "@/lib/types";

export const ACCOUNT_TYPES = [
  { value: "checking", label: "Checking" },
  { value: "savings", label: "Savings" },
  { value: "credit", label: "Credit" },
  { value: "loan", label: "Loan" },
  { value: "other", label: "Other" },
] as const;

export const COUNTRIES: { value: Country; label: string }[] = [
  { value: "US", label: "United States" },
  { value: "JP", label: "Japan" },
];

export const CURRENCIES: { value: Currency; label: string; locale: string }[] = [
  { value: "USD", label: "US Dollar (USD)", locale: "en-US" },
  { value: "JPY", label: "Japanese Yen (JPY)", locale: "ja-JP" },
];

export const TRANSACTION_TYPES: { value: TransactionType; label: string }[] = [
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
  { value: "transfer", label: "Transfer" },
  { value: "investment", label: "Investment" },
];

export const RECURRING_FREQUENCIES = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
] as const;

export const CSV_FIELD_OPTIONS = [
  { value: "", label: "— Skip —" },
  { value: "date", label: "Date" },
  { value: "description", label: "Description" },
  { value: "amount", label: "Amount" },
  { value: "category", label: "Category" },
  { value: "type", label: "Transaction Type" },
] as const;

export const DEFAULT_FILTERS = {
  accountId: "",
  month: "",
  categoryId: "",
  country: "",
  currency: "",
};

export const BANKING_TABS = [
  { id: "overview", label: "Overview" },
  { id: "accounts", label: "Accounts" },
  { id: "transactions", label: "Transactions" },
  { id: "import", label: "CSV Import" },
  { id: "recurring", label: "Recurring" },
] as const;

export type BankingTab = (typeof BANKING_TABS)[number]["id"];
