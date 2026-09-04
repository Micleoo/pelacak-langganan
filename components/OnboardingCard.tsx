"use client";

import Link from "next/link";
import { Plus, Sparkles, Scan, FileSpreadsheet, PlayCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface OnboardingCardProps {
  onLoadSamples?: () => void;
  onOpenScanner?: () => void;
  isDemo?: boolean;
}

export function OnboardingCard({ onLoadSamples, onOpenScanner, isDemo }: OnboardingCardProps) {
  return (
    <Card className="p-6 sm:p-8 border-slate-200 bg-gradient-to-b from-white to-slate-50/50 shadow-sm">
      <div className="flex items-center gap-2.5 text-teal-700 mb-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-100/80 text-teal-700 shadow-xs">
          <Sparkles className="h-4 w-4" aria-hidden />
        </span>
        <h2 className="text-lg font-bold text-slate-900">
          Selamat Datang di Pelacak Langganan!
        </h2>
      </div>
      <p className="text-sm text-slate-600 mb-6">
        Dashboard Anda masih kosong. Pilih cara tercepat yang Anda sukai untuk mulai memantau pengeluaran berulang:
      </p>

      {/* 3 Action Pathways */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        {/* Pathway 1: Load Samples */}
        {onLoadSamples && (
          <div className="rounded-xl border border-teal-200/80 bg-teal-50/50 p-4 flex flex-col justify-between shadow-xs hover:border-teal-300 transition-colors">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="p-1.5 rounded-lg bg-teal-100 text-teal-700">
                  <PlayCircle className="w-4 h-4" />
                </span>
                <p className="text-xs font-bold text-slate-900">Muat 4 Contoh</p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Isi instan dengan Netflix, Spotify, ChatGPT, dan WiFi untuk melihat simulasi dashboard.
              </p>
            </div>
            <button
              type="button"
              onClick={onLoadSamples}
              className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-xs"
            >
              Muat Data Contoh
            </button>
          </div>
        )}

        {/* Pathway 2: Scan Email */}
        {onOpenScanner && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-colors">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                  <Scan className="w-4 h-4" />
                </span>
                <p className="text-xs font-bold text-slate-900">Scan Email / Invoice</p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Tempel teks tanda terima email tagihan digital, ekstrak otomatis tanpa mengetik.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenScanner}
              className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
            >
              Buka Scanner
            </button>
          </div>
        )}

        {/* Pathway 3: Import CSV */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-colors">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                <FileSpreadsheet className="w-4 h-4" />
              </span>
              <p className="text-xs font-bold text-slate-900">Import CSV</p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Pindahkan daftar langganan lama dari Google Sheet atau Excel via file CSV.
            </p>
          </div>
          <Link
            href="/expenses#import-csv"
            className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors text-center inline-block"
          >
            Import File
          </Link>
        </div>
      </div>

      {/* Manual Add Link */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-200/80">
        <span className="text-xs text-slate-500">
          Lebih suka mengetik sendiri? Tambahkan satu langganan manual.
        </span>
        <Link
          href="/expenses/new"
          className="ds-btn-primary inline-flex items-center justify-center gap-1.5 text-xs py-2 px-4 shadow-sm shrink-0"
        >
          <Plus className="h-4 w-4" aria-hidden />
          <span>Tambah Manual</span>
        </Link>
      </div>
    </Card>
  );
}
