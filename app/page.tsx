"use client";

import Link from "next/link";
import { Plus, CheckCircle2, Pause } from "lucide-react";
import { useStore } from "@/components/StoreProvider";
import { buildUpcoming, resolveNotifyDays, advanceOverdueExpense, computeMonthlyCost, computeCategoryBreakdown, monthlyAmountInBaseCurrency } from "@/lib/recurring";
import { formatDate, formatRelativeDue, formatAmount, formatAmountMonthly } from "@/lib/format";
import { categoryIdentity } from "@/lib/categories";
import { CategoryIcon, CATEGORY_SOLID } from "@/components/CategoryIcon";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PrivacyBanner } from "@/components/PrivacyBanner";
import { OnboardingCard } from "@/components/OnboardingCard";
import { StatusBadge } from "@/components/StatusBadge";
import { NO_CATEGORY_LABEL, NONE_CATEGORY_KEY } from "@/lib/constants";
import { toast } from "react-hot-toast";
import type { Currency } from "@/lib/currencies";

export default function DashboardPage() {
  const { expenses, categories, settings, updateExpense, advanceOverdueExpense: storeAdvanceOverdue } = useStore();
  const today = new Date();

  const active = expenses.filter((e) => e.status === "active");
  const overdueExpenses = expenses.filter((e) => e.status === "overdue");
  const pausedExpenses = expenses.filter((e) => e.status === "paused");

  const baseCurrency = (settings?.base_currency as Currency) ?? "IDR";
  const total = computeMonthlyCost(expenses, baseCurrency);

  const categoryName = (id: string | null) =>
    categories.find((c) => c.id === id)?.name ?? NO_CATEGORY_LABEL;

  const categoryBreakdownMap = computeCategoryBreakdown(expenses, baseCurrency);
  const breakdown = [...categoryBreakdownMap.entries()]
    .map(([key, value]) => ({
      key,
      name: key === NONE_CATEGORY_KEY ? NO_CATEGORY_LABEL : categoryName(key),
      value,
      pct: total > 0 ? (value / total) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);

  const upcoming = buildUpcoming(expenses, today, (e) =>
    resolveNotifyDays(e, settings),
  );

  const notifyItems = upcoming.filter((u) => u.overdue || u.dueSoon);
  const showBanner = settings.in_app_enabled && notifyItems.length > 0;

  async function handleMarkAsPaid(expenseId: string) {
    const expense = expenses.find((e) => e.id === expenseId);
    if (!expense) return;

    try {
      const advanced = advanceOverdueExpense(expense, today);
      await storeAdvanceOverdue(expenseId, advanced.next_billing_date, advanced.last_paid_date!);
      toast.success(`${expense.name} ditandai dibayar. Tanggal tagihan dimajukan.`);
    } catch {
      toast.error("Gagal mengupdate biaya. Coba lagi.");
    }
  }

  async function handlePause(expenseId: string) {
    const expense = expenses.find((e) => e.id === expenseId);
    if (!expense) return;

    try {
      await updateExpense(expenseId, { ...expense, status: "paused" });
      toast.success(`${expense.name} dijeda.`);
    } catch {
      toast.error("Gagal mengupdate status. Coba lagi.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
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
        <OnboardingCard />
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
                        <button
                          type="button"
                          onClick={() => handleMarkAsPaid(e.id)}
                          className="ds-btn-secondary inline-flex shrink-0 items-center gap-1.5 text-xs py-1.5 px-2.5"
                          aria-label={`Tandai ${e.name} sebagai dibayar`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                          Bayar
                        </button>
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
        </>
      )}
    </div>
  );
}