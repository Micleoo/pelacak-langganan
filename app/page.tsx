"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, CheckCircle2, Pause, TrendingUp, DollarSign } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useStore } from "@/components/StoreProvider";
import { computeInsight, monthlyAmountInBaseCurrency, effectiveNextBillingDate } from "@/lib/recurring";
import { formatDate, formatRelativeDue, formatAmount, formatAmountMonthly, addInterval, parseISO, toISO } from "@/lib/format";
import { categoryIdentity } from "@/lib/categories";
import { CategoryIcon, CATEGORY_SOLID } from "@/components/CategoryIcon";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PrivacyBanner } from "@/components/PrivacyBanner";
import { OnboardingCard } from "@/components/OnboardingCard";
import { StatusBadge } from "@/components/StatusBadge";
import { LandingPage } from "@/components/LandingPage";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { NO_CATEGORY_LABEL } from "@/lib/constants";
import { toast } from "react-hot-toast";
import type { Currency } from "@/lib/currencies";
import { MonthlyTrendChart, CategoryStackedChart, ChartToolbar } from "@/components/charts";
import { computeMonthlyTrend } from "@/lib/analytics";
import type { PaymentRecord, Expense } from "@/lib/types";
import { RecordPaymentModal } from "@/components/RecordPaymentModal";
import { DEMO_EXPENSES, DEMO_CATEGORIES, DEMO_SETTINGS, getDemoPaymentHistory } from "@/lib/demo-data";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const store = useStore();
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoExpenses, setDemoExpenses] = useState<Expense[]>(DEMO_EXPENSES);
  const [demoHistory, setDemoHistory] = useState<PaymentRecord[]>(() => getDemoPaymentHistory());

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("demo") === "true") {
        setIsDemoMode(true);
      }
    }
  }, []);

  const today = new Date();

  // Ambil dataset tergantung mode (Demo interaktif vs Data riil akun)
  const expenses = isDemoMode ? demoExpenses : store.expenses;
  const categories = isDemoMode ? DEMO_CATEGORIES : store.categories;
  const settings = isDemoMode ? DEMO_SETTINGS : store.settings;
  const paymentHistory = isDemoMode ? demoHistory : store.paymentHistory;

  const categoryName = (id: string | null) =>
    categories.find((c) => c.id === id)?.name ?? NO_CATEGORY_LABEL;

  // Deep Module Seam: Seluruh orkestrasi ringkasan finansial diserap oleh computeInsight
  const insight = computeInsight(expenses, categories, settings, today);
  const {
    totalMonthlyCost: total,
    baseCurrency,
    breakdown,
    upcoming,
    notifyItems,
    showBanner,
    overdueExpenses,
    pausedExpenses,
    activeExpenses: active,
  } = insight;

  const monthlyTrend = computeMonthlyTrend(expenses, paymentHistory, baseCurrency, 12);
  const [chartType, setChartType] = useState<"area" | "bar">("area");
  const [recordPaymentExpense, setRecordPaymentExpense] = useState<Expense | null>(null);

  function openRecordPaymentModal(expense: Expense) {
    setRecordPaymentExpense(expense);
  }

  function closeRecordPaymentModal() {
    setRecordPaymentExpense(null);
  }

  async function handleMarkAsPaid(expenseId: string) {
    const expense = expenses.find((e) => e.id === expenseId);
    if (!expense) return;

    if (isDemoMode) {
      const nextDate = addInterval(parseISO(expense.next_billing_date), expense.interval);
      setDemoExpenses((prev) =>
        prev.map((e) =>
          e.id === expenseId
            ? {
                ...e,
                status: "active",
                next_billing_date: toISO(nextDate),
                last_paid_date: toISO(today),
              }
            : e
        )
      );
      setDemoHistory((prev) => [
        {
          id: `demo-pay-${Date.now()}`,
          expense_id: expense.id,
          amount_paid: expense.amount,
          currency: expense.currency,
          paid_at: today.toISOString().slice(0, 10),
          month_key: today.toISOString().slice(0, 7),
          created_at: today.toISOString(),
        },
        ...prev,
      ]);
      toast.success(`${expense.name} dibayar (Simulasi Demo). Tanggal tagihan dimajukan.`);
      return;
    }

    try {
      await store.settlePayment(expenseId, expense.amount, expense.currency, today);
      toast.success(`${expense.name} dibayar & dicatat. Tanggal tagihan dimajukan.`);
    } catch {
      toast.error("Gagal mencatat pembayaran.");
    }
  }

  async function handlePause(expenseId: string) {
    if (isDemoMode) {
      setDemoExpenses((prev) =>
        prev.map((e) => {
          if (e.id !== expenseId) return e;
          const nextStatus = e.status === "paused" ? "active" : "paused";
          toast.success(`${e.name} ${nextStatus === "paused" ? "dijeda" : "diaktifkan kembali"} (Simulasi Demo).`);
          return { ...e, status: nextStatus };
        })
      );
      return;
    }

    try {
      const updated = await store.pauseExpense(expenseId);
      toast.success(`${updated.name} dijeda.`);
    } catch {
      toast.error("Gagal mengupdate status. Coba lagi.");
    }
  }

  async function handleLoadSamples() {
    try {
      for (const sample of DEMO_EXPENSES.slice(0, 4)) {
        await store.addExpense({
          name: sample.name,
          amount: sample.amount,
          currency: sample.currency,
          interval: sample.interval,
          category_id: null,
          status: sample.status,
          next_billing_date: sample.next_billing_date,
          notify_days_before: sample.notify_days_before,
          last_paid_date: sample.last_paid_date,
        });
      }
      toast.success("4 data contoh berhasil dimuat ke akun Anda!");
    } catch {
      toast.error("Gagal memuat data contoh.");
    }
  }

  // Jika auth masih diverifikasi dan bukan demo, tampilkan skeleton
  if (authLoading && !isDemoMode) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <DashboardSkeleton />
      </div>
    );
  }

  // Jika pengunjung publik (belum login) dan tidak dalam mode demo, tampilkan Landing Page
  if (!user && !isDemoMode) {
    return <LandingPage onStartDemo={() => setIsDemoMode(true)} />;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* Demo Banner */}
      {isDemoMode && (
        <div className="mb-6 rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs animate-fadeIn">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white text-lg shadow-xs">
              🎮
            </span>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-teal-950">Mode Demo Interaktif</p>
                <span className="rounded-full bg-teal-200/80 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-teal-900">
                  Simulasi
                </span>
              </div>
              <p className="text-xs text-teal-800/90 mt-0.5">
                Data contoh sedang dimuat tanpa akun. Anda bisa mengklik <strong>Bayar</strong>, <strong>Jeda</strong>, atau melihat <strong>Grafik Tren</strong> secara interaktif.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
            <Link href="/register">
              <Button className="text-xs px-3.5 py-2 font-semibold shadow-xs">
                Buat Akun Gratis
              </Button>
            </Link>
            <button
              type="button"
              onClick={() => setIsDemoMode(false)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              Keluar Demo
            </button>
          </div>
        </div>
      )}

      <PrivacyBanner />

      {showBanner && (
        <div className="mb-6 rounded-xl border border-accent-200 bg-accent-50 px-4 py-3">
          <p className="text-sm font-semibold text-accent-800">
            {notifyItems.length} biaya mendekati jatuh tempo:
          </p>
          <ul className="mt-1 list-inside list-disc text-sm text-accent-800">
            {notifyItems.map(({ expense: e, effectiveDate }) => (
              <li key={e.id}>
                {e.name} · {formatDate(effectiveDate)} ({formatRelativeDue(effectiveDate, today).label})
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-ink-slate">Dashboard</h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Ringkasan seluruh biaya berulang dan tagihan rutin Anda.
          </p>
        </div>
        <Link
          href="/expenses/new"
          className="ds-btn-primary inline-flex shrink-0 items-center gap-1.5"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Tambah biaya
        </Link>
      </div>

      {active.length === 0 && overdueExpenses.length === 0 && pausedExpenses.length === 0 ? (
        <OnboardingCard
          onLoadSamples={handleLoadSamples}
          onOpenScanner={() => {
            if (typeof window !== "undefined") {
              window.location.assign("/expenses");
            }
          }}
          isDemo={isDemoMode}
        />
      ) : (
        <>
          <section className="relative overflow-hidden rounded-xl border border-primary-100 bg-primary-50 p-6">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_100%_at_100%_0%,rgba(13,148,136,0.14),transparent_60%)]"
            />
            <div
              aria-hidden
              className="hero-grain pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-multiply"
            />
            <div className="relative">
              <p className="text-sm font-medium text-primary-700">
                Total biaya bulanan
              </p>
              <p className="mt-1 text-3xl sm:text-4xl md:text-5xl font-bold tabular-nums text-ink-slate">
                {formatAmountMonthly(total, baseCurrency)}
              </p>
              {baseCurrency !== "IDR" && (
                <p className="mt-1 text-xs text-primary-700/80">
                  (Mata uang dasar: {baseCurrency})
                </p>
              )}
              <p className="mt-2 text-xs text-primary-700">
                {active.length} biaya berlangganan aktif
              </p>

              {/* Currency Transparency Badge */}
              <div className="mt-4 inline-flex flex-wrap items-center gap-1.5 rounded-lg bg-white/85 backdrop-blur-xs px-2.5 py-1.5 text-[11px] font-medium text-slate-600 border border-primary-200/60 shadow-2xs">
                <span className="font-semibold text-primary-800">Kurs acuan:</span>
                <span>$1 = Rp 15.500</span>
                <span>·</span>
                <span>€1 = Rp 16.800</span>
                <span>·</span>
                <span>S$1 = Rp 11.500</span>
                <Link
                  href="/settings"
                  className="ml-1 text-primary-700 underline hover:text-primary-900 font-semibold"
                >
                  Detail
                </Link>
              </div>
            </div>
          </section>

          {overdueExpenses.length > 0 && (
            <section className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold text-ink-slate flex items-center gap-2">
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
                    {overdueExpenses.length}
                  </span>
                  Terlewat
                </h2>
              </div>
              <Card className="p-0 overflow-hidden">
                <ul className="divide-y divide-slate-200">
                  {overdueExpenses.map((e) => {
                    const rel = formatRelativeDue(e.next_billing_date, today);
                    const monthlyConverted = monthlyAmountInBaseCurrency(e, baseCurrency);
                    return (
                      <li key={e.id} className="flex items-center gap-3 px-4 py-3">
                        <CategoryIcon name={categoryName(e.category_id)} size={32} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <Link
                              href={`/expenses/${e.id}/edit`}
                              className="truncate text-sm font-medium text-ink-slate hover:text-primary-600"
                            >
                              {e.name}
                            </Link>
                            <StatusBadge status={e.status} />
                            <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[11px] font-medium text-rose-700">
                              {rel.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {formatDate(e.next_billing_date)}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold tabular-nums text-ink-slate">
                            {formatAmount(e.amount, e.currency as Currency)}
                          </p>
                          {e.currency !== baseCurrency && (
                            <p className="text-xs text-slate-500">
                              ~{formatAmountMonthly(monthlyConverted, baseCurrency)}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleMarkAsPaid(e.id)}
                            className="ds-btn-secondary inline-flex shrink-0 items-center gap-1.5 text-xs py-1.5 px-2.5"
                            aria-label={`Tandai ${e.name} sebagai dibayar`}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                            Bayar
                          </button>
                          <button
                            type="button"
                            onClick={() => openRecordPaymentModal(e)}
                            className="ds-btn-secondary inline-flex shrink-0 items-center gap-1.5 text-xs py-1.5 px-2.5"
                            aria-label={`Catat pembayaran ${e.name}`}
                          >
                            <DollarSign className="h-3.5 w-3.5" aria-hidden />
                            Catat
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </section>
          )}

          <section className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink-slate">
                Jatuh tempo
              </h2>
              <span className="text-xs text-slate-500">
                {upcoming.length} tagihan mendatang
              </span>
            </div>
            {upcoming.length === 0 ? (
              <p className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
                Tidak ada tagihan yang akan datang.
              </p>
            ) : (
              <Card className="p-0 overflow-hidden">
                <ul className="divide-y divide-slate-200">
                  {upcoming.map(({ expense: e, effectiveDate, overdue, dueSoon }) => {
                    const rel = formatRelativeDue(effectiveDate, today);
                    const monthlyConverted = monthlyAmountInBaseCurrency(e, baseCurrency);
                    return (
                      <li key={e.id} className="flex items-center gap-3 px-4 py-3">
                        <CategoryIcon name={categoryName(e.category_id)} size={32} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <Link
                              href={`/expenses/${e.id}/edit`}
                              className="truncate text-sm font-medium text-ink-slate hover:text-primary-600"
                            >
                              {e.name}
                            </Link>
                            {overdue && (
                              <Badge>Terlewat · dimajukan</Badge>
                            )}
                            {!overdue && dueSoon && (
                              <Badge>Sebentar lagi</Badge>
                            )}
                            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
                              {rel.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {formatDate(effectiveDate)}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold tabular-nums text-ink-slate">
                            {formatAmount(e.amount, e.currency as Currency)}
                          </p>
                          {e.currency !== baseCurrency && (
                            <p className="text-xs text-slate-500">
                              ~{formatAmountMonthly(monthlyConverted, baseCurrency)}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handlePause(e.id)}
                            className="ds-btn-secondary inline-flex shrink-0 items-center gap-1.5 text-xs py-1.5 px-2.5"
                            aria-label={`Jeda ${e.name}`}
                          >
                            <Pause className="h-3.5 w-3.5" aria-hidden />
                            Jeda
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            )}
          </section>

          {pausedExpenses.length > 0 && (
            <section className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold text-ink-slate flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                    {pausedExpenses.length}
                  </span>
                  Dijeda
                </h2>
              </div>
              <Card className="p-0 overflow-hidden">
                <ul className="divide-y divide-slate-200">
                  {pausedExpenses.map((e) => {
                    const monthlyConverted = monthlyAmountInBaseCurrency(e, baseCurrency);
                    return (
                      <li key={e.id} className="flex items-center gap-3 px-4 py-3">
                        <CategoryIcon name={categoryName(e.category_id)} size={32} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <Link
                              href={`/expenses/${e.id}/edit`}
                              className="truncate text-sm font-medium text-ink-slate hover:text-primary-600"
                            >
                              {e.name}
                            </Link>
                            <StatusBadge status={e.status} />
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {formatDate(e.next_billing_date)}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold tabular-nums text-ink-slate">
                            {formatAmount(e.amount, e.currency as Currency)}
                          </p>
                          {e.currency !== baseCurrency && (
                            <p className="text-xs text-slate-500">
                              ~{formatAmountMonthly(monthlyConverted, baseCurrency)}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handlePause(e.id)}
                            className="ds-btn-secondary inline-flex shrink-0 items-center gap-1.5 text-xs py-1.5 px-2.5"
                            aria-label={`Aktifkan kembali ${e.name}`}
                          >
                            Aktifkan
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </section>
          )}

          <section className="mt-8">
            <h2 className="mb-3 text-base font-semibold text-ink-slate">
              Rincian per kategori
            </h2>
            <ul className="space-y-3">
              {breakdown.map((b) => (
                <li key={b.key}>
                  <Card className="flex items-center gap-3 p-4">
                    <CategoryIcon name={b.name} size={32} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-sm font-medium text-ink-slate">
                          {b.name}
                        </p>
                        <p className="text-sm font-semibold tabular-nums text-ink-slate">
                          {formatAmountMonthly(b.value, baseCurrency)}
                        </p>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${CATEGORY_SOLID[categoryIdentity(b.name).color]}`}
                          style={{ width: `${Math.max(b.pct, 2)}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {Math.round(b.pct)}% dari total
                      </p>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink-slate flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary-600" aria-hidden />
                Tren Bulanan
              </h2>
            </div>
            {paymentHistory.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-12 text-center">
                <p className="text-sm font-medium text-ink-slate">Belum ada data pembayaran</p>
                <p className="mt-1 text-sm text-slate-500">
                  Catat pembayaran pertama untuk melihat tren bulanan.
                </p>
                <Link
                  href="/expenses"
                  className="ds-btn-primary mt-4 inline-flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  Ke Daftar Biaya
                </Link>
              </div>
            ) : (
              <>
                <Card className="p-5">
                  <ChartToolbar chartType={chartType} onChartTypeChange={setChartType} baseCurrency={baseCurrency} />
                  <MonthlyTrendChart data={monthlyTrend} baseCurrency={baseCurrency} chartType={chartType} />
                </Card>
                <Card className="mt-4 p-5">
                  <h3 className="mb-3 text-sm font-semibold text-ink-slate">Komposisi per Kategori</h3>
                  <CategoryStackedChart data={monthlyTrend} baseCurrency={baseCurrency} categories={categories} />
                </Card>
              </>
            )}
          </section>

          {recordPaymentExpense && (
            <RecordPaymentModal
              expense={recordPaymentExpense}
              isOpen={!!recordPaymentExpense}
              onClose={closeRecordPaymentModal}
              onSuccess={() => {
                if (isDemoMode && recordPaymentExpense) {
                  const expense = recordPaymentExpense;
                  const nextDate = addInterval(parseISO(expense.next_billing_date), expense.interval);
                  setDemoExpenses((prev) =>
                    prev.map((e) =>
                      e.id === expense.id
                        ? {
                            ...e,
                            status: "active",
                            next_billing_date: toISO(nextDate),
                            last_paid_date: toISO(today),
                          }
                        : e
                    )
                  );
                  setDemoHistory((prev) => [
                    {
                      id: `demo-pay-${Date.now()}`,
                      expense_id: expense.id,
                      amount_paid: expense.amount,
                      currency: expense.currency,
                      paid_at: today.toISOString().slice(0, 10),
                      month_key: today.toISOString().slice(0, 7),
                      created_at: today.toISOString(),
                    },
                    ...prev,
                  ]);
                }
              }}
            />
          )}
        </>
      )}
    </div>
  );
}