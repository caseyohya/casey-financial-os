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

type TaxRecordRow = RawModuleData["taxRecords"][number];
type SnapshotRow = RawModuleData["netWorthSnapshots"][number];

async function fetchTaxRecords(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<TaxRecordRow[]> {
  const direct = await safeQuery(
    supabase
      .from("tax_records")
      .select("tax_year, federal_tax, state_tax, gross_income, effective_rate")
      .eq("user_id", userId)
  );
  if (direct && direct.length > 0) {
    return direct as TaxRecordRow[];
  }

  // Fallback: derive lightweight tax exposure from tax_years + income items
  const years = await safeQuery(
    supabase.from("tax_years").select("*").eq("user_id", userId)
  );
  if (!years || years.length === 0) return [];

  const results: TaxRecordRow[] = [];
  for (const y of years as { id: string; year?: number; tax_year?: number }[]) {
    const taxYear = y.year ?? y.tax_year;
    if (!taxYear) continue;

    const incomeItems = await safeQuery(
      supabase.from("tax_income_items").select("amount").eq("tax_year_id", y.id)
    );
    const gross = (incomeItems ?? []).reduce(
      (sum: number, item: { amount: number }) => sum + Number(item.amount ?? 0),
      0
    );

    results.push({
      tax_year: taxYear,
      federal_tax: 0,
      state_tax: 0,
      gross_income: gross,
      effective_rate: 0,
    });
  }
  return results;
}

async function fetchNetWorthSnapshots(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<SnapshotRow[]> {
  const snapshots = await safeQuery(
    supabase
      .from("net_worth_snapshots")
      .select("snapshot_date, net_worth, total_assets, total_liabilities")
      .eq("user_id", userId)
      .order("snapshot_date", { ascending: true })
  );
  if (snapshots && snapshots.length > 0) {
    return snapshots as SnapshotRow[];
  }

  const monthly = await safeQuery(
    supabase
      .from("monthly_snapshots")
      .select("snapshot_month, net_worth, total_assets, total_liabilities")
      .eq("user_id", userId)
      .order("snapshot_month", { ascending: true })
  );
  if (!monthly) return [];

  return (monthly as {
    snapshot_month: string;
    net_worth: number;
    total_assets: number;
    total_liabilities: number;
  }[]).map((row) => ({
    snapshot_date: row.snapshot_month,
    net_worth: Number(row.net_worth ?? 0),
    total_assets: Number(row.total_assets ?? 0),
    total_liabilities: Number(row.total_liabilities ?? 0),
  }));
}

export async function fetchRawModuleData(userId: string): Promise<RawModuleData> {
  const supabase = await createClient();

  const [
    bankAccounts,
    transactions,
    hubAccounts,
    hubAssets,
    hubLiabilities,
    hubIncomeSources,
    hubExpenses,
    properties,
    investments,
    taxRecords,
    netWorthSnapshots,
    preciousMetals,
  ] = await Promise.all([
    safeQuery(supabase.from("bank_accounts").select("*").eq("user_id", userId)),
    safeQuery(supabase.from("bank_transactions").select("*").eq("user_id", userId)),
    safeQuery(supabase.from("accounts").select("*").eq("user_id", userId)),
    safeQuery(supabase.from("assets").select("*").eq("user_id", userId)),
    safeQuery(supabase.from("liabilities").select("*").eq("user_id", userId)),
    safeQuery(supabase.from("income_sources").select("*").eq("user_id", userId)),
    safeQuery(supabase.from("expenses").select("*").eq("user_id", userId)),
    safeQuery(supabase.from("properties").select("*").eq("user_id", userId).eq("is_active", true)),
    safeQuery(supabase.from("investments").select("*").eq("user_id", userId)),
    fetchTaxRecords(supabase, userId),
    fetchNetWorthSnapshots(supabase, userId),
    safeQuery(supabase.from("precious_metals").select("*").eq("user_id", userId)),
  ]);

  const normalizeBankAccounts = (
    rows: Record<string, unknown>[] | null
  ): RawModuleData["bankAccounts"] =>
    (rows ?? []).map((row) => ({
      balance: Number(row.balance ?? 0),
      account_type: String(row.account_type ?? "other"),
      currency: String(row.currency ?? row.currency_code ?? "USD"),
      country: String(row.country ?? "US"),
    }));

  const normalizeTransactions = (
    rows: Record<string, unknown>[] | null
  ): RawModuleData["transactions"] =>
    (rows ?? []).map((row) => ({
      amount: Number(row.amount ?? 0),
      transaction_type: String(
        row.transaction_type ?? (row.is_income ? "income" : "expense")
      ),
      transaction_date: String(row.transaction_date ?? ""),
      category_name: String(row.category_name ?? row.category ?? "uncategorized"),
    }));

  const propertyList: RawModuleData["properties"] = (
    (properties as Record<string, unknown>[] | null) ?? []
  ).map((row) => ({
    id: row.id ? String(row.id) : undefined,
    current_value: Number(row.current_value ?? 0),
    loan_balance: Number(row.loan_balance ?? 0),
    monthly_rent: Number(row.monthly_rent ?? 0),
    country: String(row.country ?? "US"),
    currency: String(row.currency ?? row.currency_code ?? "USD"),
    hoa_monthly: Number(row.hoa_monthly ?? 0),
    taxes_annual: Number(row.taxes_annual ?? 0),
    insurance_annual: Number(row.insurance_annual ?? 0),
    maintenance_monthly: Number(row.maintenance_monthly ?? 0),
  }));

  const investmentList = (
    (investments as Record<string, unknown>[] | null) ?? []
  )
    .map((row) => ({
      id: row.id ? String(row.id) : undefined,
      current_value: Number(row.current_value ?? 0),
      invested_capital: Number(row.invested_capital ?? row.cost_basis ?? 0),
      country: String(row.country ?? "US"),
      currency: String(row.currency ?? row.currency_code ?? "USD"),
      category: String(row.category ?? row.investment_type ?? "other"),
      status: row.status ? String(row.status) : undefined,
      is_active: typeof row.is_active === "boolean" ? row.is_active : undefined,
    }))
    .filter((investment) => {
      if (investment.status) return investment.status === "active";
      if (typeof investment.is_active === "boolean") return investment.is_active;
      return true;
    });

  const propertyIds = propertyList
    .map((p) => p.id)
    .filter((id): id is string => Boolean(id));
  const investmentIds = investmentList
    .map((i) => i.id)
    .filter((id): id is string => Boolean(id));

  let incomeData: RawModuleData["propertyIncome"] = [];
  let distData: RawModuleData["distributions"] = [];
  let callsData: { amount: number; status: string }[] = [];

  if (propertyIds.length > 0) {
    const inc = await safeQuery(
      supabase
        .from("property_income")
        .select("amount, income_date, income_type")
        .in("property_id", propertyIds)
    );
    if (inc) incomeData = inc as RawModuleData["propertyIncome"];
  }

  if (investmentIds.length > 0) {
    const [dist, calls] = await Promise.all([
      safeQuery(
        supabase
          .from("investment_distributions")
          .select("amount, distribution_date")
          .in("investment_id", investmentIds)
      ),
      safeQuery(
        supabase
          .from("investment_capital_calls")
          .select("amount, status")
          .in("investment_id", investmentIds)
      ),
    ]);
    if (dist) distData = dist as RawModuleData["distributions"];
    if (calls) callsData = calls as { amount: number; status: string }[];
  }

  const preciousMetalsValue = ((preciousMetals ?? []) as Record<string, unknown>[]).reduce(
    (s, m) => {
      const quantity = Number(m.quantity ?? m.weight_oz ?? 0);
      const currentValue = Number(m.current_value ?? 0);
      if (quantity > 0) {
        const spot = Number(
          m.spot_value ?? (currentValue > 0 ? currentValue / quantity : 0)
        );
        return s + quantity * spot;
      }
      return s + currentValue;
    },
    0
  );

  const capitalCallsPending = callsData
    .filter((c) => c.status === "pending" || c.status === "overdue")
    .reduce((s, c) => s + Number(c.amount ?? 0), 0);

  const normalizeHubAccounts = (
    rows: Record<string, unknown>[] | null
  ): RawModuleData["hubAccounts"] =>
    (rows ?? []).map((row) => ({
      balance: Number(row.balance ?? 0),
      account_type: String(row.account_type ?? "other"),
      is_active: row.is_active !== false,
    }));

  return {
    bankAccounts: normalizeBankAccounts(bankAccounts as Record<string, unknown>[] | null),
    transactions: normalizeTransactions(transactions as Record<string, unknown>[] | null),
    hubAccounts: normalizeHubAccounts(hubAccounts as Record<string, unknown>[] | null),
    hubAssets: ((hubAssets as Record<string, unknown>[] | null) ?? []).map((row) => ({
      current_value: Number(row.current_value ?? 0),
    })),
    hubLiabilities: ((hubLiabilities as Record<string, unknown>[] | null) ?? []).map((row) => ({
      current_balance: Number(row.current_balance ?? 0),
    })),
    hubIncomeSources: ((hubIncomeSources as Record<string, unknown>[] | null) ?? []).map((row) => ({
      amount: Number(row.amount ?? 0),
      frequency: String(row.frequency ?? "monthly"),
      is_passive: Boolean(row.is_passive),
      is_active: row.is_active !== false,
    })),
    hubExpenses: ((hubExpenses as Record<string, unknown>[] | null) ?? []).map((row) => ({
      amount: Number(row.amount ?? 0),
      frequency: String(row.frequency ?? "monthly"),
      is_active: row.is_active !== false,
    })),
    properties: propertyList,
    propertyIncome: incomeData,
    investments: investmentList,
    distributions: distData,
    taxRecords,
    netWorthSnapshots,
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
    .order("month", { ascending: false })
    .limit(months);

  const { data: pi } = await supabase
    .from("executive_passive_income_summary")
    .select("year, month, passive_income")
    .eq("user_id", userId)
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .limit(months);

  const { data: re } = await supabase
    .from("executive_real_estate_summary")
    .select("year, month, monthly_noi")
    .eq("user_id", userId)
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .limit(months);

  const { data: inv } = await supabase
    .from("executive_investment_summary")
    .select("year, month, monthly_distributions")
    .eq("user_id", userId)
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .limit(months);

  const nwList = (nw ?? []).slice().reverse();
  const cfByKey = new Map(
    (cf ?? []).map((row) => [`${row.year}-${row.month}`, row.cash_flow])
  );
  const piByKey = new Map(
    (pi ?? []).map((row) => [`${row.year}-${row.month}`, row.passive_income])
  );
  const reByKey = new Map(
    (re ?? []).map((row) => [`${row.year}-${row.month}`, row.monthly_noi])
  );
  const invByKey = new Map(
    (inv ?? []).map((row) => [`${row.year}-${row.month}`, row.monthly_distributions])
  );

  return nwList.map((n) => {
    const key = `${n.year}-${n.month}`;
    return {
      year: n.year,
      month: n.month,
      net_worth: n.net_worth,
      cash_flow: cfByKey.get(key) ?? 0,
      passive_income: piByKey.get(key) ?? 0,
      noi: reByKey.get(key) ?? 0,
      distributions: invByKey.get(key) ?? 0,
    };
  });
}

export async function getExecutiveDashboardData(
  filters?: Partial<ExecutiveFilters>
): Promise<{
  data: ExecutiveDashboardData;
  rawData: RawModuleData;
  historical: Awaited<ReturnType<typeof fetchHistoricalSummaries>>;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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

  const whatChanged = buildWhatChanged(
    kpis,
    prevHistorical
      ? {
          netWorth: prevHistorical.net_worth,
          monthlyCashFlow: prevHistorical.cash_flow,
          passiveIncome: prevHistorical.passive_income,
          realEstateNOI: prevHistorical.noi,
        }
      : null
  );

  return {
    data: { kpis, charts, alerts, whatChanged, filters: resolvedFilters },
    rawData,
    historical,
  };
}

export async function refreshExecutiveSummaries(userId: string, filters: ExecutiveFilters) {
  const supabase = await createClient();
  const rawData = await fetchRawModuleData(userId);
  const kpis = aggregateExecutiveKPIs(rawData, filters);
  const country = filters.country;
  const currency = kpis.currency;

  const base = { user_id: userId, year: filters.year, month: filters.month, country, currency };

  await Promise.all([
    supabase.from("executive_net_worth_summary").upsert(
      {
        ...base,
        total_assets: kpis.totalAssets,
        total_liabilities: kpis.totalLiabilities,
        net_worth: kpis.netWorth,
      },
      { onConflict: "user_id,year,month,country,currency" }
    ),

    supabase.from("executive_cash_flow_summary").upsert(
      {
        ...base,
        monthly_income: kpis.monthlyIncome,
        monthly_expenses: kpis.monthlyExpenses,
        cash_flow: kpis.monthlyCashFlow,
      },
      { onConflict: "user_id,year,month,country,currency" }
    ),

    supabase.from("executive_liquidity_summary").upsert(
      {
        ...base,
        cash_position: kpis.cashPosition,
        liquid_assets: kpis.cashPosition,
        liquidity_ratio: kpis.liquidityRatio,
      },
      { onConflict: "user_id,year,month,country,currency" }
    ),

    supabase.from("executive_passive_income_summary").upsert(
      {
        ...base,
        passive_income: kpis.passiveIncome,
        target_amount: kpis.passiveIncomeTarget,
        progress_percent: kpis.passiveIncomeProgress,
        rental_income: rawData.properties.reduce((s, p) => s + p.monthly_rent, 0),
        distribution_income:
          rawData.distributions.reduce((s, d) => s + d.amount, 0) /
          Math.max(rawData.distributions.length, 1),
      },
      { onConflict: "user_id,year,month,country,currency" }
    ),

    supabase.from("executive_real_estate_summary").upsert(
      {
        ...base,
        portfolio_value: rawData.properties.reduce((s, p) => s + p.current_value, 0),
        total_equity: kpis.realEstateEquity,
        monthly_noi: kpis.realEstateNOI,
        property_count: rawData.properties.length,
      },
      { onConflict: "user_id,year,month,country,currency" }
    ),

    supabase.from("executive_investment_summary").upsert(
      {
        ...base,
        portfolio_value: kpis.investmentValue,
        total_distributions: rawData.distributions.reduce((s, d) => s + d.amount, 0),
        monthly_distributions: rawData.distributions
          .filter((d) => {
            const dt = new Date(d.distribution_date);
            return dt.getFullYear() === filters.year && dt.getMonth() + 1 === filters.month;
          })
          .reduce((s, d) => s + d.amount, 0),
        avg_roi: kpis.investmentROI,
        investment_count: rawData.investments.length,
      },
      { onConflict: "user_id,year,month,country,currency" }
    ),

    supabase.from("executive_financial_independence_summary").upsert(
      {
        ...base,
        fi_score: kpis.fiScore,
        passive_income_coverage: (kpis.passiveIncome / Math.max(kpis.monthlyExpenses, 1)) * 100,
        debt_ratio: kpis.debtRatio,
        savings_rate: kpis.monthlyIncome > 0 ? (kpis.monthlyCashFlow / kpis.monthlyIncome) * 100 : 0,
        health_score: kpis.healthScore,
      },
      { onConflict: "user_id,year,month,country,currency" }
    ),
  ]);

  const totalAssets = kpis.totalAssets;
  const allocations = [
    { category: "cash", amount: kpis.cashPosition },
    { category: "real_estate", amount: rawData.properties.reduce((s, p) => s + p.current_value, 0) },
    { category: "investments", amount: kpis.investmentValue },
  ];

  for (const alloc of allocations) {
    if (alloc.amount > 0) {
      await supabase.from("executive_asset_allocation").upsert(
        {
          ...base,
          category: alloc.category,
          amount: alloc.amount,
          percent: totalAssets > 0 ? (alloc.amount / totalAssets) * 100 : 0,
        },
        { onConflict: "user_id,year,month,category,country,currency" }
      );
    }
  }

  const latestTax = rawData.taxRecords.find((t) => t.tax_year === filters.year);
  if (latestTax) {
    await supabase.from("executive_tax_summary").upsert(
      {
        user_id: userId,
        year: filters.year,
        estimated_tax: latestTax.federal_tax + latestTax.state_tax,
        effective_rate: latestTax.effective_rate,
        federal_tax: latestTax.federal_tax,
        state_tax: latestTax.state_tax,
        gross_income: latestTax.gross_income,
        currency,
      },
      { onConflict: "user_id,year,currency" }
    );
  }
}
