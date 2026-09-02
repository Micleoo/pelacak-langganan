"use client";

import type { Currency } from "@/lib/currencies";
import { CURRENCY_LABELS } from "@/lib/currencies";

interface ChartToolbarProps {
  chartType: "area" | "bar";
  onChartTypeChange: (type: "area" | "bar") => void;
  baseCurrency: Currency;
}

export function ChartToolbar({ chartType, onChartTypeChange, baseCurrency }: ChartToolbarProps) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 mb-4"
      role="group"
      aria-label="Pengaturan chart"
    >
      <div className="flex items-center gap-2" role="radiogroup" aria-label="Tipe chart">
        <button
          type="button"
          role="radio"
          aria-checked={chartType === "area"}
          onClick={() => onChartTypeChange("area")}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
            chartType === "area"
              ? "bg-primary-100 text-primary-700"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M3 3v18h18" />
            <path d="m19 9-5 5-4-4-3 3" />
          </svg>
          Area
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={chartType === "bar"}
          onClick={() => onChartTypeChange("bar")}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
            chartType === "bar"
              ? "bg-primary-100 text-primary-700"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <rect x="3" y="3" width="5" height="13" rx="1" />
            <rect x="10" y="8" width="5" height="8" rx="1" />
            <rect x="17" y="5" width="5" height="11" rx="1" />
          </svg>
          Batang
        </button>
      </div>
      <span className="text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md shrink-0">
        Ditampilkan dalam {CURRENCY_LABELS[baseCurrency]}
      </span>
    </div>
  );
}