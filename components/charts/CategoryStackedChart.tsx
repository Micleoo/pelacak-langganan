"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import type { MonthlyTrend } from "@/lib/analytics";
import type { Category } from "@/lib/types";
import type { Currency } from "@/lib/currencies";
import { formatAmount } from "@/lib/format";
import { categoryIdentity, CATEGORY_HEX } from "@/lib/categories";

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

interface CategoryStackedChartProps {
  data: MonthlyTrend[];
  baseCurrency: Currency;
  categories: Category[];
}

export function CategoryStackedChart({ data, baseCurrency, categories }: CategoryStackedChartProps) {
  const categoryList = categories.filter((c) => c.id !== "__none__");
  const hasNoneCategory = categories.some((c) => c.id === "__none__");

  const chartData = data.map((d) => {
    const base: Record<string, string | number> = { month: formatMonthKey(d.month), monthKey: d.month };
    for (const cat of categoryList) {
      base[cat.id] = d.byCategory.get(cat.id) ?? 0;
    }
    if (hasNoneCategory) {
      base["__none__"] = d.byCategory.get("__none__") ?? 0;
    }
    return base;
  });

  const maxTotal = Math.max(...data.map((d) => d.total), 1);
  const tickFormatter = (value: number) => formatAmount(value, baseCurrency).replace(`/${baseCurrency}`, "");

  const tooltipFormatter = (value: number | undefined, name: string): [string, string] => {
    if (value === undefined) return ["", name];
    const cat = categoryList.find((c) => c.id === name);
    return [formatAmount(value, baseCurrency), cat?.name ?? "Tanpa kategori"];
  };

  const stackedBars = categoryList.map((cat) => {
    const color = CATEGORY_HEX[categoryIdentity(cat.name).color];
    return (
      <Bar
        key={cat.id}
        dataKey={cat.id}
        stackId="a"
        fill={color}
        name={cat.name}
      >
        <Cell fill={color} />
      </Bar>
    );
  });

  const noneBar = hasNoneCategory ? (
    <Bar
      key="__none__"
      dataKey="__none__"
      stackId="a"
      fill="hsl(215, 16%, 47%)"
      name="Tanpa kategori"
    >
      <Cell fill="hsl(215, 16%, 47%)" />
    </Bar>
  ) : null;

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
          formatter={tooltipFormatter as any}
        />
        <Legend
          layout="horizontal"
          align="center"
          verticalAlign="bottom"
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ paddingTop: "10px", paddingBottom: "10px" }}
          formatter={(value: string) => {
            const cat = categoryList.find((c) => c.id === value);
            return cat?.name ?? "Tanpa kategori";
          }}
        />
        {stackedBars}
        {noneBar}
      </BarChart>
    </ResponsiveContainer>
  );
}