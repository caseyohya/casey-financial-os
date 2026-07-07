import type {
  Property,
  PropertyCurrency,
  PropertyExpense,
  PropertyIncome,
  PropertyMetrics,
  PropertyMonthlySummary,
  PropertyMortgage,
  PortfolioMetrics,
} from "@/lib/types/real-estate";

export function calculateEquity(currentValue: number, loanBalance: number): number {
  return currentValue - loanBalance;
}

export function calculateLoanToValue(loanBalance: number, currentValue: number): number {
  if (currentValue <= 0) return 0;
  return (loanBalance / currentValue) * 100;
}

export function calculateAnnualDepreciation(
  buildingValue: number,
  usefulLifeYears = 27.5
): number {
  if (usefulLifeYears <= 0) return 0;
  return buildingValue / usefulLifeYears;
}

export function calculateMonthlyOperatingExpenses(property: Property): number {
  return (
    property.hoa_monthly +
    property.taxes_annual / 12 +
    property.insurance_annual / 12 +
    property.maintenance_monthly
  );
}

export function calculateVacancyLoss(
  grossRent: number,
  vacancyRatePercent: number
): number {
  return grossRent * (vacancyRatePercent / 100);
}

export function calculateNOI(
  grossIncome: number,
  vacancyLoss: number,
  operatingExpenses: number
): number {
  return grossIncome - vacancyLoss - operatingExpenses;
}

export function calculateCashFlow(noi: number, debtService: number): number {
  return noi - debtService;
}

export function calculateCapRate(annualNOI: number, currentValue: number): number {
  if (currentValue <= 0) return 0;
  return (annualNOI / currentValue) * 100;
}

export function calculateCashOnCashReturn(
  annualCashFlow: number,
  cashInvested: number
): number {
  if (cashInvested <= 0) return 0;
  return (annualCashFlow / cashInvested) * 100;
}

export function calculateDSCR(annualNOI: number, annualDebtService: number): number {
  if (annualDebtService <= 0) return annualNOI > 0 ? Infinity : 0;
  return annualNOI / annualDebtService;
}

export function getDebtServiceFromMortgages(mortgages: PropertyMortgage[]): number {
  return mortgages
    .filter((m) => m.is_active)
    .reduce((sum, m) => sum + m.monthly_payment, 0);
}

export function getDebtServiceFromExpenses(expenses: PropertyExpense[]): {
  principal: number;
  interest: number;
  total: number;
} {
  const principal = expenses
    .filter((e) => e.category === "mortgage_principal")
    .reduce((sum, e) => sum + e.amount, 0);
  const interest = expenses
    .filter((e) => e.category === "mortgage_interest")
    .reduce((sum, e) => sum + e.amount, 0);
  return { principal, interest, total: principal + interest };
}

export function getMonthlyIncomeFromRecords(
  income: PropertyIncome[],
  year: number,
  month: number
): { grossRent: number; otherIncome: number; vacancyLoss: number } {
  const filtered = income.filter((i) => {
    const d = new Date(i.income_date);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });

  const grossRent = filtered
    .filter((i) => i.income_type === "rent" && !i.is_vacancy_period)
    .reduce((sum, i) => sum + i.amount, 0);

  const vacancyLoss = filtered
    .filter((i) => i.is_vacancy_period)
    .reduce((sum, i) => sum + Math.abs(i.amount), 0);

  const otherIncome = filtered
    .filter((i) => i.income_type !== "rent")
    .reduce((sum, i) => sum + i.amount, 0);

  return { grossRent, otherIncome, vacancyLoss };
}

export function calculatePropertyMetrics(
  property: Property,
  mortgages: PropertyMortgage[] = [],
  income: PropertyIncome[] = [],
  expenses: PropertyExpense[] = []
): PropertyMetrics {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const recordedIncome = getMonthlyIncomeFromRecords(income, year, month);
  const grossMonthlyRent =
    recordedIncome.grossRent > 0 ? recordedIncome.grossRent : property.monthly_rent;
  const vacancyLoss =
    recordedIncome.vacancyLoss > 0
      ? recordedIncome.vacancyLoss
      : calculateVacancyLoss(grossMonthlyRent, property.vacancy_rate_percent);

  const operatingExpensesFromRecords = expenses
    .filter((e) => {
      const d = new Date(e.expense_date);
      return (
        d.getFullYear() === year &&
        d.getMonth() + 1 === month &&
        !["mortgage_principal", "mortgage_interest"].includes(e.category)
      );
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const operatingExpenses =
    operatingExpensesFromRecords > 0
      ? operatingExpensesFromRecords
      : calculateMonthlyOperatingExpenses(property);

  const mortgageFromExpenses = getDebtServiceFromExpenses(
    expenses.filter((e) => {
      const d = new Date(e.expense_date);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    })
  );

  const debtService =
    mortgageFromExpenses.total > 0
      ? mortgageFromExpenses.total
      : getDebtServiceFromMortgages(mortgages) || property.loan_balance > 0
        ? estimateMonthlyPayment(property.loan_balance, property.interest_rate ?? 0)
        : 0;

  const totalMonthlyIncome = grossMonthlyRent - vacancyLoss + recordedIncome.otherIncome;
  const monthlyNOI = calculateNOI(totalMonthlyIncome, 0, operatingExpenses);
  const monthlyCashFlow = calculateCashFlow(monthlyNOI, debtService);

  const annualNOI = monthlyNOI * 12;
  const annualCashFlow = monthlyCashFlow * 12;
  const annualDebtService = debtService * 12;

  const cashInvested = property.purchase_price - (property.purchase_price - property.loan_balance);

  return {
    equity: calculateEquity(property.current_value, property.loan_balance),
    loanToValue: calculateLoanToValue(property.loan_balance, property.current_value),
    monthlyNOI,
    annualNOI,
    monthlyCashFlow,
    annualCashFlow,
    capRate: calculateCapRate(annualNOI, property.current_value),
    cashOnCashReturn: calculateCashOnCashReturn(
      annualCashFlow,
      Math.max(property.purchase_price - property.loan_balance, property.purchase_price * 0.25)
    ),
    debtServiceCoverageRatio: calculateDSCR(annualNOI, annualDebtService),
    annualDepreciation: calculateAnnualDepreciation(
      property.building_value || property.current_value - property.land_value
    ),
    grossMonthlyRent,
    vacancyLoss,
    operatingExpenses,
    debtService,
  };
}

function estimateMonthlyPayment(balance: number, annualRate: number, termMonths = 360): number {
  if (balance <= 0) return 0;
  if (annualRate <= 0) return balance / termMonths;
  const monthlyRate = annualRate / 100 / 12;
  return (balance * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
    (Math.pow(1 + monthlyRate, termMonths) - 1);
}

export function calculatePortfolioMetrics(
  properties: Property[],
  mortgagesByProperty: Record<string, PropertyMortgage[]> = {},
  incomeByProperty: Record<string, PropertyIncome[]> = {},
  expensesByProperty: Record<string, PropertyExpense[]> = {}
): PortfolioMetrics {
  const byCurrency: PortfolioMetrics["byCurrency"] = {
    USD: {
      totalValue: 0,
      totalEquity: 0,
      totalLoanBalance: 0,
      totalMonthlyNOI: 0,
      totalMonthlyCashFlow: 0,
      propertyCount: 0,
      avgCapRate: 0,
    },
    JPY: {
      totalValue: 0,
      totalEquity: 0,
      totalLoanBalance: 0,
      totalMonthlyNOI: 0,
      totalMonthlyCashFlow: 0,
      propertyCount: 0,
      avgCapRate: 0,
    },
  };

  let capRateSum: Record<PropertyCurrency, number> = { USD: 0, JPY: 0 };

  for (const property of properties.filter((p) => p.is_active)) {
    const currency = property.currency;
    const metrics = calculatePropertyMetrics(
      property,
      mortgagesByProperty[property.id] ?? [],
      incomeByProperty[property.id] ?? [],
      expensesByProperty[property.id] ?? []
    );

    byCurrency[currency].totalValue += property.current_value;
    byCurrency[currency].totalEquity += metrics.equity;
    byCurrency[currency].totalLoanBalance += property.loan_balance;
    byCurrency[currency].totalMonthlyNOI += metrics.monthlyNOI;
    byCurrency[currency].totalMonthlyCashFlow += metrics.monthlyCashFlow;
    byCurrency[currency].propertyCount += 1;
    capRateSum[currency] += metrics.capRate;
  }

  for (const currency of ["USD", "JPY"] as PropertyCurrency[]) {
    const count = byCurrency[currency].propertyCount;
    byCurrency[currency].avgCapRate = count > 0 ? capRateSum[currency] / count : 0;
  }

  return {
    byCurrency,
    totalProperties: properties.filter((p) => p.is_active).length,
  };
}

export function detectVacancyPeriods(
  tenants: { lease_start: string; lease_end: string | null; status: string }[]
): { start: string; end: string; days: number }[] {
  const sorted = [...tenants]
    .filter((t) => t.lease_start)
    .sort((a, b) => new Date(a.lease_start).getTime() - new Date(b.lease_start).getTime());

  const gaps: { start: string; end: string; days: number }[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const currentEnd = sorted[i].lease_end;
    const nextStart = sorted[i + 1].lease_start;
    if (currentEnd && new Date(nextStart) > new Date(currentEnd)) {
      const days = Math.ceil(
        (new Date(nextStart).getTime() - new Date(currentEnd).getTime()) / (1000 * 60 * 60 * 24)
      );
      gaps.push({ start: currentEnd, end: nextStart, days });
    }
  }

  return gaps;
}

export function buildMonthlySummary(
  propertyId: string,
  year: number,
  month: number,
  property: Property,
  income: PropertyIncome[],
  expenses: PropertyExpense[],
  currency: PropertyCurrency
): Omit<PropertyMonthlySummary, "id" | "created_at" | "updated_at"> {
  const recorded = getMonthlyIncomeFromRecords(income, year, month);
  const grossRent = recorded.grossRent || property.monthly_rent;
  const vacancyLoss =
    recorded.vacancyLoss || calculateVacancyLoss(grossRent, property.vacancy_rate_percent);
  const otherIncome = recorded.otherIncome;

  const monthExpenses = expenses.filter((e) => {
    const d = new Date(e.expense_date);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });

  const operatingExpenses = monthExpenses
    .filter((e) => !["mortgage_principal", "mortgage_interest"].includes(e.category))
    .reduce((sum, e) => sum + e.amount, 0);

  const mortgage = getDebtServiceFromExpenses(monthExpenses);
  const totalIncome = grossRent - vacancyLoss + otherIncome;
  const noi = calculateNOI(totalIncome, 0, operatingExpenses);
  const cashFlow = calculateCashFlow(noi, mortgage.total);

  return {
    property_id: propertyId,
    year,
    month,
    gross_rent: grossRent,
    vacancy_loss: vacancyLoss,
    other_income: otherIncome,
    total_income: totalIncome,
    operating_expenses: operatingExpenses,
    mortgage_principal: mortgage.principal,
    mortgage_interest: mortgage.interest,
    net_operating_income: noi,
    cash_flow: cashFlow,
    currency,
  };
}
