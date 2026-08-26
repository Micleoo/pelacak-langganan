"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useStore } from "@/components/StoreProvider";
import { buildUpcoming, monthlyAmount, resolveNotifyDays } from "@/lib/recurring";
import { formatDate, formatIDR, formatIDRMonthly } from "@/lib/format";
import { categoryIdentity } from "@/lib/categories";
import { CategoryIcon, CATEGORY_SOLID } from "@/components/CategoryIcon";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { toast } from "react-hot-toast";
import { NO_CATEGORY_LABEL, NONE_CATEGORY_KEY } from "@/lib/constants";

export default function DashboardPage() {
  const { expenses, categories, settings } = useStore();
  const today = new Date();

  const active = expenses.filter((e) => e.status === "active");
  const total = active.reduce(
    (sum, e) => sum + monthlyAmount(e.amount, e.interval),
    0,
  );

  const categoryName = (id: string | null) =>
    categories.find((c) => c.id === id)?.name ?? NO_CATEGORY_LABEL;

  const byCategory = new Map<string, number>();
  for (const e of active) {
    const key = e.category_id ?? NONE_CATEGORY_KEY;
    byCategory.set(
      key,
      (byCategory.get(key) ?? 0) + monthlyAmount(e.amount, e.interval),
    );
  }
  const breakdown = [...byCategory.entries()]
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
        <h1 className="text-3xl font-semibold text-ink-slate">Dashboard</h1>
        <Link
          href="/expenses/new"
          className="ds-btn-primary inline-flex shrink-0 items-center gap-1.5"
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
            className="ds-btn-primary mt-5 inline-flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Tambah biaya pertama
          </Link>
        </div>
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
              <p className="mt-1 text-5xl font-bold tabular-nums text-ink-slate">
                {formatIDRMonthly(total)}
              </p>
              <p className="mt-2 text-xs text-primary-700">
                {active.length} biaya berlangganan aktif
              </p>
            </div>
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
              <Card className="p-0 overflow-hidden">
                <ul className="divide-y divide-slate-200">
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
                            <Badge>Terlewat · dimajukan</Badge>
                          )}
                          {!overdue && dueSoon && (
                            <Badge>Sebentar lagi</Badge>
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
              </Card>
            )}
          </section>

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