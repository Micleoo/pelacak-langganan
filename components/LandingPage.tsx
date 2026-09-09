"use client";

import Link from "next/link";
import { ArrowRight, CalendarClock, Check, CheckCircle2, Coins, Play, ScanLine, ShieldCheck, TrendingUp } from "lucide-react";

interface LandingPageProps { onStartDemo: () => void; }

const features = [
  ["Scan tagihan tanpa menyalin ulang", "Tempel isi email untuk mengambil layanan, nominal, serta tanggal tagihan dalam hitungan detik.", ScanLine],
  ["Satu total untuk semua mata uang", "IDR, USD, EUR, dan SGD dinormalisasi ke mata uang dasar yang Anda pilih.", Coins],
  ["Tahu apa yang perlu dibayar", "Lihat jatuh tempo, jeda biaya, dan tangani tunggakan langsung dari dashboard.", CalendarClock],
  ["Bedakan aktual dan proyeksi", "Lihat pembayaran tercatat atau simulasi biaya aktif agar pola bulanan lebih mudah dibaca.", TrendingUp],
] as const;

export function LandingPage({ onStartDemo }: LandingPageProps) {
  return (
    <main className="overflow-hidden bg-white text-ink-slate">
      <section className="relative mx-auto max-w-6xl px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24">
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-white px-3.5 py-1.5 text-xs font-medium text-primary-800"><ShieldCheck className="h-3.5 w-3.5" aria-hidden />100% Client-Side Privacy · Tanpa Kartu Kredit · Gratis Selamanya</div>
          <h1 className="mx-auto mt-7 max-w-4xl text-5xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-6xl lg:text-7xl lg:leading-[1.02]">Ketahui Ke Mana Uang Langgananmu Pergi Setiap Bulan</h1>
          <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">Satukan biaya berulang yang tersebar, bandingkan semuanya dalam satu mata uang, dan lihat apa yang membutuhkan perhatian sebelum jatuh tempo.</p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/register" className="ds-btn-primary inline-flex min-h-12 w-full items-center justify-center gap-2 px-6 py-3 text-base sm:w-auto">
              <span className="whitespace-nowrap">Mulai Gratis Sekarang</span>
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
            </Link>
            <button type="button" onClick={onStartDemo} className="ds-btn-secondary inline-flex min-h-12 w-full items-center justify-center gap-2 px-5 py-3 text-sm sm:w-auto">
              <Play className="h-4 w-4 shrink-0 fill-current" aria-hidden />
              <span className="whitespace-nowrap">Coba Demo Interaktif (Tanpa Akun)</span>
            </button>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-slate-500">{["Multi-mata uang", "Pengingat tagihan", "Data terisolasi"].map((item) => <span key={item} className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-primary-600" aria-hidden />{item}</span>)}</div>
        </div>
        <div className="relative mx-auto mt-16 max-w-5xl border border-slate-200 bg-slate-50 p-2 sm:mt-20 sm:p-3"><div className="border border-slate-200 bg-white"><div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5"><div className="flex items-center gap-1.5" aria-hidden><span className="h-2 w-2 rounded-full bg-slate-300" /><span className="h-2 w-2 rounded-full bg-slate-300" /><span className="h-2 w-2 rounded-full bg-slate-300" /><span className="ml-2 text-xs font-medium text-slate-400">pelacaklangganan.app</span></div><span className="text-xs font-semibold text-primary-700">Dashboard</span></div><div className="grid gap-4 p-5 sm:grid-cols-[1.15fr_0.85fr] sm:p-8"><div className="border border-slate-200 bg-slate-50 p-5 sm:p-6"><p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Biaya bulanan</p><p className="mt-3 text-4xl font-semibold tracking-[-0.04em] tabular-nums text-slate-950 sm:text-5xl">Rp 906.990</p><p className="mt-2 text-sm text-slate-500">Dihitung dari 6 biaya aktif</p><div className="mt-7 space-y-3">{[["Streaming", 72, "bg-primary-600"], ["AI Tools", 51, "bg-cat-2"], ["Utilitas", 32, "bg-cat-4"]].map(([label, width, color]) => <div key={label as string} className="flex items-center gap-3"><span className={`h-2.5 w-2.5 rounded-full ${color}`} /><span className="w-20 text-xs text-slate-600">{label}</span><span className="h-1.5 flex-1 bg-slate-200"><span className={`block h-full ${color}`} style={{ width: `${width}%` }} /></span></div>)}</div></div><div className="border border-slate-200 p-5 sm:p-6"><p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Perlu perhatian</p><div className="mt-5 space-y-4">{[["Netflix Premium", "2 hari lagi", "Rp 186.000 · Streaming", "text-amber-700"], ["ChatGPT Plus", "12 hari lagi", "$20.00 · AI Tools", "text-slate-600"]].map(([name, due, detail, dueColor]) => <div key={name} className="border-b border-slate-100 pb-4"><div className="flex items-center justify-between gap-3"><span className="text-sm font-semibold">{name}</span><span className={`text-xs font-medium ${dueColor}`}>{due}</span></div><p className="mt-1 text-xs text-slate-500">{detail}</p></div>)}<button type="button" onClick={onStartDemo} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 hover:text-primary-800">Buka data contoh <ArrowRight className="h-3.5 w-3.5" aria-hidden /></button></div></div></div></div></div>
      </section>
      <section className="border-y border-slate-200 bg-slate-50"><div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28"><div className="max-w-2xl"><h2 className="text-3xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-4xl">Bukan spreadsheet lain yang harus terus Anda rawat.</h2><p className="mt-4 text-base leading-7 text-slate-600">Pelacak Langganan menyingkirkan pekerjaan berulang agar Anda cukup mencatat sekali dan kembali saat membutuhkan jawaban.</p></div><div className="mt-12 grid gap-x-12 gap-y-10 sm:grid-cols-2">{features.map(([title, description, Icon]) => <article key={title} className="border-t border-slate-300 pt-5"><Icon className="h-5 w-5 text-primary-600" aria-hidden /><h3 className="mt-4 text-base font-semibold text-slate-950">{title}</h3><p className="mt-2 max-w-md text-sm leading-6 text-slate-600">{description}</p></article>)}</div></div></section>
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="flex flex-col justify-between gap-8 border-y border-slate-200 py-10 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-primary-700">Mulai dalam hitungan menit</p>
            <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-4xl">Catat yang sedang berjalan, lalu biarkan insight bekerja.</h2>
          </div>
          <Link href="/register" className="ds-btn-primary inline-flex shrink-0 items-center gap-2 px-5 py-3 text-sm">
            Buat akun gratis <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <p className="mt-6 flex items-center gap-2 text-sm text-slate-500"><Check className="h-4 w-4 text-primary-600" aria-hidden />Data keuangan Anda diisolasi untuk akun Anda.</p>
      </section>
    </main>
  );
}
