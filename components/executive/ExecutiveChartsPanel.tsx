import type { ExecutiveChartData } from "@/lib/types/executive";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { AreaChartCard, BarChartCard, PieChartCard } from "@/components/charts/FinancialCharts";

interface ExecutiveChartsPanelProps {
  charts: ExecutiveChartData;
}

export function ExecutiveChartsPanel({ charts }: ExecutiveChartsPanelProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Net Worth Trend" description="Historical trajectory">
          <AreaChartCard data={charts.netWorthTrend} height={240} />
        </DashboardCard>
        <DashboardCard title="Cash Flow Trend" description="Income vs expenses">
          <BarChartCard data={charts.cashFlowTrend.map((d) => ({ name: d.name, value: d.cashFlow }))} height={240} />
        </DashboardCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Passive Income Trend" description="Progress toward $5K/mo">
          <AreaChartCard data={charts.passiveIncomeTrend} height={240} />
        </DashboardCard>
        <DashboardCard title="Asset Allocation" description="Portfolio breakdown">
          <PieChartCard data={charts.assetAllocation} height={240} />
        </DashboardCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Country Allocation" description="U.S. vs Japan">
          <PieChartCard data={charts.countryAllocation} height={240} />
        </DashboardCard>
        <DashboardCard title="Income Sources" description="Monthly breakdown">
          <BarChartCard data={charts.incomeSources} height={240} />
        </DashboardCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Expense Categories" description="Monthly breakdown">
          <BarChartCard data={charts.expenseCategories} height={240} />
        </DashboardCard>
        <DashboardCard title="Real Estate NOI Trend" description="Net operating income">
          <AreaChartCard data={charts.realEstateNOITrend} height={240} />
        </DashboardCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Investment Distributions" description="Distribution trend">
          <BarChartCard data={charts.investmentDistributionTrend} height={240} />
        </DashboardCard>
        <DashboardCard title="Tax Exposure by Year" description="Annual liability">
          <BarChartCard data={charts.taxExposureByYear} height={240} />
        </DashboardCard>
      </div>
    </div>
  );
}
