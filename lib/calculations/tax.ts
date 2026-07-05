import type {
  TaxYearWithRelations,
  TaxAccount,
  TaxDocument,
  TaxFlag,
  AnnualTaxSummary,
  Currency,
} from "@/lib/types/tax";

export function convertToUsd(
  amount: number,
  currency: Currency,
  usdToJpyRate: number | null
): number {
  if (currency === "USD") return amount;
  if (!usdToJpyRate || usdToJpyRate === 0) return amount;
  return amount / usdToJpyRate;
}

export function convertToJpy(
  amount: number,
  currency: Currency,
  usdToJpyRate: number | null
): number {
  if (currency === "JPY") return amount;
  if (!usdToJpyRate) return amount;
  return amount * usdToJpyRate;
}

export function getMissingDocumentFlags(documents: TaxDocument[]): TaxFlag[] {
  return documents
    .filter((d) => d.is_required && !d.is_received)
    .map((d) => ({
      type: "missing_document" as const,
      severity: "warning" as const,
      message: `Missing document: ${d.name}`,
      entityId: d.id,
      entityName: d.name,
    }));
}

export function getAccountBalanceFlags(accounts: TaxAccount[]): TaxFlag[] {
  const flags: TaxFlag[] = [];

  for (const account of accounts) {
    if (!account.is_active) continue;

    if (account.year_end_balance === null || account.year_end_balance === undefined) {
      flags.push({
        type: "missing_balance",
        severity: "error",
        message: `${account.account_name}: missing year-end balance`,
        entityId: account.id,
        entityName: account.account_name,
      });
    }

    if (account.max_annual_balance === null || account.max_annual_balance === undefined) {
      flags.push({
        type: "missing_max_balance",
        severity: "error",
        message: `${account.account_name}: missing maximum annual balance`,
        entityId: account.id,
        entityName: account.account_name,
      });
    }
  }

  return flags;
}

export function getAllFlags(data: TaxYearWithRelations): TaxFlag[] {
  return [
    ...getMissingDocumentFlags(data.documents),
    ...getAccountBalanceFlags(data.accounts),
    ...getForeignAccountFlags(data.foreign_accounts),
  ];
}

export function getForeignAccountFlags(
  accounts: TaxYearWithRelations["foreign_accounts"]
): TaxFlag[] {
  const flags: TaxFlag[] = [];

  for (const account of accounts) {
    if (account.year_end_value_usd === null) {
      flags.push({
        type: "missing_balance",
        severity: "warning",
        message: `Foreign account ${account.account_name}: missing year-end USD value`,
        entityId: account.id,
        entityName: account.account_name,
      });
    }
    if (account.max_value_usd === null) {
      flags.push({
        type: "missing_max_balance",
        severity: "warning",
        message: `Foreign account ${account.account_name}: missing max USD value`,
        entityId: account.id,
        entityName: account.account_name,
      });
    }
  }

  return flags;
}

export function calculateScheduleETotals(item: TaxYearWithRelations["schedule_e_items"][0]) {
  const totalExpenses =
    item.advertising +
    item.auto_travel +
    item.cleaning +
    item.commissions +
    item.insurance +
    item.legal_professional +
    item.management_fees +
    item.mortgage_interest +
    item.other_interest +
    item.repairs +
    item.supplies +
    item.taxes +
    item.utilities +
    item.depreciation +
    item.other_expenses;

  return {
    grossRents: item.gross_rents,
    totalExpenses,
    netIncome: item.gross_rents - totalExpenses,
  };
}

export function buildAnnualTaxSummary(data: TaxYearWithRelations): AnnualTaxSummary {
  const rate = data.usd_to_jpy_rate;

  const totalIncomeUsd = data.income_items.reduce(
    (sum, item) => sum + convertToUsd(item.amount, item.currency, rate),
    0
  );

  const totalExpensesUsd = data.expense_items.reduce(
    (sum, item) => sum + convertToUsd(item.amount, item.currency, rate),
    0
  );

  const totalDeductionsUsd = data.deductions.reduce(
    (sum, item) => sum + convertToUsd(item.amount, item.currency, rate),
    0
  );

  const foreignInterestIncome = data.income_items
    .filter((i) => i.income_type === "foreign_interest" || (i.is_foreign && i.income_type === "interest"))
    .reduce((sum, item) => sum + convertToUsd(item.amount, item.currency, rate), 0);

  const rentalIncome = data.schedule_e_items.reduce(
    (sum, item) => sum + convertToUsd(item.gross_rents, item.currency, rate),
    0
  );

  const rentalExpenses = data.schedule_e_items.reduce((sum, item) => {
    const totals = calculateScheduleETotals(item);
    return sum + convertToUsd(totals.totalExpenses, item.currency, rate);
  }, 0);

  const idcDeductions = [
    ...data.deductions.filter((d) => d.deduction_type === "idc"),
    ...data.k1_items,
  ].reduce((sum, item) => {
    const amount = "deduction_type" in item ? item.amount : item.idc_deduction;
    const currency = item.currency;
    return sum + convertToUsd(amount, currency, rate);
  }, 0);

  const k1OrdinaryIncome = data.k1_items.reduce(
    (sum, item) => sum + convertToUsd(item.box_1_ordinary_income, item.currency, rate),
    0
  );

  const k1TotalDeductions = data.k1_items.reduce(
    (sum, item) =>
      sum +
      convertToUsd(
        item.box_12_section_179 + item.box_13_other_deductions + item.idc_deduction + item.depletion,
        item.currency,
        rate
      ),
    0
  );

  const depreciationTotal = data.depreciation_items.reduce(
    (sum, item) => sum + convertToUsd(item.current_year_depreciation, item.currency, rate),
    0
  );

  const fbarTotalMaxValue = data.fbar_items.reduce(
    (sum, item) => sum + (item.max_value_usd ?? 0),
    0
  );

  const form8938TotalValue = data.form_8938_items.reduce(
    (sum, item) => sum + (item.year_end_value ?? 0),
    0
  );

  const documentsRequired = data.documents.filter((d) => d.is_required).length;
  const documentsReceived = data.documents.filter((d) => d.is_received).length;
  const flags = getAllFlags(data);

  return {
    year: data.year,
    totalIncomeUsd,
    totalExpensesUsd,
    totalDeductionsUsd,
    foreignInterestIncome,
    rentalIncome,
    rentalExpenses,
    rentalNetIncome: rentalIncome - rentalExpenses,
    idcDeductions,
    k1OrdinaryIncome,
    k1TotalDeductions,
    depreciationTotal,
    fbarAccountCount: data.fbar_items.length,
    fbarTotalMaxValue,
    form8938AccountCount: data.form_8938_items.length,
    form8938TotalValue,
    documentsReceived,
    documentsRequired,
    flags,
  };
}

export function calculateTaxYearDashboardMetrics(years: TaxYearWithRelations[]) {
  const currentYear = new Date().getFullYear();
  const activeYear = years.find((y) => y.year === currentYear) ?? years[0];

  if (!activeYear) {
    return {
      totalYears: 0,
      currentYearFlags: 0,
      documentsComplete: 0,
      documentsTotal: 0,
      totalIncome: 0,
    };
  }

  const summary = buildAnnualTaxSummary(activeYear);

  return {
    totalYears: years.length,
    currentYearFlags: summary.flags.length,
    documentsComplete: summary.documentsReceived,
    documentsTotal: summary.documentsRequired,
    totalIncome: summary.totalIncomeUsd,
    activeYear: activeYear.year,
  };
}
