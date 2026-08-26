"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { monthlyAmount } from "@/lib/recurring";
import { formatDate, formatIDR, formatIDRMonthly, formatRelativeDue } from "@/lib/format";
import { exportExpensesToCSV } from "@/lib/export-csv";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { Interval } from "@/lib/types";
import { toast } from "react-hot-toast";
import { NO_CATEGORY_LABEL, NONE_CATEGORY_KEY } from "@/lib/constants";

const INTERVAL_LABEL: Record<Interval, string> = {
  monthly: "Bulanan",
  yearly: "Tahunan",
  quarterly: "Kuartal",
  weekly: "Mingguan",
};

export default function ExpensesPage() {
  const { expenses, categories, deleteExpense } = useStore();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const categoryName = (id: string | null) =>
    categories.find((c) => c.id === id)?.name ?? NO_CATEGORY_LABEL;

  const filtered = expenses.filter((e) => {
    const matchesQuery = e.name.toLowerCase().includes(query.toLowerCase());
    const matchesCategory =
      categoryFilter === "" ||
      e.category_id === categoryFilter ||
      (categoryFilter === NONE_CATEGORY_KEY && e.category_id === null);
    return matchesQuery && matchesCategory;
  });

  function handleExportCSV() {
    if (expenses.length === 0) {
      toast.error("Belum ada data biaya untuk diekspor.");
      return;
    }
    exportExpensesToCSV(expenses, categories);
    toast.success("File CSV berhasil diunduh.");
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
          {filtered.map((e) => (
            <li key={e.id} className="flex items-center gap-3 px-4 py-3">
              <CategoryIcon name={categoryName(e.category_id)} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/expenses/${e.id}/edit`}
                    className="truncate text-sm font-medium text-ink-slate hover:text-primary-600"
                  >
                    {e.name}
                  </Link>
                  {e.status === "cancelled" && (
                    <Badge className="bg-slate-100 text-slate-500">Berhenti</Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {formatIDR(e.amount)} · {INTERVAL_LABEL[e.interval]} ·{" "}
                  {formatDate(e.next_billing_date)}{" "}
                  <span className="text-[11px] font-medium text-slate-400">
                    ({formatRelativeDue(e.next_billing_date).label})
                  </span>
                </p>
              </div>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold tabular-nums text-ink-slate">
                  {formatIDRMonthly(monthlyAmount(e.amount, e.interval))}
                </p>
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
          ))}
        </ul>
        </Card>
      )}
    </div>
  );
}