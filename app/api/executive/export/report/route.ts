import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getExecutiveDashboardData } from "@/lib/data/executive";
import { formatCurrency, formatPercent } from "@/lib/utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()), 10);
  const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1), 10);
  const country = (searchParams.get("country") ?? "ALL") as "ALL" | "US" | "JP";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await getExecutiveDashboardData({ year, month, country });
  const { kpis, alerts, whatChanged } = data;
  const monthName = new Date(year, month - 1).toLocaleString("en-US", { month: "long" });
  const c = kpis.currency;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Executive Financial Report — ${monthName} ${year}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Georgia', serif; color: #1a1a2e; padding: 48px; max-width: 800px; margin: 0 auto; }
    h1 { font-size: 24px; font-weight: 600; border-bottom: 2px solid #c49a47; padding-bottom: 12px; margin-bottom: 8px; }
    .subtitle { color: #666; font-size: 13px; margin-bottom: 32px; }
    h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 2px; color: #888; margin: 28px 0 12px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .kpi { border: 1px solid #e5e5e5; padding: 16px; border-radius: 4px; }
    .kpi-label { font-size: 11px; text-transform: uppercase; color: #888; letter-spacing: 1px; }
    .kpi-value { font-size: 22px; font-weight: 600; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 13px; }
    th { font-size: 11px; text-transform: uppercase; color: #888; }
    .alert { padding: 10px 14px; border-left: 3px solid #c49a47; background: #faf8f3; margin-bottom: 8px; font-size: 13px; }
    .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #eee; font-size: 11px; color: #aaa; }
    @media print { body { padding: 24px; } }
  </style>
</head>
<body>
  <h1>Casey Financial OS — Executive Report</h1>
  <p class="subtitle">${monthName} ${year} · ${country === "ALL" ? "All Countries" : country} · Confidential</p>

  <h2>Financial Position</h2>
  <div class="grid">
    <div class="kpi"><div class="kpi-label">Net Worth</div><div class="kpi-value">${formatCurrency(kpis.netWorth, c)}</div></div>
    <div class="kpi"><div class="kpi-label">Total Assets</div><div class="kpi-value">${formatCurrency(kpis.totalAssets, c)}</div></div>
    <div class="kpi"><div class="kpi-label">Total Liabilities</div><div class="kpi-value">${formatCurrency(kpis.totalLiabilities, c)}</div></div>
    <div class="kpi"><div class="kpi-label">Cash Position</div><div class="kpi-value">${formatCurrency(kpis.cashPosition, c)}</div></div>
  </div>

  <h2>Cash Flow</h2>
  <div class="grid">
    <div class="kpi"><div class="kpi-label">Monthly Income</div><div class="kpi-value">${formatCurrency(kpis.monthlyIncome, c)}</div></div>
    <div class="kpi"><div class="kpi-label">Monthly Expenses</div><div class="kpi-value">${formatCurrency(kpis.monthlyExpenses, c)}</div></div>
    <div class="kpi"><div class="kpi-label">Cash Flow</div><div class="kpi-value">${formatCurrency(kpis.monthlyCashFlow, c)}</div></div>
    <div class="kpi"><div class="kpi-label">Passive Income</div><div class="kpi-value">${formatCurrency(kpis.passiveIncome, c)}</div></div>
  </div>

  <h2>Performance & Ratios</h2>
  <div class="grid">
    <div class="kpi"><div class="kpi-label">Real Estate NOI</div><div class="kpi-value">${formatCurrency(kpis.realEstateNOI, c)}</div></div>
    <div class="kpi"><div class="kpi-label">Investment Value</div><div class="kpi-value">${formatCurrency(kpis.investmentValue, c)}</div></div>
    <div class="kpi"><div class="kpi-label">Debt Ratio</div><div class="kpi-value">${formatPercent(kpis.debtRatio)}</div></div>
    <div class="kpi"><div class="kpi-label">FI Score</div><div class="kpi-value">${kpis.fiScore}/100</div></div>
  </div>

  <h2>What Changed</h2>
  <table>
    <thead><tr><th>Metric</th><th>Previous</th><th>Current</th><th>Change</th></tr></thead>
    <tbody>
      ${whatChanged.map((w) => `<tr><td>${w.label}</td><td>${formatCurrency(w.previous, c)}</td><td>${formatCurrency(w.current, c)}</td><td>${formatPercent(w.changePercent)}</td></tr>`).join("")}
      ${whatChanged.length === 0 ? "<tr><td colspan='4'>No prior period data available</td></tr>" : ""}
    </tbody>
  </table>

  <h2>Alerts</h2>
  ${alerts.map((a) => `<div class="alert"><strong>${a.title}</strong> — ${a.message}</div>`).join("")}

  <div class="footer">
    Generated by Casey Financial OS · Read-only report · Not for distribution · ${new Date().toISOString()}
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
      "Content-Disposition": `inline; filename="executive-report-${year}-${month}.html"`,
    },
  });
}
