import {
  type Investment,
  type InvestmentTaxItem,
  type InvestmentTransaction,
  type InvestmentDistribution,
  type InvestmentCapitalCall,
  CATEGORY_LABELS,
  type InvestmentCategory,
} from "@/lib/types/investments";
import { calculateInvestmentMetrics } from "@/lib/calculations/investments";

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateInvestmentCpaExport(
  investments: Investment[],
  transactionsByInvestment: Record<string, InvestmentTransaction[]>,
  distributionsByInvestment: Record<string, InvestmentDistribution[]>,
  taxItemsByInvestment: Record<string, InvestmentTaxItem[]>,
  capitalCallsByInvestment: Record<string, InvestmentCapitalCall[]>,
  year: number
): string {
  const headers = [
    "Investment ID",
    "Name",
    "Category",
    "Entity",
    "Status",
    "Country",
    "Currency",
    "Purchase Date",
    "Invested Capital",
    "Current Value",
    "Ownership %",
    "Tax Basis",
    "Remaining Basis",
    "Total Distributions",
    "Total Contributions",
    "Unrealized Gain/Loss",
    "Realized Gain/Loss",
    "ROI %",
    "IRR Estimate %",
    "Cash Yield %",
    "IDC Deductions",
    "YTD Distributions",
    "Pending Capital Calls",
    "K-1 Ordinary Income",
    "K-1 Capital Gain",
    "K-1 Capital Loss",
    "K-1 IDC Deduction",
    "Tax Year",
  ];

  const rows = investments.map((inv) => {
    const transactions = transactionsByInvestment[inv.id] ?? [];
    const distributions = distributionsByInvestment[inv.id] ?? [];
    const taxItems = (taxItemsByInvestment[inv.id] ?? []).filter((t) => t.tax_year === year);
    const capitalCalls = capitalCallsByInvestment[inv.id] ?? [];
    const metrics = calculateInvestmentMetrics(inv, transactions, distributions, taxItems);

    const ytdDist = distributions
      .filter((d) => new Date(d.distribution_date).getFullYear() === year)
      .reduce((s, d) => s + d.amount, 0);

    const pendingCalls = capitalCalls
      .filter((c) => c.status === "pending" || c.status === "overdue")
      .reduce((s, c) => s + c.amount, 0);

    const ordinaryIncome = taxItems.filter((t) => t.item_type === "ordinary_income").reduce((s, t) => s + t.amount, 0);
    const capitalGain = taxItems.filter((t) => t.item_type === "capital_gain").reduce((s, t) => s + t.amount, 0);
    const capitalLoss = taxItems.filter((t) => t.item_type === "capital_loss").reduce((s, t) => s + t.amount, 0);
    const idcDeduction = taxItems.filter((t) => t.item_type === "idc_deduction").reduce((s, t) => s + t.amount, 0);

    return [
      inv.id,
      inv.name,
      CATEGORY_LABELS[inv.category as InvestmentCategory],
      inv.entity_id ?? "",
      inv.status,
      inv.country,
      inv.currency,
      inv.purchase_date ?? "",
      inv.invested_capital.toFixed(2),
      inv.current_value.toFixed(2),
      inv.ownership_percent,
      metrics.taxBasis.toFixed(2),
      metrics.remainingBasis.toFixed(2),
      metrics.totalDistributions.toFixed(2),
      metrics.totalContributions.toFixed(2),
      metrics.unrealizedGainLoss.toFixed(2),
      metrics.realizedGainLoss.toFixed(2),
      metrics.roi.toFixed(2),
      metrics.irrPlaceholder?.toFixed(2) ?? "N/A",
      metrics.cashYield.toFixed(2),
      metrics.idcDeductions.toFixed(2),
      ytdDist.toFixed(2),
      pendingCalls.toFixed(2),
      ordinaryIncome.toFixed(2),
      capitalGain.toFixed(2),
      capitalLoss.toFixed(2),
      idcDeduction.toFixed(2),
      year,
    ].map(escapeCsv);
  });

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export function generateAnnualTaxSummaryCsv(
  investments: Investment[],
  taxItemsByInvestment: Record<string, InvestmentTaxItem[]>,
  year: number
): string {
  const headers = [
    "Investment",
    "Category",
    "Ordinary Income",
    "Capital Gain",
    "Capital Loss",
    "IDC Deduction",
    "Depletion",
    "Other",
    "Net Tax Items",
    "Tax Year",
  ];

  const rows = investments.map((inv) => {
    const items = (taxItemsByInvestment[inv.id] ?? []).filter((t) => t.tax_year === year);
    const ordinaryIncome = items.filter((t) => t.item_type === "ordinary_income").reduce((s, t) => s + t.amount, 0);
    const capitalGain = items.filter((t) => t.item_type === "capital_gain").reduce((s, t) => s + t.amount, 0);
    const capitalLoss = items.filter((t) => t.item_type === "capital_loss").reduce((s, t) => s + t.amount, 0);
    const idcDeduction = items.filter((t) => t.item_type === "idc_deduction").reduce((s, t) => s + t.amount, 0);
    const depletion = items.filter((t) => t.item_type === "depletion").reduce((s, t) => s + t.amount, 0);
    const other = items.filter((t) => ["section_179", "interest_income", "dividend", "foreign_tax", "other"].includes(t.item_type)).reduce((s, t) => s + t.amount, 0);
    const total = ordinaryIncome + capitalGain + capitalLoss + idcDeduction + depletion + other;

    return [
      inv.name,
      CATEGORY_LABELS[inv.category as InvestmentCategory],
      ordinaryIncome.toFixed(2),
      capitalGain.toFixed(2),
      capitalLoss.toFixed(2),
      idcDeduction.toFixed(2),
      depletion.toFixed(2),
      other.toFixed(2),
      total.toFixed(2),
      year,
    ].map(escapeCsv);
  });

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}
