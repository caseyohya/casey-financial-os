import type {
  BankAccount,
  BankBalance,
  BankTransaction,
  CashFlowMonthly,
  ChartDataPoint,
  RecurringTransaction,
  TransactionCategory,
} from "@/lib/types";

export function toUsd(
  amount: number,
  currency: string,
  exchangeRate: number | null
): number {
  if (currency === "USD") return amount;
  if (exchangeRate && exchangeRate > 0) return amount / exchangeRate;
  return amount;
}

export function computeMonthlyCashFlow(
  transactions: BankTransaction[],
  year: number,
  month: number,
  currency = "USD"
): Omit<CashFlowMonthly, "id" | "user_id" | "computed_at"> {
  const filtered = transactions.filter((t) => {
    const d = new Date(t.transaction_date);
    return (
      d.getFullYear() === year &&
      d.getMonth() + 1 === month &&
      (currency === "" || t.currency === currency)
    );
  });

  const totals = filtered.reduce(
    (acc, t) => {
      const usdAmount = Math.abs(toUsd(Number(t.amount), t.currency, t.exchange_rate_to_usd));
      switch (t.transaction_type) {
        case "income":
          acc.total_income += usdAmount;
          break;
        case "expense":
          acc.total_expenses += usdAmount;
          break;
        case "transfer":
          acc.total_transfers += usdAmount;
          break;
        case "investment":
          acc.total_investments += usdAmount;
          break;
      }
      return acc;
    },
    {
      total_income: 0,
      total_expenses: 0,
      total_transfers: 0,
      total_investments: 0,
    }
  );

  return {
    year,
    month,
    currency: currency || "USD",
    ...totals,
    net_cash_flow: totals.total_income - totals.total_expenses,
    exchange_rate_to_usd: null,
  };
}

export function buildCashFlowChartData(
  transactions: BankTransaction[],
  months = 6
): ChartDataPoint[] {
  const now = new Date();
  const data: ChartDataPoint[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const flow = computeMonthlyCashFlow(transactions, year, month);
    data.push({
      name: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      value: flow.net_cash_flow,
      income: flow.total_income,
      expenses: flow.total_expenses,
    });
  }

  return data;
}

export function buildCategorySpendingData(
  transactions: BankTransaction[],
  categories: TransactionCategory[]
): ChartDataPoint[] {
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const spending = new Map<string, number>();

  for (const t of transactions) {
    if (t.transaction_type !== "expense") continue;
    const name = t.category_id
      ? categoryMap.get(t.category_id) ?? t.category_name
      : t.category_name;
    const amount = Math.abs(toUsd(Number(t.amount), t.currency, t.exchange_rate_to_usd));
    spending.set(name, (spending.get(name) ?? 0) + amount);
  }

  return Array.from(spending.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

export function buildBalanceHistoryData(
  balances: BankBalance[],
  accounts: BankAccount[]
): ChartDataPoint[] {
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));
  const byDate = new Map<string, number>();

  for (const b of balances) {
    const key = b.balance_date;
    const usd = toUsd(Number(b.balance), b.currency, b.exchange_rate_to_usd);
    byDate.set(key, (byDate.get(key) ?? 0) + usd);
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({
      name: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value,
      date,
    }));
}

export function filterTransactions(
  transactions: BankTransaction[],
  filters: {
    accountId?: string;
    month?: string;
    categoryId?: string;
    country?: string;
    currency?: string;
  },
  accounts: BankAccount[]
): BankTransaction[] {
  const accountCountryMap = new Map(accounts.map((a) => [a.id, a.country]));

  return transactions.filter((t) => {
    if (filters.accountId && t.account_id !== filters.accountId) return false;
    if (filters.categoryId && t.category_id !== filters.categoryId) return false;
    if (filters.currency && t.currency !== filters.currency) return false;
    if (filters.country && accountCountryMap.get(t.account_id) !== filters.country)
      return false;
    if (filters.month) {
      const [year, month] = filters.month.split("-").map(Number);
      const d = new Date(t.transaction_date);
      if (d.getFullYear() !== year || d.getMonth() + 1 !== month) return false;
    }
    return true;
  });
}

export function filterAccounts(
  accounts: BankAccount[],
  filters: { country?: string; currency?: string; accountId?: string }
): BankAccount[] {
  return accounts.filter((a) => {
    if (filters.accountId && a.id !== filters.accountId) return false;
    if (filters.country && a.country !== filters.country) return false;
    if (filters.currency && a.currency !== filters.currency) return false;
    return true;
  });
}

export function computeAccountTotals(accounts: BankAccount[]): {
  totalUsd: number;
  byCurrency: Record<string, number>;
  byCountry: Record<string, number>;
} {
  const byCurrency: Record<string, number> = {};
  const byCountry: Record<string, number> = {};
  let totalUsd = 0;

  for (const a of accounts) {
    if (!a.is_active) continue;
    const bal = Number(a.balance);
    byCurrency[a.currency] = (byCurrency[a.currency] ?? 0) + bal;
    byCountry[a.country] = (byCountry[a.country] ?? 0) + bal;
    totalUsd += toUsd(bal, a.currency, a.exchange_rate_to_usd);
  }

  return { totalUsd, byCurrency, byCountry };
}

export function inferTransactionType(
  amount: number,
  description: string,
  mappedType?: string
): "income" | "expense" | "transfer" | "investment" {
  if (mappedType) {
    const lower = mappedType.toLowerCase();
    if (lower.includes("transfer")) return "transfer";
    if (lower.includes("invest")) return "investment";
    if (lower.includes("income") || lower.includes("deposit")) return "income";
    if (lower.includes("expense") || lower.includes("debit")) return "expense";
  }

  const desc = description.toLowerCase();
  if (desc.includes("transfer")) return "transfer";
  if (desc.includes("invest") || desc.includes("stock") || desc.includes("etf"))
    return "investment";

  return amount >= 0 ? "income" : "expense";
}

export function detectRecurringPatterns(
  transactions: BankTransaction[]
): Partial<RecurringTransaction>[] {
  const groups = new Map<string, BankTransaction[]>();

  for (const t of transactions) {
    if (t.transaction_type !== "expense") continue;
    const key = `${t.account_id}:${t.description.toLowerCase().trim()}:${Math.abs(Number(t.amount)).toFixed(2)}`;
    const list = groups.get(key) ?? [];
    list.push(t);
    groups.set(key, list);
  }

  const patterns: Partial<RecurringTransaction>[] = [];

  for (const [, txs] of groups) {
    if (txs.length < 2) continue;
    txs.sort(
      (a, b) =>
        new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
    );
    patterns.push({
      account_id: txs[0].account_id,
      description: txs[0].description,
      amount: Math.abs(Number(txs[0].amount)),
      currency: txs[0].currency,
      transaction_type: "expense",
      category_id: txs[0].category_id,
      frequency: "monthly",
      is_active: true,
    });
  }

  return patterns.slice(0, 20);
}
