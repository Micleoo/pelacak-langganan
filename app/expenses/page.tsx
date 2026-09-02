"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, Pencil, Plus, Search, Trash2, X, Pause, Play, CheckCircle2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { monthlyAmount, advanceOverdueExpense, monthlyAmountInBaseCurrency } from "@/lib/recurring";
import { formatDate, formatRelativeDue, formatAmount, formatAmountMonthly } from "@/lib/format";
import { exportExpensesToCSV } from "@/lib/export-csv";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/StatusBadge";
import type { Interval, Status } from "@/lib/types";
import { toast } from "react-hot-toast";
import { NO_CATEGORY_LABEL, NONE_CATEGORY_KEY } from "@/lib/constants";
import type { Currency } from "@/lib/currencies";

const INTERVAL_LABEL: Record<Interval, string> = {
  monthly: "Bulanan",
  yearly: "Tahunan",
  quarterly: "Kuartal",
  weekly: "Mingguan",
};

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Semua" },
  { value: "active", label: "Aktif" },
  { value: "paused", label: "Dijeda" },
  { value: "overdue", label: "Terlewat" },
  { value: "cancelled", label: "Dibatalkan" },
];

export default function ExpensesPage() {
  const { expenses, categories, settings, deleteExpense, updateExpense, advanceOverdueExpense: storeAdvanceOverdue } = useStore();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const baseCurrency = (settings?.base_currency as Currency) ?? "IDR";

  const categoryName = (id: string | null) =>
    categories.find((c) => c.id === id)?.name ?? NO_CATEGORY_LABEL;

  const filtered = expenses.filter((e) => {
    const matchesQuery = e.name.toLowerCase().includes(query.toLowerCase());
    const matchesCategory =
      categoryFilter === "" ||
      e.category_id === categoryFilter ||
      (categoryFilter === NONE_CATEGORY_KEY && e.category_id === null);
    const matchesStatus = statusFilter === "" || e.status === statusFilter;
    return matchesQuery && matchesCategory && matchesStatus;
  });

  function handleExportCSV() {
    if (expenses.length === 0) {
      toast.error("Belum ada data biaya untuk diekspor.");
      return;
    }
    exportExpensesToCSV(expenses, categories);
    toast.success("File CSV berhasil diunduh.");
  }

  async function handlePause(e: typeof expenses[0]) {
    try {
      await updateExpense(e.id, { ...e, status: "paused" });
      toast.success(`${e.name} dijeda.`);
    } catch {
      toast.error("Gagal mengupdate status. Coba lagi.");
    }
  }

  async function handleResume(e: typeof expenses[0]) {
    try {
      await updateExpense(e.id, { ...e, status: "active" });
      toast.success(`${e.name} diaktifkan kembali.`);
    } catch {
      toast.error("Gagal mengupdate status. Coba lagi.");
    }
  }

  async function handleMarkAsPaid(e: typeof expenses[0]) {
    try {
      const today = new Date();
      const advanced = advanceOverdueExpense(e, today);
      await storeAdvanceOverdue(e.id, advanced.next_billing_date, advanced.last_paid_date!);
      toast.success(`${e.name} ditandai dibayar. Tanggal tagihan dimajukan.`);
    } catch {
      toast.error("Gagal mengupdate biaya. Coba lagi.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-ink-slate">Daftar Biaya</h1>
          <p className="mt-1 text-sm text-slate-500">
            Semua biaya berulang dalam satu tempat.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {expenses.length > 0 && (
            <button
              type="button"
              onClick={handleExportCSV}
              className="ds-btn-secondary inline-flex items-center gap-1.5 text-xs py-2 px-3"
            >
              <Download className="h-4 w-4" aria-hidden />
              Ekspor CSV
            </button>
          )}
          <Link
            href="/expenses/new"
            className="ds-btn-primary inline-flex shrink-0 items-center gap-1.5"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Tambah biaya
          </Link>
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <label htmlFor="search" className="sr-only">
            Cari biaya
          </label>
          <input
            id="search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari berdasarkan nama…"
            className="ds-input w-full py-2 pl-9 pr-3"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="ds-input px-3 py-2"
          aria-label="Filter kategori"
        >
          <option value="">Semua kategori</option>
          <option value={NONE_CATEGORY_KEY}>{NO_CATEGORY_LABEL}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="ds-input px-3 py-2"
          aria-label="Filter status"
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-12 text-center">
          <p className="text-sm font-medium text-ink-slate">Belum ada biaya berulang</p>
          <p className="mt-1 text-sm text-slate-500">
            {expenses.length === 0
              ? "Tambahkan biaya berulang pertama Anda."
              : "Tidak ada biaya yang cocok dengan pencarian/filter."}
          </p>
          {expenses.length === 0 && (
            <Link
              href="/expenses/new"
              className="ds-btn-primary mt-4 inline-flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Tambah biaya
            </Link>
          )}
        </div>
      ) : (
        <Card className="p-0 overflow-hidden">
          <ul className="divide-y divide-slate-200">
          {filtered.map((e) => {
            const isOverdue = e.status === "overdue";
            const isPaused = e.status === "paused";
            const isActive = e.status === "active";
            const isCancelled = e.status === "cancelled";

            const monthlyConverted = monthlyAmountInBaseCurrency(e, baseCurrency);

            return (
              <li key={e.id} className="flex items-center gap-3 px-4 py-3">
                <CategoryIcon name={categoryName(e.category_id)} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/expenses/${e.id}/edit`}
                      className="truncate text-sm font-medium text-ink-slate hover:text-primary-600"
                    >
                      {e.name}
                    </Link>
                    <StatusBadge status={e.status as Status} />
                  </div>
                  <p className="text-xs text-slate-500">
                    {formatAmount(e.amount, e.currency as Currency)} · {INTERVAL_LABEL[e.interval]} ·{" "}
                    {formatDate(e.next_billing_date)}{" "}
                    <span className="text-[11px] font-medium text-slate-400">
                      ({formatRelativeDue(e.next_billing_date).label})
                    </span>
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-semibold tabular-nums text-ink-slate">
                    {formatAmountMonthly(monthlyConverted, baseCurrency)}
                  </p>
                  {e.currency !== baseCurrency && (
                    <p className="text-xs text-slate-500">
                      ({formatAmountMonthly(monthlyAmount(e.amount, e.interval), e.currency as Currency)})
                    </p>
                  )}
                  <p className="text-xs text-slate-500">{categoryName(e.category_id)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/expenses/${e.id}/edit`}
                    aria-label={`Edit ${e.name}`}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-ink-slate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  {isActive && (
                    <button
                      type="button"
                      onClick={() => handlePause(e)}
                      aria-label={`Jeda ${e.name}`}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-amber-50 hover:text-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100"
                      title="Jeda"
                    >
                      <Pause className="h-4 w-4" />
                    </button>
                  )}
                  {isPaused && (
                    <button
                      type="button"
                      onClick={() => handleResume(e)}
                      aria-label={`Aktifkan ${e.name}`}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100"
                      title="Aktifkan"
                    >
                      <Play className="h-4 w-4" />
                    </button>
                  )}
                  {isOverdue && (
                    <button
                      type="button"
                      onClick={() => handleMarkAsPaid(e)}
                      aria-label={`Tandai ${e.name} sebagai dibayar`}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100"
                      title="Tandai dibayar"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                  )}
                  {confirmDeleteId === e.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await deleteExpense(e.id);
                            toast.success("Biaya dihapus.");
                            setConfirmDeleteId(null);
                          } catch {
                            toast.error("Gagal menghapus biaya.");
                          }
                        }}
                        className="ds-btn-secondary px-2 py-1 text-xs"
                      >
                        Yakin hapus?
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        aria-label="Batal hapus"
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(e.id)}
                      aria-label={`Hapus ${e.name}`}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        </Card>
      )}
    </div>
  );
}