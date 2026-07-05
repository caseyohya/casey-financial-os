import type { BankAccount, InvestmentHolding, RealEstateProperty } from "@/lib/types";

export function calculateNetWorth(
  accounts: BankAccount[],
  properties: RealEstateProperty[],
  holdings: InvestmentHolding[]
): { assets: number; liabilities: number; netWorth: number } {
  const cashAssets = accounts
    .filter((a) => a.account_type !== "credit" && a.account_type !== "loan")
    .reduce((sum, a) => sum + a.balance, 0);

  const liabilities = accounts
    .filter((a) => a.account_type === "credit" || a.account_type === "loan")
    .reduce((sum, a) => sum + Math.abs(a.balance), 0);

  const propertyEquity = properties.reduce(
    (sum, p) => sum + p.current_value - p.mortgage_balance,
    0
  );

  const propertyLiabilities = properties.reduce(
    (sum, p) => sum + p.mortgage_balance,
    0
  );

  const investmentValue = holdings.reduce(
    (sum, h) => sum + h.quantity * h.current_price,
    0
  );

  const assets = cashAssets + propertyEquity + investmentValue + propertyLiabilities;
  const totalLiabilities = liabilities + propertyLiabilities;
  const netWorth = assets - totalLiabilities;

  return { assets, liabilities: totalLiabilities, netWorth };
}

export function calculatePortfolioValue(holdings: InvestmentHolding[]): number {
  return holdings.reduce((sum, h) => sum + h.quantity * h.current_price, 0);
}

export function calculatePortfolioGain(holdings: InvestmentHolding[]): {
  totalValue: number;
  totalCost: number;
  gain: number;
  gainPercent: number;
} {
  const totalValue = holdings.reduce(
    (sum, h) => sum + h.quantity * h.current_price,
    0
  );
  const totalCost = holdings.reduce((sum, h) => sum + h.cost_basis, 0);
  const gain = totalValue - totalCost;
  const gainPercent = totalCost > 0 ? (gain / totalCost) * 100 : 0;

  return { totalValue, totalCost, gain, gainPercent };
}

export function calculatePropertyEquity(properties: RealEstateProperty[]): {
  totalValue: number;
  totalMortgage: number;
  totalEquity: number;
} {
  const totalValue = properties.reduce((sum, p) => sum + p.current_value, 0);
  const totalMortgage = properties.reduce((sum, p) => sum + p.mortgage_balance, 0);
  const totalEquity = totalValue - totalMortgage;

  return { totalValue, totalMortgage, totalEquity };
}

export function calculateEffectiveTaxRate(
  federalTax: number,
  stateTax: number,
  grossIncome: number
): number {
  if (grossIncome <= 0) return 0;
  return ((federalTax + stateTax) / grossIncome) * 100;
}
