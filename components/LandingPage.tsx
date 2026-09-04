"use client";

import Link from "next/link";
import {
  ShieldCheck,
  Zap,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Receipt,
  Scan,
  Coins,
  Calendar,
  CheckCircle2,
  Lock,
  PlayCircle,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface LandingPageProps {
  onStartDemo: () => void;
}

export function LandingPage({ onStartDemo }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900 pb-20">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24">
        {/* Background glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-teal-400/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 text-center">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-semibold mb-6 shadow-xs animate-fadeIn">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>100% Client-Side Privacy · Tanpa Kartu Kredit · Gratis Selamanya</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15] mb-6">
            Ketahui Ke Mana Uang <span className="text-teal-600">Langgananmu Pergi</span> Setiap Bulan
          </h1>

          {/* Subheadline */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed mb-8">
            Netflix, Spotify, tool AI, dan tagihan rutin seringkali luput dicatat karena siklus dan mata uang berbeda. Satukan semuanya dalam satu dashboard cerdas, normalisasikan ke biaya bulanan, dan cegah tunggakan.
          </p>

          {/* CTA Group */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12">
            <Link href="/register" className="w-full sm:w-auto">
              <Button
                className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold shadow-md hover:shadow-lg transition-all"
              >
                <span>Mulai Gratis Sekarang</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>

            <button
              type="button"
              onClick={onStartDemo}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-teal-200 bg-white text-teal-800 hover:bg-teal-50/70 font-semibold text-base shadow-xs transition-all hover:border-teal-300"
            >
              <PlayCircle className="w-5 h-5 text-teal-600" />
              <span>Coba Demo Interaktif (Tanpa Akun)</span>
            </button>
          </div>

          {/* Micro-social Proof */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              Multi-Mata Uang (IDR, USD, EUR, SGD)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              Scan Email & Invoice Otomatis
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              Grafik Tren 12 Bulan
            </span>
          </div>
        </div>
      </section>

      {/* 2. Interactive Mockup Preview Card */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 mb-20">
        <div className="relative rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xl overflow-hidden">
          {/* Top Mockup Header Bar */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="ml-2 text-xs font-mono text-slate-400">pelacak-langganan.app/dashboard</span>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-100">
              Live Interactive Preview
            </span>
          </div>

          {/* Hero Numbers Preview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/60">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Biaya Bulanan</span>
              <div className="text-3xl font-extrabold text-slate-900 mt-1 tabular-nums">Rp 906.990</div>
              <span className="text-[11px] text-teal-600 font-medium">Termasuk konversi USD 30.00</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/60">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Jatuh Tempo Terdekat</span>
              <div className="text-base font-bold text-slate-900 mt-1">Netflix Premium</div>
              <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                2 hari lagi (Rp 186.000)
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/60">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Deteksi Tunggakan</span>
              <div className="text-base font-bold text-slate-900 mt-1">1 Tagihan Terlewat</div>
              <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded bg-red-100 text-red-800">
                IndiHome (Terlewat 2 hari)
              </span>
            </div>
          </div>

          {/* Interactive Banner inside Preview */}
          <div className="p-4 rounded-xl bg-teal-600 text-white flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-sm">
              <span className="font-bold">Ingin mencoba langsung?</span> Jelajahi dashboard lengkap dengan data contoh realistis.
            </div>
            <button
              type="button"
              onClick={onStartDemo}
              className="px-4 py-2 rounded-lg bg-white text-teal-800 text-xs font-bold hover:bg-teal-50 transition-colors shadow-xs shrink-0"
            >
              Buka Demo Sekarang →
            </button>
          </div>
        </div>
      </section>

      {/* 3. Core Features Grid */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 mb-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Dibuat Khusus untuk Menyederhanakan Pengeluaran Rutin
          </h2>
          <p className="mt-2 text-slate-600 text-sm max-w-xl mx-auto">
            Semua yang Anda butuhkan untuk mengelola komitmen finansial berulang tanpa kerumitan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Scanner */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4 border border-teal-100">
              <Scan className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Scan & Parse Email Tagihan</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Cukup tempel isi email tagihan dari Netflix, Spotify, ChatGPT, atau IndiHome. Sistem mengekstrak nama, nominal, dan tanggal secara otomatis tanpa mengetik manual.
            </p>
          </div>

          {/* Card 2: Multi-Currency */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 border border-indigo-100">
              <Coins className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Multi-Mata Uang Otomatis</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Catat tagihan dalam mata uang aslinya (USD, EUR, SGD, IDR) dengan dukungan angka desimal ($9.99). Seluruh total tetap diakumulasi rapi dalam Base Currency pilihan Anda.
            </p>
          </div>

          {/* Card 3: Status Life-Cycle */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 border border-amber-100">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Jeda Langganan & Anti-Tunggakan</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Jeda langganan musiman tanpa menghapus datanya. Jika ada tagihan yang terlewat, status otomatis menjadi <em>Overdue</em> dan siap dilunasi dengan satu klik.
            </p>
          </div>

          {/* Card 4: Historical Trends */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-100">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Grafik Tren Pengeluaran 12 Bulan</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Evaluasi lonjakan biaya antar-bulan melalui grafik visual Recharts. Identifikasi kategori mana yang paling memakan anggaran tiap bulannya.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Comparison Table: Spreadsheet vs Pelacak Langganan */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 mb-20">
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mb-6 text-center">
            Mengapa Tidak Cukup Pakai Spreadsheet Biasa?
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="pb-3">Fitur</th>
                  <th className="pb-3 text-slate-400">Spreadsheet Manual</th>
                  <th className="pb-3 text-teal-600">Pelacak Langganan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3.5 font-medium text-slate-900">Normalisasi Siklus Tagihan</td>
                  <td className="py-3.5 text-slate-500">Ketik rumus manual</td>
                  <td className="py-3.5 text-teal-700 font-semibold">✓ Otomatis (Tahunan/Kuartal/Bulanan)</td>
                </tr>
                <tr>
                  <td className="py-3.5 font-medium text-slate-900">Konversi Kurs Valuta Asing</td>
                  <td className="py-3.5 text-slate-500">Hitung kalkulator manual</td>
                  <td className="py-3.5 text-teal-700 font-semibold">✓ Otomatis ke Base Currency</td>
                </tr>
                <tr>
                  <td className="py-3.5 font-medium text-slate-900">Input Tagihan Cepat</td>
                  <td className="py-3.5 text-slate-500">Ketik satu per satu</td>
                  <td className="py-3.5 text-teal-700 font-semibold">✓ Scan Email / Invoice Digital</td>
                </tr>
                <tr>
                  <td className="py-3.5 font-medium text-slate-900">Pengingat Jatuh Tempo</td>
                  <td className="py-3.5 text-slate-500">Tidak ada pengingat</td>
                  <td className="py-3.5 text-teal-700 font-semibold">✓ Email & Alert In-App (H-3)</td>
                </tr>
                <tr>
                  <td className="py-3.5 font-medium text-slate-900">Privasi & Akses Data</td>
                  <td className="py-3.5 text-slate-500">Rawan terhapus / terbagi</td>
                  <td className="py-3.5 text-teal-700 font-semibold">✓ Terisolasi Row Level Security (RLS)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 5. Bottom CTA Box */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-extrabold tracking-tight mb-4">
              Siap Mengendalikan Pengeluaran Berulangmu?
            </h2>
            <p className="text-slate-300 max-w-lg mx-auto mb-8 text-sm sm:text-base">
              Tidak ada biaya tersembunyi. Data keuangan Anda tersimpan privat khusus untuk Anda.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="w-full sm:w-auto">
                <Button
                  className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-md"
                >
                  Buat Akun Gratis
                </Button>
              </Link>
              <button
                type="button"
                onClick={onStartDemo}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 text-sm font-semibold transition-colors"
              >
                Coba Demo Dulu
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
