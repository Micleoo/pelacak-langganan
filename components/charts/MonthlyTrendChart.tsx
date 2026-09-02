"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { MonthlyTrend } from "@/lib/analytics";
import type { Currency } from "@/lib/currencies";
import { formatAmount } from "@/lib/format";

interface MonthlyTrendChartProps {
  data: MonthlyTrend[];
  baseCurrency: Currency;
  chartType: "area" | "bar";
}

const MONTH_LABELS: Record<string, string> = {
  "01": "Jan",
  "02": "Feb",
  "03": "Mar",
  "04": "Apr",
  "05": "Mei",
  "06": "Jun",
  "07": "Jul",
  "08": "Agu",
  "09": "Sep",
  "10": "Okt",
  "11": "Nov",
  "12": "Des",
};

function formatMonthKey(key: string): string {
  const [year, month] = key.split("-");
  return `${MONTH_LABELS[month]} ${year.slice(2)}`;
}

export function MonthlyTrendChart({ data, baseCurrency, chartType }: MonthlyTrendChartProps) {
  const chartData = data.map((d) => ({
    month: formatMonthKey(d.month),
    monthKey: d.month,
    total: d.total,
  }));

  const maxTotal = Math.max(...chartData.map((d) => d.total), 1);
  const tickFormatter = (value: number) => formatAmount(value, baseCurrency).replace(`/${baseCurrency}`, "");

  const currencyFormatter = (value: number | undefined): [string, string] => {
    if (value === undefined) return ["", ""];
    return [formatAmount(value, baseCurrency), "Total"];
  };

  if (chartType === "bar") {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }} barSize={40}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: "#475569" }}
            axisLine={{ stroke: "#e2e8f0" }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={tickFormatter}
            tick={{ fontSize: 12, fill: "#475569" }}
            axisLine={false}
            tickLine={false}
            domain={[0, maxTotal * 1.15]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
            labelFormatter={(label) => label}
            formatter={currencyFormatter as any}
          />
          <Bar dataKey="total" fill="#0d9488" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: "#475569" }}
          axisLine={{ stroke: "#e2e8f0" }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={tickFormatter}
          tick={{ fontSize: 12, fill: "#475569" }}
          axisLine={false}
          tickLine={false}
          domain={[0, maxTotal * 1.15]}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          }}
          labelFormatter={(label) => label}
          formatter={currencyFormatter as any}
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke="#0d9488"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#area-gradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}