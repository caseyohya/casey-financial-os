import { createClient } from "@/lib/supabase/server";
import type { ExecutiveDashboardData, ExecutiveFilters, RawModuleData } from "@/lib/types/executive";
import {
  aggregateExecutiveKPIs,
  buildExecutiveCharts,
  generateAlerts,
  buildWhatChanged,
} from "@/lib/calculations/executive";

async function safeQuery<T>(query: PromiseLike<{ data: T | null; error: unknown }>): Promise<T | null> {
  try {
    const { data, error } = await query;
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

export async function fetchRawModuleData(userId: string): Promise<RawModuleData> {
  const supabase = await createClient();

  const [
    bankAccounts,
    transactions,
    properties,
    propertyIncome,
    investments,
    distributions,
    taxRecords,
    netWorthSnapshots,
    capitalCalls,
    preciousMetals,
  ] = await Promise.all([
    safeQuery(supabase.from("bank_accounts").select("balance, account_type, currency, country").eq("user_id", userId)),
    safeQuery(supabase.from("bank_transactions").select("amount, transaction_type, transaction_date, category_name").eq("user_id", userId)),
    safeQuery(supabase.from("properties").select("id, current_value, loan_balance, monthly_rent, country, currency, hoa_monthly, taxes_annual, insurance_annual, maintenance_monthly").eq("user_id", userId).eq("is_active", true)),
    safeQuery(supabase.from("property_income").select("amount, income_date, income_type, property_id").in("property_id", [])),
    safeQuery(supabase.from("investments").select("id, current_value, invested_capital, country, currency, category").eq("user_id", userId).eq("status", "active")),
    safeQuery(supabase.from("investment_distributions").select("amount, distribution_date, investment_id").in("investment_id", [])),
    safeQuery(supabase.from("tax_records").select("tax_year, federal_tax, state_tax, gross_income, effective_rate").eq("user_id", userId)),
    safeQuery(supabase.from("net_worth_snapshots").select("snapshot_date, net_worth, total_assets, total_liabilities").eq("user_id", userId).order("snapshot_date", { ascending: true })),
    safeQuery(supabase.from("investment_capital_calls").select("amount, status").in("investment_id", [])),
    safeQuery(supabase.from("precious_metals").select("quantity, spot_value").eq("user_id", userId)),
  ]);

  const propertyList = properties ?? [];
  const investmentList = investments ?? [];

  const propertyIds = propertyList.map((p: { id?: string }) => p.id).filter(Boolean);
  const investmentIds = investmentList.map((i: { id?: string }) => i.id).filter(Boolean);

  let incomeData: RawModuleData["propertyIncome"] = [];
  let distData: RawModuleData["distributions"] = [];
  let callsData: { amount: number; status: string }[] = [];

  if (propertyIds.length > 0) {
    const inc = await safeQuery(
      supabase.from("property_income").select("amount, income_date, income_type").in("property_id", propertyIds)
    );
    if (inc) incomeData = inc as RawModuleData["propertyIncome"];
  }

  if (investmentIds.length > 0) {
    const [dist, calls] = await Promise.all([
      safeQuery(supabase.from("investment_distributions").select("amount, distribution_date").in("investment_id", investmentIds)),
      safeQuery(supabase.from("investment_capital_calls").select("amount, status").in("investment_id", investmentIds)),
    ]);
    if (dist) distData = dist as RawModuleData["distributions"];
    if (calls) callsData = calls as { amount: number; status: string }[];
  }

  const preciousMetalsValue = (preciousMetals ?? []).reduce(
    (s: number, m: { quantity: number; spot_value: number }) => s + m.quantity * m.spot_value,
    0
  );

  const capitalCallsPending = (callsData ?? [])
    .filter((c: { status: string }) => c.status === "pending" || c.status === "overdue")
    .reduce((s: number, c: { amount: number }) => s + c.amount, 0);

  return {
    bankAccounts: bankAccounts ?? [],
    transactions: transactions ?? [],
    properties: propertyList,
    propertyIncome: incomeData,
    investments: investmentList,
    distributions: distData,
    taxRecords: taxRecords ?? [],
    netWorthSnapshots: netWorthSnapshots ?? [],
    capitalCallsPending,
    preciousMetalsValue,
  };
}

export async function fetchHistoricalSummaries(userId: string, months = 6) {
  const supabase = await createClient();

  const { data: nw } = await supabase
    .from("executive_net_worth_summary")
    .select("year, month, net_worth")
    .eq("user_id", userId)
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .limit(months);

  const { data: cf } = await supabase
    .from("executive_cash_flow_summary")
    .select("year, month, cash_flow")
    .eq("user_id", userId)
    .order("year", { ascending: false })
    .limit(months);

  const { data: pi } = await supabase
    .from("executive_passive_income_summary")
    .select("year, month, passive_income")
    .eq("user_id", userId)
    .order("year", { ascending: false })
    .limit(months);

  const { data: re } = await supabase
    .from("executive_real_estate_summary")
    .select("year, month, monthly_noi")
    .eq("user_id", userId)
    .order("year", { ascending: false })
    .limit(months);

  const { data: inv } = await supabase
    .from("executive_investment_summary")
    .select("year, month, monthly_distributions")
    .eq("user_id", userId)
    .order("year", { ascending: false })
    .limit(months);

  const nwList = (nw ?? []).reverse();
  return nwList.map((n, i) => ({
    year: n.year,
    month: n.month,
    net_worth: n.net_worth,
    cash_flow: cf?.[i]?.cash_flow ?? 0,
    passive_income: pi?.[i]?.passive_income ?? 0,
    noi: re?.[i]?.monthly_noi ?? 0,
    distributions: inv?.[i]?.monthly_distributions ?? 0,
  }));
}

export async function getExecutiveDashboardData(
  filters?: Partial<ExecutiveFilters>
): Promise<ExecutiveDashboardData> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const now = new Date();
  const resolvedFilters: ExecutiveFilters = {
    year: filters?.year ?? now.getFullYear(),
    month: filters?.month ?? now.getMonth() + 1,
    country: filters?.country ?? "ALL",
    category: filters?.category ?? "ALL",
  };

  const [rawData, historical] = await Promise.all([
    fetchRawModuleData(user.id),
    fetchHistoricalSummaries(user.id),
  ]);

  const kpis = aggregateExecutiveKPIs(rawData, resolvedFilters);
  const charts = buildExecutiveCharts(rawData, kpis, resolvedFilters, historical);
  const alerts = generateAlerts(rawData, kpis);

  const prevMonth = resolvedFilters.month === 1 ? 12 : resolvedFilters.month - 1;
  const prevYear = resolvedFilters.month === 1 ? resolvedFilters.year - 1 : resolvedFilters.year;
  const prevHistorical = historical.find((h) => h.year === prevYear && h.month === prevMonth);

  const whatChanged = buildWhatChanged(kpis, prevHistorical ? {
    netWorth: prevHistorical.net_worth,
    monthlyCashFlow: prevHistorical.cash_flow,
    passiveIncome: prevHistorical.passive_income,
    realEstateNOI: prevHistorical.noi,
  } : null);

  return { kpis, charts, alerts, whatChanged, filters: resolvedFilters };
}

export async function refreshExecutiveSummaries(userId: string, filters: ExecutiveFilters) {
  const supabase = await createClient();
  const rawData = await fetchRawModuleData(userId);
  const kpis = aggregateExecutiveKPIs(rawData, filters);
  const country = filters.country;
  const currency = kpis.currency;

  const base = { user_id: userId, year: filters.year, month: filters.month, country, currency };

  await Promise.all([
    supabase.from("executive_net_worth_summary").upsert({
      ...base,
      total_assets: kpis.totalAssets,
      total_liabilities: kpis.totalLiabilities,
      net_worth: kpis.netWorth,
    }, { onConflict: "user_id,year,month,country,currency" }),

    supabase.from("executive_cash_flow_summary").upsert({
      ...base,
      monthly_income: kpis.monthlyIncome,
      monthly_expenses: kpis.monthlyExpenses,
      cash_flow: kpis.monthlyCashFlow,
    }, { onConflict: "user_id,year,month,country,currency" }),

    supabase.from("executive_liquidity_summary").upsert({
      ...base,
      cash_position: kpis.cashPosition,
      liquid_assets: kpis.cashPosition,
      liquidity_ratio: kpis.liquidityRatio,
    }, { onConflict: "user_id,year,month,country,currency" }),

    supabase.from("executive_passive_income_summary").upsert({
      ...base,
      passive_income: kpis.passiveIncome,
      target_amount: kpis.passiveIncomeTarget,
      progress_percent: kpis.passiveIncomeProgress,
      rental_income: rawData.properties.reduce((s, p) => s + p.monthly_rent, 0),
      distribution_income: rawData.distributions.reduce((s, d) => s + d.amount, 0) / Math.max(rawData.distributions.length, 1),
    }, { onConflict: "user_id,year,month,country,currency" }),

    supabase.from("executive_real_estate_summary").upsert({
      ...base,
      portfolio_value: rawData.properties.reduce((s, p) => s + p.current_value, 0),
      total_equity: kpis.realEstateEquity,
      monthly_noi: kpis.realEstateNOI,
      property_count: rawData.properties.length,
    }, { onConflict: "user_id,year,month,country,currency" }),

    supabase.from("executive_investment_summary").upsert({
      ...base,
      portfolio_value: kpis.investmentValue,
      total_distributions: rawData.distributions.reduce((s, d) => s + d.amount, 0),
      monthly_distributions: rawData.distributions.filter((d) => {
        const dt = new Date(d.distribution_date);
        return dt.getFullYear() === filters.year && dt.getMonth() + 1 === filters.month;
      }).reduce((s, d) => s + d.amount, 0),
      avg_roi: kpis.investmentROI,
      investment_count: rawData.investments.length,
    }, { onConflict: "user_id,year,month,country,currency" }),

    supabase.from("executive_financial_independence_summary").upsert({
      ...base,
      fi_score: kpis.fiScore,
      passive_income_coverage: kpis.passiveIncome / Math.max(kpis.monthlyExpenses, 1) * 100,
      debt_ratio: kpis.debtRatio,
      savings_rate: kpis.monthlyIncome > 0 ? (kpis.monthlyCashFlow / kpis.monthlyIncome) * 100 : 0,
      health_score: kpis.healthScore,
    }, { onConflict: "user_id,year,month,country,currency" }),
  ]);

  const totalAssets = kpis.totalAssets;
  const allocations = [
    { category: "cash", amount: kpis.cashPosition },
    { category: "real_estate", amount: rawData.properties.reduce((s, p) => s + p.current_value, 0) },
    { category: "investments", amount: kpis.investmentValue },
  ];

  for (const alloc of allocations) {
    if (alloc.amount > 0) {
      await supabase.from("executive_asset_allocation").upsert({
        ...base,
        category: alloc.category,
        amount: alloc.amount,
        percent: totalAssets > 0 ? (alloc.amount / totalAssets) * 100 : 0,
      }, { onConflict: "user_id,year,month,category,country,currency" });
    }
  }

  const latestTax = rawData.taxRecords.find((t) => t.tax_year === filters.year);
  if (latestTax) {
    await supabase.from("executive_tax_summary").upsert({
      user_id: userId,
      year: filters.year,
      estimated_tax: latestTax.federal_tax + latestTax.state_tax,
      effective_rate: latestTax.effective_rate,
      federal_tax: latestTax.federal_tax,
      state_tax: latestTax.state_tax,
      gross_income: latestTax.gross_income,
      currency,
    }, { onConflict: "user_id,year,currency" });
  }
}
