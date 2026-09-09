"use client";

import type { Currency } from "@/lib/currencies";
import { CURRENCY_LABELS } from "@/lib/currencies";

interface ChartToolbarProps {
  chartType: "area" | "bar";
  onChartTypeChange: (type: "area" | "bar") => void;
  trendMode: "actual" | "projected";
  onTrendModeChange: (mode: "actual" | "projected") => void;
  baseCurrency: Currency;
}

export function ChartToolbar({ chartType, onChartTypeChange, trendMode, onTrendModeChange, baseCurrency }: ChartToolbarProps) {
  return (
    <div
      className="mb-4 flex flex-wrap items-center justify-between gap-3"
      role="group"
      aria-label="Pengaturan chart"
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1" role="radiogroup" aria-label="Sumber data tren">
          {(["actual", "projected"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={trendMode === mode}
              onClick={() => onTrendModeChange(mode)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 ${trendMode === mode ? "border border-primary-200 bg-white text-primary-800" : "text-slate-600 hover:text-slate-900"}`}
            >
              {mode === "actual" ? "Aktual" : "Proyeksi"}
            </button>
          ))}
        </div>
        <button
          type="button"
          role="radio"
          aria-checked={chartType === "area"}
          onClick={() => onChartTypeChange("area")}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 ${
            chartType === "area"
              ? "border-primary-200 bg-primary-50 text-primary-800"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
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
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 ${
            chartType === "bar"
              ? "border-primary-200 bg-primary-50 text-primary-800"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
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
      <span className="shrink-0 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600">
        Ditampilkan dalam {CURRENCY_LABELS[baseCurrency]}
      </span>
    </div>
  );
}
