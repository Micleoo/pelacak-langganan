"use client";

import Link from "next/link";
import { Plus, CheckCircle2, Sparkles, BellRing, PieChart } from "lucide-react";
import { Card } from "@/components/ui/Card";

export function OnboardingCard() {
  return (
    <Card className="p-6 border-slate-200 bg-gradient-to-b from-white to-slate-50/50 shadow-sm">
      <div className="flex items-center gap-2.5 text-primary-700 mb-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-100/80">
          <Sparkles className="h-4 w-4" aria-hidden />
        </span>
        <h2 className="text-base font-semibold text-ink-slate">
          Mulai Atur & Lacak Biaya Berulang Anda
        </h2>
      </div>
      <p className="text-sm text-slate-500 mb-5">
        Hindari tagihan mendadak dan ketahui total pengeluaran bulanan Anda dalam 3 langkah mudah:
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mb-6">
        <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 space-y-1.5 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-[11px] font-bold text-primary-700">
              1
            </span>
            <p className="text-xs font-semibold text-ink-slate">Catat Langganan</p>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Masukkan biaya rutin bulanan, tahunan, atau mingguan Anda.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 space-y-1.5 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-[11px] font-bold text-primary-700">
              2
            </span>
            <p className="text-xs font-semibold text-ink-slate">Lihat Rincian & Total</p>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Sistem otomatis menormalisasi semua biaya ke nominal bulanan yang akurat.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 space-y-1.5 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-[11px] font-bold text-primary-700">
              3
            </span>
            <p className="text-xs font-semibold text-ink-slate">Pengingat Tagihan</p>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Dapatkan notifikasi email / in-app sebelum tanggal jatuh tempo tiba.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
        <span className="text-xs text-slate-500">
          Mulai dengan mencatat satu biaya (misal: Netflix, Spotify, atau WiFi).
        </span>
        <Link
          href="/expenses/new"
          className="ds-btn-primary inline-flex items-center justify-center gap-1.5 text-xs py-2 px-4 shadow-sm"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Tambah Biaya Pertama
        </Link>
      </div>
    </Card>
  );
}
