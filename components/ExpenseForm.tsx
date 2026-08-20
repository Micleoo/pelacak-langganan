"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { monthlyAmount } from "@/lib/recurring";
import { formatIDRMonthly } from "@/lib/format";
import type { Expense, Interval, Status } from "@/lib/types";
import { Button } from "./ui/Button";

const INTERVALS: { value: Interval; label: string }[] = [
  { value: "monthly", label: "Bulanan" },
  { value: "yearly", label: "Tahunan" },
  { value: "quarterly", label: "Kuartal" },
  { value: "weekly", label: "Mingguan" },
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
    addCategory,
    addExpense,
    updateExpense,
    deleteExpense,
  } = useStore();

  const existing = expenseId
    ? expenses.find((e) => e.id === expenseId)
    : undefined;

  const [name, setName] = useState(existing?.name ?? "");
  const [amount, setAmount] = useState(
    existing ? String(existing.amount) : "",
  );
  const [interval, setInterval] = useState<Interval>(
    existing?.interval ?? "monthly",
  );
  const [categoryId, setCategoryId] = useState<string>(
    existing?.category_id ?? categories[0]?.id ?? "",
  );
  const [status, setStatus] = useState<Status>(existing?.status ?? "active");
  const [nextBillingDate, setNextBillingDate] = useState(
    existing?.next_billing_date ?? todayISO(),
  );
  const [newCategoryName, setNewCategoryName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  const creatingNewCategory = categoryId === "__new__";
  const monthly = monthlyAmount(Number(amount) || 0, interval);

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    void (async () => {
      let finalCategoryId: string | null =
        categoryId === "__new__" || categoryId === "" ? null : categoryId;
      if (creatingNewCategory && newCategoryName.trim()) {
        try {
          finalCategoryId = (await addCategory({ name: newCategoryName.trim() }))
            .id;
        } catch {
          setErrors((prev) => ({
            ...prev,
            category: "Gagal menyimpan kategori baru.",
          }));
          return;
        }
      }

      const input = {
        name: name.trim(),
        amount: Math.round(Number(amount)),
        interval,
        category_id: finalCategoryId,
        status,
        next_billing_date: nextBillingDate,
        notify_days_before: existing?.notify_days_before ?? null,
      };

      try {
        if (existing) {
          await updateExpense(existing.id, input);
        } else {
          await addExpense(input);
        }
      } catch {
        setErrors((prev) => ({
          ...prev,
          category: "Gagal menyimpan biaya. Coba lagi.",
        }));
        return;
      }
      router.push("/expenses");
    })();
  }

  function handleDelete() {
    if (!existing) return;
    void deleteExpense(existing.id)
      .then(() => router.push("/expenses"))
      .catch(() => setConfirmDelete(false));
  }

  const inputClass = "ds-input w-full";

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

      <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-ink-slate">
            Nama biaya
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Netflix"
            className={inputClass}
            aria-invalid={!!errors.name}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-rose-600">{errors.name}</p>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="amount" className="mb-1.5 block text-sm font-medium text-ink-slate">
              Nominal (IDR)
            </label>
            <input
              id="amount"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="149000"
              className={`${inputClass} tabular-nums`}
              aria-invalid={!!errors.amount}
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-rose-600">{errors.amount}</p>
            )}
          </div>

          <div>
            <label htmlFor="interval" className="mb-1.5 block text-sm font-medium text-ink-slate">
              Siklus tagihan
            </label>
            <select
              id="interval"
              value={interval}
              onChange={(e) => setInterval(e.target.value as Interval)}
              className={inputClass}
            >
              {INTERVALS.map((i) => (
                <option key={i.value} value={i.value}>
                  {i.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="category" className="mb-1.5 block text-sm font-medium text-ink-slate">
            Kategori
          </label>
          <select
            id="category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={inputClass}
            aria-invalid={!!errors.category}
          >
            <option value="">Tanpa kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            <option value="__new__">+ Buat kategori baru…</option>
          </select>
          {creatingNewCategory && (
            <input
              type="text"
              autoFocus
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nama kategori baru"
              className={`${inputClass} mt-2`}
              aria-invalid={!!errors.category}
            />
          )}
          {errors.category && (
            <p className="mt-1 text-sm text-rose-600">{errors.category}</p>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="status" className="mb-1.5 block text-sm font-medium text-ink-slate">
              Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
              className={inputClass}
            >
              <option value="active">Active</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="nextBillingDate"
              className="mb-1.5 block text-sm font-medium text-ink-slate"
            >
              Tanggal tagihan berikutnya
            </label>
            <input
              id="nextBillingDate"
              type="date"
              value={nextBillingDate}
              onChange={(e) => setNextBillingDate(e.target.value)}
              className={`${inputClass} tabular-nums`}
              aria-invalid={!!errors.date}
            />
            {errors.date && (
              <p className="mt-1 text-sm text-rose-600">{errors.date}</p>
            )}
          </div>
        </div>

        <div className="rounded-lg bg-primary-50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-primary-700">
            Biaya bulanan
          </p>
          <p className="mt-0.5 text-xl font-semibold tabular-nums text-primary-800">
            {formatIDRMonthly(monthly)}
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
        >
          Simpan
        </Button>
      </div>
    </form>
  );
}