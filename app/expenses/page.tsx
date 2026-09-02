"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Download, Pencil, Plus, Search, Trash2, X, Pause, Play, CheckCircle2, Upload, FileText, ChevronDown, ChevronUp, AlertCircle, CheckCircle } from "lucide-react";
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
import { parseCSV, validateRows, CSV_TEMPLATE, importExpenses, type ParsedRow, type ImportError } from "@/lib/import-csv";
import { ensureCategory } from "@/lib/categories";

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
  const { expenses, categories, settings, deleteExpense, updateExpense, advanceOverdueExpense: storeAdvanceOverdue, addCategory, addExpense } = useStore();
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

  // CSV Import state
  const [importOpen, setImportOpen] = useState(true);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [validationResult, setValidationResult] = useState<{ valid: any[]; errors: ImportError[] } | null>(null);
  const [importLoading, setImportLoading] = useState(false);

  function handleFileSelect(file: File) {
    if (!file.name.endsWith(".csv")) {
      toast.error("File harus berformat .csv");
      return;
    }
    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCSV(text);
      setParsedRows(rows);
      const result = validateRows(rows, categories);
      setValidationResult(result);
    };
    reader.readAsText(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }

  function handleImport() {
    if (!validationResult || validationResult.valid.length === 0) {
      toast.error("Tidak ada baris valid untuk diimpor");
      return;
    }
    setImportLoading(true);
    (async () => {
      try {
        // First, create any new categories
        const newCategoryNames = new Set<string>();
        for (const row of validationResult.valid) {
          if (row.category_id === null && parsedRows.find(r => r.name === row.name)?.category) {
            const catName = parsedRows.find(r => r.name === row.name)?.category;
            if (catName && !categories.find(c => c.name.toLowerCase() === catName.toLowerCase())) {
              newCategoryNames.add(catName);
            }
          }
        }
        for (const catName of newCategoryNames) {
          await ensureCategory({ categories, addCategory } as any, catName);
        }

        // Now import expenses
        const result = await importExpenses(validationResult.valid, {
          addExpense,
          addCategory,
          expenses,
        });
        toast.success(`Berhasil import ${result.imported}, dilewati ${result.skipped} baris error`);
        setCsvFile(null);
        setParsedRows([]);
        setValidationResult(null);
        setImportOpen(false);
      } catch (err) {
        console.error("Import failed:", err);
        toast.error("Gagal mengimpor data");
      } finally {
        setImportLoading(false);
      }
    })();
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "template-import-biaya.csv";
    link.click();
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

      {/* CSV Import Section */}
      <Card className="mb-6">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h3 className="flex items-center gap-2 text-base font-medium text-ink-slate">
            <FileText className="h-5 w-5 text-primary-600" aria-hidden />
            Import CSV
          </h3>
          <button
            type="button"
            onClick={() => setImportOpen(!importOpen)}
            className="text-slate-500 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-full p-1"
            aria-label={importOpen ? "Tutup import" : "Buka import"}
            aria-expanded={importOpen}
          >
            {importOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </div>

        {importOpen && (
          <div className="p-4 space-y-4">
            {!csvFile ? (
              <div
                className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-primary-400 hover:bg-primary-50 transition-colors"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <Upload className="h-12 w-12 mx-auto text-slate-400 mb-3" aria-hidden />
                <p className="text-sm font-medium text-ink-slate">Seret file CSV ke sini atau klik untuk pilih</p>
                <p className="text-xs text-slate-500 mt-1">Format: .csv (maksimal 1MB)</p>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  id="csv-file-input"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById("csv-file-input")?.click()}
                  className="ds-btn-primary mt-4 inline-flex items-center gap-1.5"
                >
                  <FileText className="h-4 w-4" aria-hidden />
                  Pilih File
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-ink-slate">
                    {csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setCsvFile(null);
                      setParsedRows([]);
                      setValidationResult(null);
                    }}
                    className="text-slate-500 hover:text-slate-700 text-sm"
                  >
                    Hapus file
                  </button>
                </div>

                {validationResult && (
                  <>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                        <CheckCircle className="h-3.5 w-3.5" aria-hidden />
                        {validationResult.valid.length} baris valid
                      </span>
                      {validationResult.errors.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-700">
                          <AlertCircle className="h-3.5 w-3.5" aria-hidden />
                          {validationResult.errors.length} baris error
                        </span>
                      )}
                    </div>

                    <div className="max-h-64 overflow-auto rounded-lg border border-slate-200">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50">
                            <th className="px-3 py-2 text-left font-medium text-slate-600">Nama</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-600">Nominal</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-600">Interval</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-600">Kategori</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-600">Status</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-600">Tanggal</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-600">Mata Uang</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-600">Validasi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {parsedRows.map((row, index) => {
                            const error = validationResult.errors.find((e) => e.rowIndex === index + 2);
                            const isValid = !error;
                            return (
                              <tr key={index} className={isValid ? "" : "bg-rose-50"}>
                                <td className="px-3 py-2 truncate max-w-[150px]">{row.name}</td>
                                <td className="px-3 py-2 tabular-nums">{row.amount}</td>
                                <td className="px-3 py-2">{row.interval}</td>
                                <td className="px-3 py-2">{row.category || "—"}</td>
                                <td className="px-3 py-2">{row.status || "active"}</td>
                                <td className="px-3 py-2">{row.next_billing_date}</td>
                                <td className="px-3 py-2">{row.currency || "IDR"}</td>
                                <td className="px-3 py-2">
                                  {isValid ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px]">
                                      <CheckCircle className="h-3 w-3" aria-hidden />
                                      Valid
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[11px]" title={error?.message}>
                                      <AlertCircle className="h-3 w-3" aria-hidden />
                                      Error
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={downloadTemplate}
                        className="ds-btn-secondary inline-flex items-center gap-1.5 text-xs"
                      >
                        <FileText className="h-4 w-4" aria-hidden />
                        Unduh Template CSV
                      </button>
                      <button
                        type="button"
                        onClick={handleImport}
                        disabled={importLoading || !validationResult?.valid.length}
                        className="ds-btn-primary inline-flex items-center gap-1.5"
                      >
                        {importLoading ? (
                          <>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                            Mengimpor...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4" aria-hidden />
                            Import {validationResult.valid.length} Baris Valid
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </Card>

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