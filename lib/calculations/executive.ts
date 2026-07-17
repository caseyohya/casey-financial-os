import type {
  ExecutiveKPIs,
  ExecutiveAlert,
  ExecutiveChartData,
  ExecutiveFilters,
  RawModuleData,
  WhatChangedItem,
  ExecutiveCountryFilter,
} from "@/lib/types/executive";

const PASSIVE_INCOME_TARGET = 5000;
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function matchesCountry(country: string, filter: ExecutiveCountryFilter): boolean {
  if (filter === "ALL") return true;
  return country === filter;
}

function filterByCountry<T extends { country?: string }>(items: T[], filter: ExecutiveCountryFilter): T[] {
  if (filter === "ALL") return items;
  return items.filter((i) => matchesCountry(i.country ?? "US", filter));
}

function normalizeToMonthly(amount: number, frequency: string): number {
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

export function aggregateExecutiveKPIs(
  data: RawModuleData,
  filters: ExecutiveFilters
): ExecutiveKPIs {
  const properties = filterByCountry(
    data.properties.map((p) => ({ ...p, country: p.country })),
    filters.country
  );
  const investments = filterByCountry(
    data.investments.map((i) => ({ ...i, country: i.country })),
    filters.country
  );

  const cashAccounts = data.bankAccounts.filter(
    (a) => !["credit", "loan"].includes(a.account_type)
  );
  const liabilityAccounts = data.bankAccounts.filter((a) =>
    ["credit", "loan"].includes(a.account_type)
  );

  const bankCash = cashAccounts.reduce((s, a) => s + a.balance, 0);
  const bankLiabilities = liabilityAccounts.reduce((s, a) => s + Math.abs(a.balance), 0);

  const hubCash = (data.hubAccounts ?? [])
    .filter((a) => a.is_active && !["credit", "loan"].includes(a.account_type))
    .reduce((s, a) => s + a.balance, 0);
  const hubCredit = (data.hubAccounts ?? [])
    .filter((a) => a.is_active && ["credit", "loan"].includes(a.account_type))
    .reduce((s, a) => s + Math.abs(a.balance), 0);
  const hubAssetValue = (data.hubAssets ?? []).reduce((s, a) => s + a.current_value, 0);
  const hubLiabilityValue = (data.hubLiabilities ?? []).reduce(
    (s, l) => s + l.current_balance,
    0
  );

  const cashPosition = bankCash + hubCash;
  const propertyValue = properties.reduce((s, p) => s + p.current_value, 0);
  const propertyLoans = properties.reduce((s, p) => s + p.loan_balance, 0);
  const investmentValue = investments.reduce((s, i) => s + i.current_value, 0) + data.preciousMetalsValue;

  const totalAssets = cashPosition + hubAssetValue + propertyValue + investmentValue;
  const totalLiabilities = bankLiabilities + hubCredit + hubLiabilityValue + propertyLoans;
  const netWorth = totalAssets - totalLiabilities;

  const monthTx = data.transactions.filter((t) => {
    const d = new Date(t.transaction_date);
    return d.getFullYear() === filters.year && d.getMonth() + 1 === filters.month;
  });

  const monthlyIncome = monthTx
    .filter((t) => t.transaction_type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const monthlyExpenses = monthTx
    .filter((t) => t.transaction_type === "expense")
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  const hubMonthlyIncome = (data.hubIncomeSources ?? [])
    .filter((source) => source.is_active)
    .reduce((s, source) => s + normalizeToMonthly(source.amount, source.frequency), 0);
  const hubMonthlyExpenses = (data.hubExpenses ?? [])
    .filter((expense) => expense.is_active)
    .reduce((s, expense) => s + normalizeToMonthly(expense.amount, expense.frequency), 0);
  const hubPassiveIncome = (data.hubIncomeSources ?? [])
    .filter((source) => source.is_active && source.is_passive)
    .reduce((s, source) => s + normalizeToMonthly(source.amount, source.frequency), 0);

  const estimatedIncome =
    monthlyIncome ||
    hubMonthlyIncome ||
    properties.reduce((s, p) => s + p.monthly_rent, 0);
  const estimatedExpenses =
    monthlyExpenses ||
    hubMonthlyExpenses ||
    properties.reduce(
      (s, p) => s + p.hoa_monthly + p.taxes_annual / 12 + p.insurance_annual / 12 + p.maintenance_monthly,
      0
    );

  const monthDist = data.distributions
    .filter((d) => {
      const dt = new Date(d.distribution_date);
      return dt.getFullYear() === filters.year && dt.getMonth() + 1 === filters.month;
    })
    .reduce((s, d) => s + d.amount, 0);

  const monthRental = data.propertyIncome
    .filter((i) => {
      const dt = new Date(i.income_date);
      return dt.getFullYear() === filters.year && dt.getMonth() + 1 === filters.month && i.income_type === "rent";
    })
    .reduce((s, i) => s + i.amount, 0);

  const rentalIncome = monthRental || properties.reduce((s, p) => s + p.monthly_rent, 0);
  // Prefer recorded rental + distributions; fall back to hub passive sources when none exist
  const passiveIncome =
    rentalIncome + monthDist > 0 ? rentalIncome + monthDist : hubPassiveIncome;
  const passiveIncomeProgress = (passiveIncome / PASSIVE_INCOME_TARGET) * 100;

  let realEstateNOI = 0;
  for (const p of properties) {
    const opEx = p.hoa_monthly + p.taxes_annual / 12 + p.insurance_annual / 12 + p.maintenance_monthly;
    realEstateNOI += p.monthly_rent - opEx;
  }

  const realEstateEquity = propertyValue - propertyLoans;

  let totalROI = 0;
  let invCount = 0;
  for (const inv of investments) {
    const roi = inv.invested_capital > 0
      ? ((inv.current_value - inv.invested_capital) / inv.invested_capital) * 100
      : 0;
    totalROI += roi;
    invCount++;
  }

  const latestTax = data.taxRecords
    .filter((t) => t.tax_year === filters.year)
    .sort((a, b) => b.tax_year - a.tax_year)[0];

  const estimatedTax = latestTax
    ? latestTax.federal_tax + latestTax.state_tax
    : estimatedIncome * 12 * 0.28;
  const effectiveTaxRate = latestTax?.effective_rate ?? 28;

  const debtRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;
  const liquidityRatio = estimatedExpenses > 0 ? cashPosition / estimatedExpenses : 0;

  const monthlyCashFlow = estimatedIncome - estimatedExpenses;
  const savingsRate = estimatedIncome > 0 ? (monthlyCashFlow / estimatedIncome) * 100 : 0;
  const passiveCoverage = estimatedExpenses > 0 ? (passiveIncome / estimatedExpenses) * 100 : 0;

  const fiScore = Math.min(
    100,
    Math.round(
      passiveIncomeProgress * 0.3 +
        Math.min(liquidityRatio * 10, 25) +
        Math.max(0, 25 - debtRatio * 0.5) +
        Math.min(savingsRate, 25) +
        Math.min(passiveCoverage * 0.2, 20)
    )
  );

  const healthScore = Math.min(
    100,
    Math.round(
      (monthlyCashFlow >= 0 ? 30 : 10) +
        Math.min(liquidityRatio * 8, 25) +
        Math.max(0, 25 - debtRatio * 0.4) +
        (passiveIncomeProgress > 50 ? 20 : passiveIncomeProgress * 0.4)
    )
  );

  return {
    netWorth,
    totalAssets,
    totalLiabilities,
    cashPosition,
    monthlyIncome: estimatedIncome,
    monthlyExpenses: estimatedExpenses,
    monthlyCashFlow,
    passiveIncome,
    passiveIncomeTarget: PASSIVE_INCOME_TARGET,
    passiveIncomeProgress,
    realEstateNOI,
    realEstateEquity,
    investmentValue,
    investmentROI: invCount > 0 ? totalROI / invCount : 0,
    estimatedTax,
    effectiveTaxRate,
    debtRatio,
    liquidityRatio,
    fiScore,
    healthScore,
    currency: "USD",
  };
}

export function buildExecutiveCharts(
  data: RawModuleData,
  kpis: ExecutiveKPIs,
  filters: ExecutiveFilters,
  historicalSnapshots: { year: number; month: number; net_worth: number; cash_flow: number; passive_income: number; noi: number; distributions: number }[]
): ExecutiveChartData {
  const netWorthTrend =
    historicalSnapshots.length > 0
      ? historicalSnapshots.map((s) => ({
          name: `${MONTH_NAMES[s.month - 1]} ${String(s.year).slice(2)}`,
          value: s.net_worth,
        }))
      : data.netWorthSnapshots.slice(-6).map((s) => ({
          name: new Date(s.snapshot_date).toLocaleDateString("en-US", { month: "short" }),
          value: s.net_worth,
        }));

  // Current period only when no historical snapshots exist (do not invent trend data)
  if (netWorthTrend.length === 0 && kpis.netWorth !== 0) {
    netWorthTrend.push({
      name: `${MONTH_NAMES[filters.month - 1]} ${String(filters.year).slice(2)}`,
      value: kpis.netWorth,
    });
  }

  const cashFlowTrend = historicalSnapshots.length > 0
    ? historicalSnapshots.map((s) => ({
        name: `${MONTH_NAMES[s.month - 1]}`,
        income: kpis.monthlyIncome,
        expenses: kpis.monthlyExpenses,
        cashFlow: s.cash_flow,
      }))
    : MONTH_NAMES.slice(Math.max(0, filters.month - 6), filters.month).map((name) => ({
        name,
        income: kpis.monthlyIncome,
        expenses: kpis.monthlyExpenses,
        cashFlow: kpis.monthlyCashFlow,
      }));

  const passiveIncomeTrend = historicalSnapshots.length > 0
    ? historicalSnapshots.map((s) => ({
        name: `${MONTH_NAMES[s.month - 1]}`,
        value: s.passive_income,
        target: PASSIVE_INCOME_TARGET,
      }))
    : [{ name: MONTH_NAMES[filters.month - 1], value: kpis.passiveIncome, target: PASSIVE_INCOME_TARGET }];

  const assetAllocation = [
    { name: "Cash & Banking", value: kpis.cashPosition },
    { name: "Real Estate", value: kpis.realEstateEquity + (kpis.totalLiabilities > 0 ? data.properties.reduce((s, p) => s + p.loan_balance, 0) : 0) },
    { name: "Investments", value: kpis.investmentValue },
    { name: "Other", value: Math.max(0, kpis.totalAssets - kpis.cashPosition - kpis.investmentValue - data.properties.reduce((s, p) => s + p.current_value, 0)) },
  ].filter((a) => a.value > 0);

  const usValue =
    filterByCountry(data.properties, "US").reduce((s, p) => s + p.current_value, 0) +
    filterByCountry(data.investments, "US").reduce((s, i) => s + i.current_value, 0) +
    kpis.cashPosition * 0.7;
  const jpValue =
    filterByCountry(data.properties, "JP").reduce((s, p) => s + p.current_value, 0) +
    filterByCountry(data.investments, "JP").reduce((s, i) => s + i.current_value, 0) +
    kpis.cashPosition * 0.3;

  const countryAllocation = [
    { name: "United States", value: usValue },
    { name: "Japan", value: jpValue },
  ].filter((c) => c.value > 0);

  const incomeSources = [
    { name: "Rental Income", value: data.propertyIncome.length > 0 ? data.propertyIncome.reduce((s, i) => s + i.amount, 0) / Math.max(data.propertyIncome.length, 1) : data.properties.reduce((s, p) => s + p.monthly_rent, 0) },
    { name: "Distributions", value: data.distributions.filter((d) => { const dt = new Date(d.distribution_date); return dt.getFullYear() === filters.year && dt.getMonth() + 1 === filters.month; }).reduce((s, d) => s + d.amount, 0) },
    { name: "Other Income", value: data.transactions.filter((t) => t.transaction_type === "income").reduce((s, t) => s + t.amount, 0) },
  ].filter((i) => i.value > 0);

  const expenseCategories = [
    { name: "Property", value: data.properties.reduce((s, p) => s + p.hoa_monthly + p.maintenance_monthly + p.taxes_annual / 12 + p.insurance_annual / 12, 0) },
    { name: "Living", value: data.transactions.filter((t) => t.transaction_type === "expense").reduce((s, t) => s + Math.abs(t.amount), 0) },
  ].filter((e) => e.value > 0);

  const realEstateNOITrend = historicalSnapshots.length > 0
    ? historicalSnapshots.map((s) => ({ name: `${MONTH_NAMES[s.month - 1]}`, value: s.noi }))
    : [{ name: MONTH_NAMES[filters.month - 1], value: kpis.realEstateNOI }];

  const investmentDistributionTrend = historicalSnapshots.length > 0
    ? historicalSnapshots.map((s) => ({ name: `${MONTH_NAMES[s.month - 1]}`, value: s.distributions }))
    : data.distributions.slice(-6).map((d) => ({
        name: new Date(d.distribution_date).toLocaleDateString("en-US", { month: "short" }),
        value: d.amount,
      }));

  const taxExposureByYear = data.taxRecords.map((t) => ({
    name: String(t.tax_year),
    value: t.federal_tax + t.state_tax,
  }));

  return {
    netWorthTrend,
    cashFlowTrend,
    passiveIncomeTrend,
    assetAllocation,
    countryAllocation,
    incomeSources,
    expenseCategories,
    realEstateNOITrend,
    investmentDistributionTrend,
    taxExposureByYear,
  };
}

export function generateAlerts(data: RawModuleData, kpis: ExecutiveKPIs): ExecutiveAlert[] {
  const alerts: ExecutiveAlert[] = [];

  if (kpis.monthlyCashFlow < 0) {
    alerts.push({
      id: "negative-cashflow",
      severity: "warning",
      title: "Negative Cash Flow",
      message: `Monthly cash flow is ${kpis.monthlyCashFlow < 0 ? "negative" : "low"} this period. Review expenses.`,
    });
  }

  if (kpis.liquidityRatio < 3) {
    alerts.push({
      id: "low-liquidity",
      severity: "warning",
      title: "Low Liquidity",
      message: `Liquidity ratio is ${kpis.liquidityRatio.toFixed(1)} months of expenses. Target 6+ months.`,
    });
  }

  if (kpis.debtRatio > 40) {
    alerts.push({
      id: "high-debt",
      severity: "critical",
      title: "Elevated Debt Ratio",
      message: `Debt ratio at ${kpis.debtRatio.toFixed(1)}% exceeds 40% threshold.`,
    });
  }

  if (data.capitalCallsPending > 0) {
    alerts.push({
      id: "capital-calls",
      severity: "info",
      title: "Pending Capital Calls",
      message: `$${data.capitalCallsPending.toLocaleString()} in unfunded capital calls.`,
    });
  }

  if (kpis.passiveIncomeProgress >= 100) {
    alerts.push({
      id: "fi-milestone",
      severity: "info",
      title: "Passive Income Milestone",
      message: "Monthly passive income has reached the $5,000 target.",
    });
  } else if (kpis.passiveIncomeProgress >= 75) {
    alerts.push({
      id: "fi-progress",
      severity: "info",
      title: "Approaching FI Target",
      message: `${kpis.passiveIncomeProgress.toFixed(0)}% progress toward $5,000/month passive income.`,
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: "all-clear",
      severity: "info",
      title: "All Clear",
      message: "No critical alerts. Financial position is stable.",
    });
  }

  return alerts;
}

export function buildWhatChanged(
  current: ExecutiveKPIs,
  previous: Partial<ExecutiveKPIs> | null
): WhatChangedItem[] {
  if (!previous) return [];

  const fields: { key: keyof ExecutiveKPIs; label: string }[] = [
    { key: "netWorth", label: "Net Worth" },
    { key: "totalAssets", label: "Total Assets" },
    { key: "cashPosition", label: "Cash Position" },
    { key: "monthlyCashFlow", label: "Monthly Cash Flow" },
    { key: "passiveIncome", label: "Passive Income" },
    { key: "realEstateNOI", label: "Real Estate NOI" },
    { key: "investmentValue", label: "Investment Value" },
  ];

  return fields
    .map(({ key, label }) => {
      const curr = current[key] as number;
      const prev = (previous[key] as number) ?? curr;
      const change = curr - prev;
      const changePercent = prev !== 0 ? (change / prev) * 100 : 0;
      return { label, previous: prev, current: curr, change, changePercent };
    })
    .filter((item) => Math.abs(item.change) > 0.01);
}
