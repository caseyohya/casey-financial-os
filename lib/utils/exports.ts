import type {
  Property,
  PropertyExpense,
  PropertyIncome,
  PropertyMonthlySummary,
} from "@/lib/types/real-estate";
import { calculatePropertyMetrics } from "@/lib/calculations/real-estate";
import { formatPropertyAddress } from "@/lib/utils/real-estate";

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function sumByCategory(expenses: PropertyExpense[], categories: string[]): number {
  return expenses
    .filter((e) => categories.includes(e.category))
    .reduce((sum, e) => sum + e.amount, 0);
}

function sumIncome(income: PropertyIncome[], year: number): number {
  return income
    .filter((i) => new Date(i.income_date).getFullYear() === year && i.income_type === "rent" && !i.is_vacancy_period)
    .reduce((sum, i) => sum + i.amount, 0);
}

export function generateScheduleEExport(
  properties: Property[],
  incomeByProperty: Record<string, PropertyIncome[]>,
  expensesByProperty: Record<string, PropertyExpense[]>,
  year: number
): string {
  const headers = [
    "Property Name",
    "Address",
    "Country",
    "Currency",
    "Line 3 — Rents Received",
    "Line 5 — Advertising",
    "Line 6 — Auto and Travel",
    "Line 7 — Cleaning and Maintenance",
    "Line 8 — Commissions",
    "Line 9 — Insurance",
    "Line 10 — Legal and Professional",
    "Line 11 — Management Fees",
    "Line 12 — Mortgage Interest",
    "Line 13 — Other Interest",
    "Line 14 — Repairs",
    "Line 15 — Supplies",
    "Line 16 — Taxes",
    "Line 17 — Utilities",
    "Line 18 — Depreciation",
    "Line 19 — Other",
    "Line 20 — Total Expenses",
    "Line 21 — Net Income (Loss)",
  ];

  const rows = properties
    .filter((p) => p.property_type === "rental" || p.property_type === "commercial")
    .map((property) => {
      const income = (incomeByProperty[property.id] ?? []).filter(
        (i) => new Date(i.income_date).getFullYear() === year
      );
      const expenses = (expensesByProperty[property.id] ?? []).filter(
        (e) => new Date(e.expense_date).getFullYear() === year
      );

      const rentsReceived =
        income.filter((i) => i.income_type === "rent" && !i.is_vacancy_period).reduce((s, i) => s + i.amount, 0) ||
        property.monthly_rent * 12;

      const insurance = sumByCategory(expenses, ["insurance"]) || property.insurance_annual;
      const repairs = sumByCategory(expenses, ["repairs"]);
      const maintenance = sumByCategory(expenses, ["maintenance"]);
      const taxes = sumByCategory(expenses, ["taxes"]) || property.taxes_annual;
      const utilities = sumByCategory(expenses, ["utilities"]);
      const management = sumByCategory(expenses, ["management"]);
      const mortgageInterest = sumByCategory(expenses, ["mortgage_interest"]);
      const hoa = sumByCategory(expenses, ["hoa"]) || property.hoa_monthly * 12;
      const other = sumByCategory(expenses, ["other"]);

      const metrics = calculatePropertyMetrics(property);
      const depreciation = metrics.annualDepreciation;

      const totalExpenses =
        insurance + repairs + maintenance + taxes + utilities + management +
        mortgageInterest + hoa + other + depreciation;

      const netIncome = rentsReceived - totalExpenses;

      return [
        property.name,
        formatPropertyAddress(property),
        property.country,
        property.currency,
        rentsReceived.toFixed(2),
        "0.00",
        "0.00",
        (maintenance).toFixed(2),
        "0.00",
        insurance.toFixed(2),
        "0.00",
        management.toFixed(2),
        mortgageInterest.toFixed(2),
        "0.00",
        repairs.toFixed(2),
        "0.00",
        taxes.toFixed(2),
        utilities.toFixed(2),
        depreciation.toFixed(2),
        (hoa + other).toFixed(2),
        totalExpenses.toFixed(2),
        netIncome.toFixed(2),
      ].map(escapeCsv);
    });

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export function generateCpaExport(
  properties: Property[],
  incomeByProperty: Record<string, PropertyIncome[]>,
  expensesByProperty: Record<string, PropertyExpense[]>,
  summaries: PropertyMonthlySummary[],
  year: number
): string {
  const headers = [
    "Property ID",
    "Property Name",
    "Address",
    "Country",
    "Currency",
    "Property Type",
    "Purchase Price",
    "Purchase Date",
    "Current Value",
    "Land Value",
    "Building Value",
    "Loan Balance",
    "Interest Rate",
    "Equity",
    "LTV %",
    "Annual Gross Rent",
    "Annual Operating Expenses",
    "Annual NOI",
    "Annual Cash Flow",
    "Cap Rate %",
    "Cash-on-Cash %",
    "DSCR",
    "Annual Depreciation",
    "Vacancy Rate %",
    "Year",
    "YTD Gross Rent",
    "YTD Expenses",
    "YTD Mortgage Principal",
    "YTD Mortgage Interest",
    "YTD Net Income",
  ];

  const rows = properties.map((property) => {
    const income = incomeByProperty[property.id] ?? [];
    const expenses = expensesByProperty[property.id] ?? [];
    const yearIncome = income.filter((i) => new Date(i.income_date).getFullYear() === year);
    const yearExpenses = expenses.filter((e) => new Date(e.expense_date).getFullYear() === year);

    const metrics = calculatePropertyMetrics(property, [], yearIncome, yearExpenses);
    const annualGrossRent = sumIncome(income, year) || property.monthly_rent * 12;
    const annualOpEx = yearExpenses
      .filter((e) => !["mortgage_principal", "mortgage_interest"].includes(e.category))
      .reduce((s, e) => s + e.amount, 0);

    const ytdPrincipal = yearExpenses
      .filter((e) => e.category === "mortgage_principal")
      .reduce((s, e) => s + e.amount, 0);
    const ytdInterest = yearExpenses
      .filter((e) => e.category === "mortgage_interest")
      .reduce((s, e) => s + e.amount, 0);
    const ytdNet = annualGrossRent - yearExpenses.reduce((s, e) => s + e.amount, 0);

    return [
      property.id,
      property.name,
      formatPropertyAddress(property),
      property.country,
      property.currency,
      property.property_type,
      property.purchase_price,
      property.purchase_date ?? "",
      property.current_value,
      property.land_value,
      property.building_value,
      property.loan_balance,
      property.interest_rate ?? "",
      metrics.equity.toFixed(2),
      metrics.loanToValue.toFixed(2),
      annualGrossRent.toFixed(2),
      annualOpEx.toFixed(2),
      metrics.annualNOI.toFixed(2),
      metrics.annualCashFlow.toFixed(2),
      metrics.capRate.toFixed(2),
      metrics.cashOnCashReturn.toFixed(2),
      metrics.debtServiceCoverageRatio === Infinity ? "N/A" : metrics.debtServiceCoverageRatio.toFixed(2),
      metrics.annualDepreciation.toFixed(2),
      property.vacancy_rate_percent,
      year,
      annualGrossRent.toFixed(2),
      yearExpenses.reduce((s, e) => s + e.amount, 0).toFixed(2),
      ytdPrincipal.toFixed(2),
      ytdInterest.toFixed(2),
      ytdNet.toFixed(2),
    ].map(escapeCsv);
  });

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}
