"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { buildUpcoming, monthlyAmount, resolveNotifyDays } from "@/lib/recurring";
import { formatDate, formatIDR, formatIDRMonthly } from "@/lib/format";
import { categoryIdentity } from "@/lib/categories";
import { CategoryIcon, CATEGORY_SOLID } from "@/components/CategoryIcon";

export default function DashboardPage() {
  const { expenses, categories, settings } = useStore();
  const today = new Date();

  const active = expenses.filter((e) => e.status === "active");
  const total = active.reduce(
    (sum, e) => sum + monthlyAmount(e.amount, e.interval),
    0,
  );

  const categoryName = (id: string | null) =>
    categories.find((c) => c.id === id)?.name ?? "Tanpa kategori";

  const byCategory = new Map<string, number>();
  for (const e of active) {
    const key = e.category_id ?? "__none__";
    byCategory.set(
      key,
      (byCategory.get(key) ?? 0) + monthlyAmount(e.amount, e.interval),
    );
  }
  const breakdown = [...byCategory.entries()]
    .map(([key, value]) => ({
      key,
      name: key === "__none__" ? "Tanpa kategori" : categoryName(key),
      value,
      pct: total > 0 ? (value / total) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);

  const upcoming = buildUpcoming(expenses, today, (e) =>
    resolveNotifyDays(e, settings),
  );

  const notifyItems = upcoming.filter((u) => u.overdue || u.dueSoon);
  const showBanner = settings.in_app_enabled && notifyItems.length > 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {showBanner && (
        <div className="mb-6 rounded-xl border border-accent-200 bg-accent-50 px-4 py-3">
          <p className="text-sm font-semibold text-accent-800">
            {notifyItems.length} biaya mendekati jatuh tempo:
          </p>
          <ul className="mt-1 list-inside list-disc text-sm text-accent-800">
            {notifyItems.map(({ expense: e, effectiveDate }) => (
              <li key={e.id}>
                {e.name} · {formatDate(effectiveDate)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-ink-slate">Dashboard</h1>
        <Link
          href="/expenses/new"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Tambah biaya
        </Link>
      </div>

      {active.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-16 text-center">
          <p className="text-base font-medium text-ink-slate">
            Belum ada biaya berulang
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
            Tambahkan langganan dan tagihan rutin Anda untuk mulai melihat ke
            mana uang Anda pergi.
          </p>
          <Link
            href="/expenses/new"
            className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Tambah biaya pertama
          </Link>
        </div>
      ) : (
        <>
          <section className="rounded-xl border border-primary-100 bg-primary-50 p-6">
            <p className="text-sm font-medium text-primary-700">
              Total biaya bulanan
            </p>
            <p className="mt-1 text-4xl font-bold tabular-nums text-ink-slate">
              {formatIDRMonthly(total)}
            </p>
            <p className="mt-2 text-xs text-primary-700">
              {active.length} biaya berlangganan aktif
            </p>
          </section>

          <section className="mt-8">
            <h2 className="mb-3 text-base font-semibold text-ink-slate">
              Rincian per kategori
            </h2>
            <ul className="space-y-3">
              {breakdown.map((b) => (
                <li key={b.key} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <CategoryIcon name={b.name} size={32} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-sm font-medium text-ink-slate">
                          {b.name}
                        </p>
                        <p className="text-sm font-semibold tabular-nums text-ink-slate">
                          {formatIDRMonthly(b.value)}
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
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="mb-3 text-base font-semibold text-ink-slate">
              Jatuh tempo
            </h2>
            {upcoming.length === 0 ? (
              <p className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
                Tidak ada tagihan yang akan datang.
              </p>
            ) : (
              <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
                {upcoming.map(({ expense: e, effectiveDate, overdue, dueSoon }) => (
                  <li key={e.id} className="flex items-center gap-3 px-4 py-3">
                    <CategoryIcon name={categoryName(e.category_id)} size={32} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/expenses/${e.id}/edit`}
                          className="truncate text-sm font-medium text-ink-slate hover:text-primary-600"
                        >
                          {e.name}
                        </Link>
                        {overdue && (
                          <span className="rounded-full bg-accent-100 px-2 py-0.5 text-xs font-semibold text-accent-800">
                            Terlewat · dimajukan
                          </span>
                        )}
                        {!overdue && dueSoon && (
                          <span className="rounded-full bg-accent-100 px-2 py-0.5 text-xs font-semibold text-accent-800">
                            Sebentar lagi
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {formatDate(effectiveDate)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold tabular-nums text-ink-slate">
                      {formatIDR(e.amount)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}