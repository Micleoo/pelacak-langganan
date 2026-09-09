"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/components/StoreProvider";
import { monthlyAmount, monthlyAmountInBaseCurrency } from "@/lib/recurring";
import { formatAmountMonthly, formatIntervalFormula } from "@/lib/format";
import type { Expense, Interval, Status } from "@/lib/types";
import { type Currency, SUPPORTED_CURRENCIES, CURRENCY_LABELS } from "@/lib/currencies";
import { Button } from "./ui/Button";
import { toast } from "react-hot-toast";
import { ensureCategory, suggestCategoryName } from "@/lib/categories";
import { NEW_CATEGORY_KEY, NO_CATEGORY_LABEL } from "@/lib/constants";
import { InvoiceScannerModal } from "./InvoiceScannerModal";
import { Sparkles } from "lucide-react";
import type { ParsedInvoice } from "@/lib/invoice-parser";
import { Field, Input, Select } from "./ui/Input";

const INTERVALS: { value: Interval; label: string }[] = [
  { value: "monthly", label: "Bulanan" },
  { value: "yearly", label: "Tahunan" },
  { value: "quarterly", label: "Kuartal" },
  { value: "weekly", label: "Mingguan" },
];

const REMINDER_DAYS = [1, 2, 3, 4, 5, 6, 7];

const STATUSES_CREATE: { value: Status; label: string }[] = [
  { value: "active", label: "Aktif" },
  { value: "paused", label: "Dijeda" },
  { value: "cancelled", label: "Dibatalkan" },
];

const STATUSES_EDIT: { value: Status; label: string }[] = [
  { value: "active", label: "Aktif" },
  { value: "paused", label: "Dijeda" },
  { value: "overdue", label: "Terlewat" },
  { value: "cancelled", label: "Dibatalkan" },
];

function todayISO(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export function ExpenseForm({ expenseId }: { expenseId?: string }) {
  const router = useRouter();
  const {
    categories,
    expenses,
    settings,
    addCategory,
    addExpense,
    updateExpense,
    deleteExpense,
  } = useStore();

  const existing = expenseId
    ? expenses.find((e) => e.id === expenseId)
    : undefined;

  const baseCurrency = settings?.base_currency ?? "IDR";

  const [name, setName] = useState(existing?.name ?? "");
  const [amount, setAmount] = useState(
    existing ? String(existing.amount) : "",
  );
  const [interval, setInterval] = useState<Interval>(
    existing?.interval ?? "monthly",
  );
  const [categoryId, setCategoryId] = useState<string>(
    existing?.category_id ?? "",
  );
  const [status, setStatus] = useState<Status>(existing?.status ?? "active");
  const [currency, setCurrency] = useState<Currency>((existing?.currency as Currency) ?? (baseCurrency as Currency));
  const [nextBillingDate, setNextBillingDate] = useState(
    existing?.next_billing_date ?? todayISO(),
  );
  const [notifyDaysBefore, setNotifyDaysBefore] = useState<number | "">(
    existing?.notify_days_before ?? "",
  );
  const [newCategoryName, setNewCategoryName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [categorySuggested, setCategorySuggested] = useState(false);

  function applySuggestedCategory(expenseName: string) {
    const suggested = suggestCategoryName(expenseName);
    if (!suggested) return;
    const matched = categories.find((category) => category.name.toLowerCase() === suggested.toLowerCase());
    setCategoryId(matched?.id ?? NEW_CATEGORY_KEY);
    setNewCategoryName(matched ? "" : suggested);
    setCategorySuggested(true);
  }

  function handleApplyInvoice(inv: ParsedInvoice) {
    setName(inv.name);
    setAmount(String(inv.amount));
    setCurrency(inv.currency);
    setInterval(inv.interval);
    setNextBillingDate(inv.next_billing_date);
    const suggestedCategory = inv.suggested_category ?? suggestCategoryName(inv.name);
    if (suggestedCategory) {
      const matched = categories.find(
        (c) => c.name.toLowerCase() === suggestedCategory.toLowerCase()
      );
      if (matched) {
        setCategoryId(matched.id);
      } else {
        setCategoryId(NEW_CATEGORY_KEY);
        setNewCategoryName(suggestedCategory);
      }
      setCategorySuggested(true);
    }
    toast.success(`Data dari ${inv.name} berhasil diterapkan ke form!`);
  }

  const creatingNewCategory = categoryId === NEW_CATEGORY_KEY;
  const isEditMode = !!existing;
  const numAmount = Number(amount) || 0;
  const monthly = monthlyAmount(numAmount, interval);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Nama biaya wajib diisi.";
    const parsed = Number(amount);
    if (amount === "" || Number.isNaN(parsed)) {
      next.amount = "Nominal wajib diisi angka.";
    } else if (parsed < 0) {
      next.amount = "Nominal tidak boleh negatif.";
    }
    if (!nextBillingDate) next.date = "Tanggal tagihan berikutnya wajib diisi.";
    if (creatingNewCategory && !newCategoryName.trim()) {
      next.category = "Nama kategori baru wajib diisi.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function clearError(field: string) {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);

    (async () => {
      let finalCategoryId: string | null =
        categoryId === NEW_CATEGORY_KEY || categoryId === "" ? null : categoryId;
      if (creatingNewCategory && newCategoryName.trim()) {
        try {
          finalCategoryId = await ensureCategory(
            { categories, addCategory } as any,
            newCategoryName.trim()
          );
        } catch {
          toast.error("Gagal menyimpan kategori baru.");
          setIsSubmitting(false);
          return;
        }
      }

      const numVal = Number(amount);
      const input = {
        name: name.trim(),
        amount: currency === "IDR" ? Math.round(numVal) : Number(numVal.toFixed(2)),
        interval,
        category_id: finalCategoryId,
        status,
        currency,
        next_billing_date: nextBillingDate,
        notify_days_before: notifyDaysBefore === "" ? null : notifyDaysBefore,
        last_paid_date: existing?.last_paid_date ?? null,
      };

      try {
        if (existing) {
          await updateExpense(existing.id, input);
          toast.success("Biaya diperbarui.");
        } else {
          await addExpense(input);
          toast.success("Biaya ditambahkan.");
        }
      } catch (err: any) {
        console.error("Gagal menyimpan biaya:", err);
        const errMsg = err?.message || err?.details || "Gagal menyimpan biaya. Coba lagi.";
        toast.error(errMsg);
        setIsSubmitting(false);
        return;
      }
      router.push("/expenses");
    })();
  }

  async function handleDelete() {
    if (!existing) return;
    setIsDeleting(true);
    try {
      await deleteExpense(existing.id);
      toast.success("Biaya dihapus.");
      router.push("/expenses");
    } catch {
      toast.error("Gagal menghapus biaya.");
      setConfirmDelete(false);
    } finally {
      setIsDeleting(false);
    }
  }

  const statusOptions = isEditMode ? STATUSES_EDIT : STATUSES_CREATE;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mx-auto max-w-3xl px-4 py-8 sm:px-6"
    >
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-ink-slate">
          {existing ? "Edit Biaya" : "Tambah Biaya"}
        </h1>
        <Button
          kind="secondary"
          type="button"
          onClick={() => router.back()}
        >
          Batal
        </Button>
      </div>

      {!existing && (
        <div className="mb-6 flex flex-col items-start justify-between gap-3 rounded-lg border border-primary-200 bg-primary-50 p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary-100 text-primary-700">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink-slate">Punya Email Tagihan?</h3>
              <p className="text-xs text-slate-500">Scan teks email tagihan (Netflix, Spotify, ChatGPT) untuk mengisi form ini secara otomatis.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            className="ds-btn-secondary shrink-0 text-xs font-semibold py-2 px-3 flex items-center gap-1.5 hover:bg-primary-50"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary-600" />
            Scan Tagihan
          </button>
        </div>
      )}

      <InvoiceScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onApplyToForm={handleApplyInvoice}
      />

      <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <Field label="Nama biaya" htmlFor="name" required error={errors.name}>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => {
              const value = e.target.value;
              setName(value);
              if (!existing && (categoryId === "" || categorySuggested)) applySuggestedCategory(value);
              clearError("name");
            }}
            placeholder="Netflix"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={`Nominal (${currency})`} htmlFor="amount" required error={errors.amount}>
            <Input
              id="amount"
              type="number"
              min="0"
              step={currency === "IDR" ? "1" : "0.01"}
              inputMode={currency === "IDR" ? "numeric" : "decimal"}
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                clearError("amount");
              }}
              placeholder={currency === "IDR" ? "149000" : "9.99"}
              className="tabular-nums"
            />
          </Field>

          <Field label="Mata Uang" htmlFor="currency">
            <Select
              id="currency"
              value={currency}
              onChange={(e) => {
                setCurrency(e.target.value as Currency);
                clearError("currency");
              }}
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {CURRENCY_LABELS[c]}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Siklus tagihan" htmlFor="interval">
            <Select
              id="interval"
              value={interval}
              onChange={(e) => {
                setInterval(e.target.value as Interval);
                clearError("interval");
              }}
            >
              {INTERVALS.map((i) => (
                <option key={i.value} value={i.value}>
                  {i.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Kategori" htmlFor="category" error={errors.category} helperText={categorySuggested ? "Disarankan otomatis berdasarkan nama layanan — tetap bisa Anda ubah." : undefined}>
            <Select
              id="category"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setCategorySuggested(false);
                clearError("category");
              }}
              aria-invalid={!!errors.category}
            >
              <option value="">{NO_CATEGORY_LABEL}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              <option value={NEW_CATEGORY_KEY}>+ Buat kategori baru…</option>
            </Select>
            {creatingNewCategory && (
              <Input
                type="text"
                autoFocus
                value={newCategoryName}
                onChange={(e) => {
                  setNewCategoryName(e.target.value);
                  clearError("category");
                }}
                placeholder="Nama kategori baru"
                className="mt-2"
                aria-invalid={!!errors.category}
              />
            )}
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Status" htmlFor="status" helperText={!isEditMode ? "Status Terlewat hanya tersedia saat mengedit biaya yang sudah jatuh tempo." : undefined}>
            <Select
              id="status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as Status);
                clearError("status");
              }}
            >
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value} disabled={!isEditMode && s.value === "overdue"}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Tanggal tagihan berikutnya" htmlFor="nextBillingDate" required error={errors.date}>
            <Input
              id="nextBillingDate"
              type="date"
              value={nextBillingDate}
              onChange={(e) => {
                setNextBillingDate(e.target.value);
                clearError("date");
              }}
              className="tabular-nums"
            />
          </Field>
        </div>

        <Field label="Pengingat khusus" htmlFor="notify-days" helperText="Kosongkan untuk memakai timing global dari Pengaturan.">
          <Select
            id="notify-days"
            value={notifyDaysBefore}
            onChange={(e) => setNotifyDaysBefore(e.target.value === "" ? "" : Number(e.target.value))}
          >
            <option value="">Pakai timing global</option>
            {REMINDER_DAYS.map((day) => <option key={day} value={day}>H-{day} ({day} hari sebelum)</option>)}
          </Select>
        </Field>

        <div className="rounded-xl border border-primary-100 bg-primary-50/80 p-4 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-700">
              Biaya bulanan (Normalisasi)
            </p>
            {numAmount > 0 && interval !== "monthly" && (
              <span className="text-[11px] font-medium text-primary-700 bg-primary-100/70 px-2 py-0.5 rounded-md">
                {interval === "yearly" ? "Tahunan ÷ 12" : interval === "quarterly" ? "Kuartal ÷ 3" : "Mingguan × 52 ÷ 12"}
              </span>
            )}
          </div>
          <p className="text-2xl font-bold tabular-nums text-ink-slate">
            {formatAmountMonthly(monthly, currency as Currency)}
          </p>
          {currency !== baseCurrency && (
            <p className="text-xs text-slate-500">
              ~{formatAmountMonthly(monthlyAmountInBaseCurrency({ amount: numAmount, interval, currency }, baseCurrency as Currency), baseCurrency as Currency)} (dikonversi ke {baseCurrency})
            </p>
          )}
          <p className="text-xs text-primary-700/90 pt-0.5">
            {interval === "monthly"
              ? "Dihitung tetap per bulan."
              : numAmount > 0
              ? `Rumus: ${formatIntervalFormula(numAmount, interval, currency as Currency)}`
              : "Masukkan nominal untuk melihat rincian normalisasi."}
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        {existing ? (
          <div>
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <Button
                  kind="secondary"
                  type="button"
                  onClick={handleDelete}
                  loading={isDeleting}
                >
                  Yakin hapus?
                </Button>
                <Button
                  kind="secondary"
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                >
                  Batal
                </Button>
              </div>
            ) : (
              <Button
                kind="secondary"
                type="button"
                onClick={() => setConfirmDelete(true)}
              >
                Hapus
              </Button>
            )}
          </div>
        ) : (
          <span />
        )}
        <Button
          kind="primary"
          type="submit"
          loading={isSubmitting}
        >
          Simpan
        </Button>
      </div>
    </form>
  );
}
