import type { TaxYearWithRelations } from "@/lib/types/tax";
import {
  buildAnnualTaxSummary,
  calculateScheduleETotals,
  convertToUsd,
} from "@/lib/calculations/tax";
import {
  FILING_STATUS_LABELS,
  TAX_YEAR_STATUS_LABELS,
  DOCUMENT_TYPE_LABELS,
} from "@/lib/types/tax";

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateAnnualSummaryCsv(data: TaxYearWithRelations): string {
  const summary = buildAnnualTaxSummary(data);
  const rate = data.usd_to_jpy_rate;

  const sections: string[] = [];

  sections.push("CASEY FINANCIAL OS — ANNUAL TAX SUMMARY");
  sections.push(`Tax Year,${data.year}`);
  sections.push(`Filing Status,${FILING_STATUS_LABELS[data.filing_status]}`);
  sections.push(`Status,${TAX_YEAR_STATUS_LABELS[data.status]}`);
  sections.push(`USD/JPY Rate,${data.usd_to_jpy_rate ?? "Not set"}`);
  sections.push(`Generated,${new Date().toISOString()}`);
  sections.push("");
  sections.push("DISCLAIMER: Organizer and CPA-preparation tool only. Does not file taxes or provide legal tax advice.");
  sections.push("");

  sections.push("SUMMARY METRICS");
  sections.push("Metric,Amount (USD)");
  sections.push(`Total Income,${summary.totalIncomeUsd.toFixed(2)}`);
  sections.push(`Total Expenses,${summary.totalExpensesUsd.toFixed(2)}`);
  sections.push(`Total Deductions,${summary.totalDeductionsUsd.toFixed(2)}`);
  sections.push(`Foreign Interest Income,${summary.foreignInterestIncome.toFixed(2)}`);
  sections.push(`Rental Income,${summary.rentalIncome.toFixed(2)}`);
  sections.push(`Rental Expenses,${summary.rentalExpenses.toFixed(2)}`);
  sections.push(`Rental Net Income,${summary.rentalNetIncome.toFixed(2)}`);
  sections.push(`IDC Deductions,${summary.idcDeductions.toFixed(2)}`);
  sections.push(`K-1 Ordinary Income,${summary.k1OrdinaryIncome.toFixed(2)}`);
  sections.push(`K-1 Total Deductions,${summary.k1TotalDeductions.toFixed(2)}`);
  sections.push(`Depreciation Total,${summary.depreciationTotal.toFixed(2)}`);
  sections.push(`FBAR Accounts,${summary.fbarAccountCount}`);
  sections.push(`FBAR Total Max Value (USD),${summary.fbarTotalMaxValue.toFixed(2)}`);
  sections.push(`Form 8938 Accounts,${summary.form8938AccountCount}`);
  sections.push(`Form 8938 Total Value,${summary.form8938TotalValue.toFixed(2)}`);
  sections.push(`Documents Received,${summary.documentsReceived}/${summary.documentsRequired}`);
  sections.push("");

  if (data.accounts.length > 0) {
    sections.push("BANK ACCOUNTS");
    sections.push("Account,Institution,Country,Currency,Type,Foreign,Year-End Balance,Max Annual Balance");
    for (const a of data.accounts) {
      sections.push(
        [
          a.account_name,
          a.institution,
          a.country,
          a.currency,
          a.account_type,
          a.is_foreign ? "Yes" : "No",
          a.year_end_balance?.toFixed(2) ?? "MISSING",
          a.max_annual_balance?.toFixed(2) ?? "MISSING",
        ].map(escapeCsv).join(",")
      );
    }
    sections.push("");
  }

  if (data.income_items.length > 0) {
    sections.push("INCOME ITEMS");
    sections.push("Type,Description,Amount,Currency,Amount (USD),Source,Foreign,Country");
    for (const i of data.income_items) {
      sections.push(
        [
          i.income_type,
          i.description,
          i.amount.toFixed(2),
          i.currency,
          convertToUsd(i.amount, i.currency, rate).toFixed(2),
          i.source ?? "",
          i.is_foreign ? "Yes" : "No",
          i.country ?? "",
        ].map(escapeCsv).join(",")
      );
    }
    sections.push("");
  }

  if (data.deductions.length > 0) {
    sections.push("DEDUCTIONS");
    sections.push("Type,Description,Amount,Currency,Amount (USD),Investment");
    for (const d of data.deductions) {
      sections.push(
        [
          d.deduction_type,
          d.description,
          d.amount.toFixed(2),
          d.currency,
          convertToUsd(d.amount, d.currency, rate).toFixed(2),
          d.investment_name ?? "",
        ].map(escapeCsv).join(",")
      );
    }
    sections.push("");
  }

  if (data.k1_items.length > 0) {
    sections.push(generateK1SummaryCsv(data).split("\n").slice(1).join("\n"));
    sections.push("");
  }

  if (data.schedule_e_items.length > 0) {
    sections.push(generateScheduleECsv(data).split("\n").slice(1).join("\n"));
    sections.push("");
  }

  if (data.fbar_items.length > 0) {
    sections.push(generateFbarCsv(data).split("\n").slice(1).join("\n"));
    sections.push("");
  }

  if (data.form_8938_items.length > 0) {
    sections.push(generateForm8938Csv(data).split("\n").slice(1).join("\n"));
    sections.push("");
  }

  if (data.documents.length > 0) {
    sections.push("DOCUMENT CHECKLIST");
    sections.push("Document,Type,Required,Received,Uploaded");
    for (const d of data.documents) {
      sections.push(
        [
          d.name,
          DOCUMENT_TYPE_LABELS[d.document_type],
          d.is_required ? "Yes" : "No",
          d.is_received ? "Yes" : "No",
          d.uploaded_at ?? "",
        ].map(escapeCsv).join(",")
      );
    }
    sections.push("");
  }

  if (summary.flags.length > 0) {
    sections.push("FLAGS / ITEMS NEEDING ATTENTION");
    sections.push("Severity,Type,Message");
    for (const f of summary.flags) {
      sections.push([f.severity, f.type, f.message].map(escapeCsv).join(","));
    }
  }

  return sections.join("\n");
}

export function generateFbarCsv(data: TaxYearWithRelations): string {
  const headers = [
    "Account Name",
    "Institution",
    "Country",
    "Account Number",
    "Account Type",
    "Max Value (USD)",
    "Year-End Value (USD)",
    "Jointly Owned",
    "Notes",
  ];

  const rows = data.fbar_items.map((item) =>
    [
      item.account_name,
      item.institution_name,
      item.country,
      item.account_number ?? "",
      item.account_type,
      item.max_value_usd?.toFixed(2) ?? "",
      item.year_end_value_usd?.toFixed(2) ?? "",
      item.jointly_owned ? "Yes" : "No",
      item.notes ?? "",
    ].map(escapeCsv).join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}

export function generateForm8938Csv(data: TaxYearWithRelations): string {
  const headers = [
    "Asset Description",
    "Institution",
    "Country",
    "Account Number",
    "Asset Type",
    "Currency",
    "Max Value During Year",
    "Year-End Value",
    "Notes",
  ];

  const rows = data.form_8938_items.map((item) =>
    [
      item.asset_description,
      item.institution,
      item.country,
      item.account_number ?? "",
      item.asset_type,
      item.currency,
      item.max_value_during_year?.toFixed(2) ?? "",
      item.year_end_value?.toFixed(2) ?? "",
      item.notes ?? "",
    ].map(escapeCsv).join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}

export function generateScheduleECsv(data: TaxYearWithRelations): string {
  const headers = [
    "Property",
    "Address",
    "Days Rented",
    "Days Personal Use",
    "Gross Rents",
    "Total Expenses",
    "Net Income",
    "Advertising",
    "Auto/Travel",
    "Cleaning",
    "Commissions",
    "Insurance",
    "Legal/Professional",
    "Management Fees",
    "Mortgage Interest",
    "Other Interest",
    "Repairs",
    "Supplies",
    "Taxes",
    "Utilities",
    "Depreciation",
    "Other Expenses",
    "Currency",
  ];

  const rows = data.schedule_e_items.map((item) => {
    const totals = calculateScheduleETotals(item);
    return [
      item.property_name,
      item.property_address,
      item.days_rented,
      item.days_personal_use,
      item.gross_rents.toFixed(2),
      totals.totalExpenses.toFixed(2),
      totals.netIncome.toFixed(2),
      item.advertising.toFixed(2),
      item.auto_travel.toFixed(2),
      item.cleaning.toFixed(2),
      item.commissions.toFixed(2),
      item.insurance.toFixed(2),
      item.legal_professional.toFixed(2),
      item.management_fees.toFixed(2),
      item.mortgage_interest.toFixed(2),
      item.other_interest.toFixed(2),
      item.repairs.toFixed(2),
      item.supplies.toFixed(2),
      item.taxes.toFixed(2),
      item.utilities.toFixed(2),
      item.depreciation.toFixed(2),
      item.other_expenses.toFixed(2),
      item.currency,
    ].map(escapeCsv).join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

export function generateK1SummaryCsv(data: TaxYearWithRelations): string {
  const headers = [
    "Entity",
    "EIN",
    "Box 1 Ordinary Income",
    "Box 2 Net Rental",
    "Box 5 Interest",
    "Box 6a Ordinary Dividends",
    "Box 8 Net Short-Term",
    "Box 9a Net Long-Term",
    "Box 12 Section 179",
    "Box 13 Other Deductions",
    "IDC Deduction",
    "Depletion",
    "Currency",
    "Notes",
  ];

  const rows = data.k1_items.map((item) =>
    [
      item.entity_name,
      item.entity_ein ?? "",
      item.box_1_ordinary_income.toFixed(2),
      item.box_2_net_rental.toFixed(2),
      item.box_5_interest.toFixed(2),
      item.box_6a_ordinary_dividends.toFixed(2),
      item.box_8_net_short_term.toFixed(2),
      item.box_9a_net_long_term.toFixed(2),
      item.box_12_section_179.toFixed(2),
      item.box_13_other_deductions.toFixed(2),
      item.idc_deduction.toFixed(2),
      item.depletion.toFixed(2),
      item.currency,
      item.notes ?? "",
    ].map(escapeCsv).join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}

export function generateCpaPackageCsv(data: TaxYearWithRelations): string {
  const parts = [
    generateAnnualSummaryCsv(data),
    "",
    "--- FBAR DETAIL ---",
    generateFbarCsv(data),
    "",
    "--- FORM 8938 DETAIL ---",
    generateForm8938Csv(data),
    "",
    "--- SCHEDULE E DETAIL ---",
    generateScheduleECsv(data),
    "",
    "--- K-1 SUMMARY ---",
    generateK1SummaryCsv(data),
  ];

  if (data.depreciation_items.length > 0) {
    parts.push("");
    parts.push("--- DEPRECIATION SCHEDULE ---");
    parts.push(
      [
        "Property,Asset,Date Acquired,Cost Basis,Method,Useful Life,Prior Depreciation,Current Year,Accumulated,Remaining Basis,Currency",
        ...data.depreciation_items.map((d) =>
          [
            d.property_name,
            d.asset_description,
            d.date_acquired ?? "",
            d.cost_basis.toFixed(2),
            d.depreciation_method,
            d.useful_life_years ?? "",
            d.prior_depreciation.toFixed(2),
            d.current_year_depreciation.toFixed(2),
            d.accumulated_depreciation.toFixed(2),
            d.remaining_basis.toFixed(2),
            d.currency,
          ].map(escapeCsv).join(",")
        ),
      ].join("\n")
    );
  }

  return parts.join("\n");
}
