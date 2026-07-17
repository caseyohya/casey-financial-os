/**
 * Offline verification of Financial Hub + Executive KPI formulas
 * using the same synthetic TEST seed values from database/seed.sql.
 * Run: node scripts/verify-calculations.mjs
 */

function normalizeToMonthly(amount, frequency) {
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
    default:
      return 0;
  }
}

const hubAccounts = [
  { balance: 45200, account_type: "checking", is_active: true },
  { balance: 125000, account_type: "savings", is_active: true },
];
const hubAssets = [{ current_value: 50000 }, { current_value: 85000 }];
const hubLiabilities = [
  { current_balance: 18500 },
  { current_balance: 3200 },
];
const hubIncome = [
  { amount: 15000, frequency: "monthly", is_passive: false, is_active: true },
  { amount: 2800, frequency: "monthly", is_passive: true, is_active: true },
  { amount: 1200, frequency: "monthly", is_passive: true, is_active: true },
];
const hubExpenses = [
  { amount: 4200, frequency: "monthly", is_active: true },
  { amount: 800, frequency: "monthly", is_active: true },
  { amount: 450, frequency: "monthly", is_active: true },
];
const bankAccounts = [{ balance: 287800, account_type: "checking" }];
const properties = [
  {
    current_value: 485000,
    loan_balance: 210000,
    monthly_rent: 2800,
    hoa_monthly: 0,
    taxes_annual: 8400,
    insurance_annual: 2400,
    maintenance_monthly: 200,
  },
];
const investments = [
  { current_value: 310000, invested_capital: 250000 },
  { current_value: 175000, invested_capital: 150000 },
];

const hubCash = hubAccounts
  .filter((a) => a.is_active && !["credit", "loan"].includes(a.account_type))
  .reduce((s, a) => s + a.balance, 0);
const bankCash = bankAccounts
  .filter((a) => !["credit", "loan"].includes(a.account_type))
  .reduce((s, a) => s + a.balance, 0);
const hubAssetValue = hubAssets.reduce((s, a) => s + a.current_value, 0);
const propertyValue = properties.reduce((s, p) => s + p.current_value, 0);
const investmentValue = investments.reduce((s, i) => s + i.current_value, 0);
const totalAssets = hubCash + bankCash + hubAssetValue + propertyValue + investmentValue;

const hubLiabilityValue = hubLiabilities.reduce((s, l) => s + l.current_balance, 0);
const propertyLoans = properties.reduce((s, p) => s + p.loan_balance, 0);
const totalLiabilities = hubLiabilityValue + propertyLoans;
const netWorth = totalAssets - totalLiabilities;

const monthlyIncome = hubIncome
  .filter((s) => s.is_active)
  .reduce((s, i) => s + normalizeToMonthly(i.amount, i.frequency), 0);
const monthlyExpenses = hubExpenses
  .filter((e) => e.is_active)
  .reduce((s, e) => s + normalizeToMonthly(e.amount, e.frequency), 0);
const monthlyCashFlow = monthlyIncome - monthlyExpenses;
const passiveIncome = hubIncome
  .filter((s) => s.is_active && s.is_passive)
  .reduce((s, i) => s + normalizeToMonthly(i.amount, i.frequency), 0);

let realEstateNOI = 0;
for (const p of properties) {
  const opEx =
    p.hoa_monthly + p.taxes_annual / 12 + p.insurance_annual / 12 + p.maintenance_monthly;
  realEstateNOI += p.monthly_rent - opEx;
}

const investmentGains = investments.reduce(
  (s, i) => s + (i.current_value - i.invested_capital),
  0
);
const avgRoi =
  investments.reduce(
    (s, i) =>
      s +
      (i.invested_capital > 0
        ? ((i.current_value - i.invested_capital) / i.invested_capital) * 100
        : 0),
    0
  ) / investments.length;

const expected = {
  totalAssets: 1563000,
  totalLiabilities: 231700,
  netWorth: 1331300,
  monthlyIncome: 19000,
  monthlyExpenses: 5450,
  monthlyCashFlow: 13550,
  passiveIncome: 4000,
  realEstateNOI: 1700,
  investmentGains: 85000,
  // Average of 24% (venture) and ~16.67% (oil & gas)
  avgRoi: 20.333333333333332,
};

const actual = {
  totalAssets,
  totalLiabilities,
  netWorth,
  monthlyIncome,
  monthlyExpenses,
  monthlyCashFlow,
  passiveIncome,
  realEstateNOI,
  investmentGains,
  avgRoi,
};

let failed = 0;
for (const [key, want] of Object.entries(expected)) {
  const got = actual[key];
  const ok = Math.abs(got - want) < 0.01;
  console.log(`${ok ? "PASS" : "FAIL"} ${key}: got=${got} expected=${want}`);
  if (!ok) failed += 1;
}

if (failed > 0) {
  console.error(`\n${failed} calculation check(s) failed`);
  process.exit(1);
}
console.log("\nAll offline calculation checks passed.");
