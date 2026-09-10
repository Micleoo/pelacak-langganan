import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import type { Category } from "@/lib/types";
import type { MonthlyTrend } from "@/lib/analytics";
import { CategoryStackedChart } from "./CategoryStackedChart";

let legendFormatter: ((value: string) => string) | undefined;
let tooltipFormatter: ((value: number | undefined, name: string) => [string, string]) | undefined;
let barNames: string[] = [];

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Bar: ({ children, name }: { children: ReactNode; name: string }) => {
    barNames.push(name);
    return <div>{children}</div>;
  },
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: (props: { formatter: typeof tooltipFormatter }) => {
    tooltipFormatter = props.formatter;
    return null;
  },
  Legend: (props: { formatter: typeof legendFormatter }) => {
    legendFormatter = props.formatter;
    return null;
  },
  Cell: () => null,
}));

const categories: Category[] = [
  { id: "streaming", name: "Streaming", created_at: "2026-01-01" },
  { id: "ai-tools", name: "AI Tools", created_at: "2026-01-01" },
];

const data: MonthlyTrend[] = [
  {
    month: "2026-09",
    total: 60,
    byCategory: new Map([
      ["streaming", 20],
      ["ai-tools", 30],
      ["__none__", 10],
    ]),
  },
];

describe("CategoryStackedChart", () => {
  it("keeps category series labels and only labels the uncategorized series as Tanpa kategori", () => {
    barNames = [];
    render(<CategoryStackedChart data={data} baseCurrency="USD" categories={categories} />);

    expect(legendFormatter).toBeDefined();
    expect(tooltipFormatter).toBeDefined();
    expect(legendFormatter!("Streaming")).toBe("Streaming");
    expect(legendFormatter!("AI Tools")).toBe("AI Tools");
    expect(legendFormatter!("__none__")).toBe("Tanpa kategori");
    expect(barNames).toEqual(["Streaming", "AI Tools", "Tanpa kategori"]);
    expect(barNames.filter((name) => name === "Tanpa kategori")).toHaveLength(1);
    expect(tooltipFormatter!(20, "Streaming")).toEqual(["US$20,00", "Streaming"]);
    expect(tooltipFormatter!(10, "__none__")).toEqual(["US$10,00", "Tanpa kategori"]);
  });
});
