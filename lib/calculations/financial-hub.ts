import type {
  ExpenseFrequency,
  FinancialHubData,
  FinancialHubMetrics,
  HubAccount,
  HubAsset,
  HubExpense,
  HubIncomeSource,
  HubLiability,
  IncomeFrequency,
} from "@/lib/types/financial-hub";

export function normalizeToMonthly(amount: number, frequency: IncomeFrequency | ExpenseFrequency): number {
  switch (frequency) {
    case "monthly":
      return amount;
    case "weekly":
      return (amount * 52) / 12;
    case "biweekly":
      return (amount * 26) / 12;
    case "quarterly":
      return amount / 3;
    case "annually":
      return amount / 12;
    case "one_time":
    default:
      return 0;
  }
}

export function calculateFinancialHubMetrics(data: FinancialHubData): FinancialHubMetrics {
  const liquidAccountTypes = new Set<HubAccount["account_type"]>(["checking", "savings"]);
  const liquidAssetTypes = new Set<HubAsset["asset_type"]>(["cash"]);

  const assetTotal = data.assets.reduce((sum, asset) => sum + Number(asset.current_value), 0);
  const accountAssets = data.accounts
    .filter((account) => account.is_active && !["credit", "loan"].includes(account.account_type))
    .reduce((sum, account) => sum + Number(account.balance), 0);
  const totalAssets = assetTotal + accountAssets;

  const liabilityTotal = data.liabilities.reduce(
    (sum, liability) => sum + Number(liability.current_balance),
    0
  );
  const creditBalances = data.accounts
    .filter((account) => account.is_active && ["credit", "loan"].includes(account.account_type))
    .reduce((sum, account) => sum + Math.abs(Number(account.balance)), 0);
  const totalLiabilities = liabilityTotal + creditBalances;

  const monthlyIncome = data.incomeSources
    .filter((source) => source.is_active)
    .reduce((sum, source) => sum + normalizeToMonthly(Number(source.amount), source.frequency), 0);

  const monthlyExpenses = data.expenses
    .filter((expense) => expense.is_active)
    .reduce((sum, expense) => sum + normalizeToMonthly(Number(expense.amount), expense.frequency), 0);

  const passiveIncome = data.incomeSources
    .filter((source) => source.is_active && source.is_passive)
    .reduce((sum, source) => sum + normalizeToMonthly(Number(source.amount), source.frequency), 0);

  const liquidAssets =
    data.assets
      .filter((asset) => liquidAssetTypes.has(asset.asset_type))
      .reduce((sum, asset) => sum + Number(asset.current_value), 0) +
    data.accounts
      .filter((account) => account.is_active && liquidAccountTypes.has(account.account_type))
      .reduce((sum, account) => sum + Number(account.balance), 0);

  return {
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
    monthlyIncome,
    monthlyExpenses,
    monthlyCashFlow: monthlyIncome - monthlyExpenses,
    passiveIncome,
    liquidAssets,
  };
}
