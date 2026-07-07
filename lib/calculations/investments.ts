import {
  type Investment,
  type InvestmentCapitalCall,
  type InvestmentDistribution,
  type InvestmentMetrics,
  type InvestmentTaxItem,
  type InvestmentTransaction,
  type PortfolioInvestmentMetrics,
  type PreciousMetal,
  type InvestmentCategory,
  type InvestmentCurrency,
  CATEGORY_LABELS,
} from "@/lib/types/investments";

export function calculateTotalDistributions(distributions: InvestmentDistribution[]): number {
  return distributions.reduce((sum, d) => sum + d.amount, 0);
}

export function calculateTotalContributions(transactions: InvestmentTransaction[]): number {
  return transactions
    .filter((t) =>
      ["capital_contribution", "additional_contribution"].includes(t.transaction_type)
    )
    .reduce((sum, t) => sum + t.amount, 0);
}

export function calculateRealizedGainLoss(transactions: InvestmentTransaction[]): number {
  const gains = transactions
    .filter((t) => t.transaction_type === "realized_gain")
    .reduce((sum, t) => sum + t.amount, 0);
  const losses = transactions
    .filter((t) => t.transaction_type === "realized_loss")
    .reduce((sum, t) => sum + t.amount, 0);
  const roc = transactions
    .filter((t) => t.transaction_type === "return_of_capital")
    .reduce((sum, t) => sum + t.amount, 0);
  return gains - losses + roc;
}

export function calculateReturnOfCapital(distributions: InvestmentDistribution[]): number {
  return distributions
    .filter((d) => d.distribution_type === "return_of_capital")
    .reduce((sum, d) => sum + d.amount, 0);
}

export function calculateRemainingBasis(
  investment: Investment,
  distributions: InvestmentDistribution[],
  transactions: InvestmentTransaction[]
): number {
  const rocFromDist = calculateReturnOfCapital(distributions);
  const rocFromTx = transactions
    .filter((t) => t.transaction_type === "return_of_capital")
    .reduce((sum, t) => sum + t.amount, 0);
  const basis = investment.remaining_basis > 0
    ? investment.remaining_basis
    : investment.tax_basis > 0
      ? investment.tax_basis
      : investment.invested_capital;
  return Math.max(0, basis - rocFromDist - rocFromTx);
}

export function calculateUnrealizedGainLoss(
  currentValue: number,
  remainingBasis: number
): number {
  return currentValue - remainingBasis;
}

export function calculateROI(
  currentValue: number,
  totalDistributions: number,
  investedCapital: number
): number {
  if (investedCapital <= 0) return 0;
  return ((currentValue + totalDistributions - investedCapital) / investedCapital) * 100;
}

export function calculateCashYield(
  annualDistributions: number,
  currentValue: number
): number {
  if (currentValue <= 0) return 0;
  return (annualDistributions / currentValue) * 100;
}

export function calculateIRRPlaceholder(
  investedCapital: number,
  currentValue: number,
  totalDistributions: number,
  yearsHeld: number
): number | null {
  if (investedCapital <= 0 || yearsHeld <= 0) return null;
  const totalReturn = currentValue + totalDistributions;
  const ratio = totalReturn / investedCapital;
  if (ratio <= 0) return null;
  return (Math.pow(ratio, 1 / yearsHeld) - 1) * 100;
}

export function calculateIdcDeductions(taxItems: InvestmentTaxItem[]): number {
  const fromItems = taxItems
    .filter((t) => t.item_type === "idc_deduction")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  return fromItems;
}

export function getYearsHeld(purchaseDate: string | null): number {
  if (!purchaseDate) return 1;
  const start = new Date(purchaseDate);
  const now = new Date();
  const years = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  return Math.max(years, 0.25);
}

export function calculateInvestmentMetrics(
  investment: Investment,
  transactions: InvestmentTransaction[] = [],
  distributions: InvestmentDistribution[] = [],
  taxItems: InvestmentTaxItem[] = [],
  preciousMetals: PreciousMetal[] = []
): InvestmentMetrics {
  const totalDistributions = calculateTotalDistributions(distributions);
  const totalContributions =
    calculateTotalContributions(transactions) || investment.invested_capital;

  const metalsValue = preciousMetals.reduce(
    (sum, m) => sum + m.quantity * m.spot_value,
    0
  );
  const totalValue = investment.current_value + metalsValue;

  const remainingBasis = calculateRemainingBasis(investment, distributions, transactions);
  const unrealizedGainLoss = calculateUnrealizedGainLoss(totalValue, remainingBasis);
  const realizedGainLoss = calculateRealizedGainLoss(transactions);

  const taxYear = new Date().getFullYear();
  const annualDistributions = distributions
    .filter((d) => new Date(d.distribution_date).getFullYear() === taxYear)
    .reduce((sum, d) => sum + d.amount, 0);

  const idcFromItems = calculateIdcDeductions(taxItems);
  const idcDeductions = investment.idc_deduction_total || idcFromItems;

  return {
    roi: calculateROI(totalValue, totalDistributions, totalContributions),
    irrPlaceholder: calculateIRRPlaceholder(
      totalContributions,
      totalValue,
      totalDistributions,
      getYearsHeld(investment.purchase_date)
    ),
    cashYield: calculateCashYield(annualDistributions, totalValue),
    totalDistributions,
    totalContributions,
    unrealizedGainLoss,
    realizedGainLoss,
    remainingBasis,
    taxBasis: investment.tax_basis || totalContributions,
    totalValue,
    idcDeductions,
  };
}

export function calculatePortfolioMetrics(
  investments: Investment[],
  transactionsByInvestment: Record<string, InvestmentTransaction[]> = {},
  distributionsByInvestment: Record<string, InvestmentDistribution[]> = {},
  taxItemsByInvestment: Record<string, InvestmentTaxItem[]> = {},
  metalsByInvestment: Record<string, PreciousMetal[]> = {}
): PortfolioInvestmentMetrics {
  const byCurrency: PortfolioInvestmentMetrics["byCurrency"] = {
    USD: {
      totalValue: 0,
      totalInvested: 0,
      totalDistributions: 0,
      totalUnrealizedGain: 0,
      totalRealizedGain: 0,
      investmentCount: 0,
      avgRoi: 0,
      avgCashYield: 0,
    },
    JPY: {
      totalValue: 0,
      totalInvested: 0,
      totalDistributions: 0,
      totalUnrealizedGain: 0,
      totalRealizedGain: 0,
      investmentCount: 0,
      avgRoi: 0,
      avgCashYield: 0,
    },
  };

  const allocationMap = new Map<InvestmentCategory, number>();
  let roiSum: Record<InvestmentCurrency, number> = { USD: 0, JPY: 0 };
  let yieldSum: Record<InvestmentCurrency, number> = { USD: 0, JPY: 0 };

  for (const inv of investments.filter((i) => i.status === "active")) {
    const metrics = calculateInvestmentMetrics(
      inv,
      transactionsByInvestment[inv.id] ?? [],
      distributionsByInvestment[inv.id] ?? [],
      taxItemsByInvestment[inv.id] ?? [],
      metalsByInvestment[inv.id] ?? []
    );

    const currency = inv.currency;
    byCurrency[currency].totalValue += metrics.totalValue;
    byCurrency[currency].totalInvested += metrics.totalContributions;
    byCurrency[currency].totalDistributions += metrics.totalDistributions;
    byCurrency[currency].totalUnrealizedGain += metrics.unrealizedGainLoss;
    byCurrency[currency].totalRealizedGain += metrics.realizedGainLoss;
    byCurrency[currency].investmentCount += 1;
    roiSum[currency] += metrics.roi;
    yieldSum[currency] += metrics.cashYield;

    allocationMap.set(
      inv.category,
      (allocationMap.get(inv.category) ?? 0) + metrics.totalValue
    );
  }

  for (const currency of ["USD", "JPY"] as InvestmentCurrency[]) {
    const count = byCurrency[currency].investmentCount;
    byCurrency[currency].avgRoi = count > 0 ? roiSum[currency] / count : 0;
    byCurrency[currency].avgCashYield = count > 0 ? yieldSum[currency] / count : 0;
  }

  const allocationByCategory = Array.from(allocationMap.entries()).map(
    ([category, value]) => ({
      category,
      name: CATEGORY_LABELS[category],
      value,
    })
  );

  return {
    byCurrency,
    allocationByCategory,
    totalInvestments: investments.filter((i) => i.status === "active").length,
  };
}

export function buildAnnualTaxSummary(
  investments: Investment[],
  taxItemsByInvestment: Record<string, InvestmentTaxItem[]>,
  year: number
): {
  investmentName: string;
  category: string;
  ordinaryIncome: number;
  capitalGain: number;
  capitalLoss: number;
  idcDeduction: number;
  depletion: number;
  other: number;
  total: number;
}[] {
  return investments.map((inv) => {
    const items = (taxItemsByInvestment[inv.id] ?? []).filter((t) => t.tax_year === year);
    const ordinaryIncome = items.filter((t) => t.item_type === "ordinary_income").reduce((s, t) => s + t.amount, 0);
    const capitalGain = items.filter((t) => t.item_type === "capital_gain").reduce((s, t) => s + t.amount, 0);
    const capitalLoss = items.filter((t) => t.item_type === "capital_loss").reduce((s, t) => s + t.amount, 0);
    const idcDeduction = items.filter((t) => t.item_type === "idc_deduction").reduce((s, t) => s + t.amount, 0);
    const depletion = items.filter((t) => t.item_type === "depletion").reduce((s, t) => s + t.amount, 0);
    const other = items.filter((t) => !["ordinary_income", "capital_gain", "capital_loss", "idc_deduction", "depletion"].includes(t.item_type)).reduce((s, t) => s + t.amount, 0);

    return {
      investmentName: inv.name,
      category: CATEGORY_LABELS[inv.category],
      ordinaryIncome,
      capitalGain,
      capitalLoss,
      idcDeduction,
      depletion,
      other,
      total: ordinaryIncome + capitalGain + capitalLoss + idcDeduction + depletion + other,
    };
  }).filter((row) => row.total !== 0 || investments.length <= 10);
}
