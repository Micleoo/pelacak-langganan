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

export function OnboardingCard({ onLoadSamples, onOpenScanner }: OnboardingCardProps) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center gap-2.5 text-primary-700">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary-200 bg-primary-50 text-primary-700">
          <Sparkles className="h-4 w-4" aria-hidden />
        </span>
        <h2 className="text-lg font-bold text-slate-900">
          Selamat Datang di Pelacak Langganan!
        </h2>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Dashboard Anda masih kosong. Pilih cara tercepat yang Anda sukai untuk mulai memantau pengeluaran berulang:
      </p>

      <div className="mt-5 grid grid-cols-1 divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {onLoadSamples && (
          <div className="flex flex-col justify-between p-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="rounded-md bg-primary-50 p-1.5 text-primary-700">
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
              className="ds-btn-primary w-full px-3 py-2 text-xs"
            >
              Muat Data Contoh
            </button>
          </div>
        )}

        {onOpenScanner && (
          <div className="flex flex-col justify-between p-4">
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
              className="ds-btn-secondary w-full px-3 py-2 text-xs"
            >
              Buka Scanner
            </button>
          </div>
        )}

        <div className="flex flex-col justify-between p-4">
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
            className="ds-btn-secondary inline-flex w-full items-center justify-center px-3 py-2 text-xs"
          >
            Import File
          </Link>
        </div>
      </div>

      <div className="mt-5 flex flex-col items-stretch justify-between gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center">
        <span className="text-xs text-slate-500">
          Lebih suka mengetik sendiri? Tambahkan satu langganan manual.
        </span>
        <Link
          href="/expenses/new"
          className="ds-btn-primary inline-flex shrink-0 items-center justify-center gap-1.5 px-4 py-2 text-xs"
        >
          <Plus className="h-4 w-4" aria-hidden />
          <span>Tambah Manual</span>
        </Link>
      </div>
    </Card>
  );
}
