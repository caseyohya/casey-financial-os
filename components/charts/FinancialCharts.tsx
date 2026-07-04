"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartDataPoint } from "@/lib/types";

const CHART_COLORS = ["#d4a853", "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444"];

interface AreaChartCardProps {
  data: ChartDataPoint[];
  dataKey?: string;
  height?: number;
}

export function AreaChartCard({
  data,
  dataKey = "value",
  height = 280,
}: AreaChartCardProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#d4a853" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#d4a853" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#243044" />
        <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
        <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1a2332",
            border: "1px solid #243044",
            borderRadius: "8px",
            color: "#e2e8f0",
          }}
          formatter={(value: number) => [`$${value.toLocaleString()}`, "Value"]}
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke="#d4a853"
          fill="url(#goldGradient)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface BarChartCardProps {
  data: ChartDataPoint[];
  dataKey?: string;
  height?: number;
}

export function BarChartCard({
  data,
  dataKey = "value",
  height = 280,
}: BarChartCardProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#243044" />
        <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
        <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1a2332",
            border: "1px solid #243044",
            borderRadius: "8px",
            color: "#e2e8f0",
          }}
          formatter={(value: number) => [`$${value.toLocaleString()}`, "Value"]}
        />
        <Bar dataKey={dataKey} fill="#d4a853" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface PieChartCardProps {
  data: ChartDataPoint[];
  height?: number;
}

export function PieChartCard({ data, height = 280 }: PieChartCardProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "#1a2332",
            border: "1px solid #243044",
            borderRadius: "8px",
            color: "#e2e8f0",
          }}
          formatter={(value: number) => [`$${value.toLocaleString()}`, "Value"]}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
