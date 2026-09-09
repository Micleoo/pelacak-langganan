"use client";

import { useState, useEffect } from "react";
import { X, DollarSign, Calendar } from "lucide-react";
import { useStore } from "@/components/StoreProvider";
import type { Expense } from "@/lib/types";
import { toast } from "react-hot-toast";
import { SUPPORTED_CURRENCIES, CURRENCY_LABELS, type Currency } from "@/lib/currencies";
import { parseISO } from "@/lib/format";
import { Field, InputWithAdornment, Select, Textarea } from "@/components/ui/Input";

interface RecordPaymentModalProps {
  expense: Expense;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RecordPaymentModal({ expense, isOpen, onClose, onSuccess }: RecordPaymentModalProps) {
  const { settlePayment } = useStore();
  const [amount, setAmount] = useState(expense.amount);
  const [currency, setCurrency] = useState<Currency>(expense.currency);
  const [paidAt, setPaidAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when expense changes
  useEffect(() => {
    setAmount(expense.amount);
    setCurrency(expense.currency);
    setPaidAt(new Date().toISOString().slice(0, 10));
    setNote("");
  }, [expense]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      toast.error("Jumlah harus lebih dari 0");
      return;
    }

    setIsSubmitting(true);
    try {
      await settlePayment(expense.id, amount, currency, parseISO(paidAt));
      toast.success("Pembayaran dicatat.");
      onSuccess();
      onClose();
    } catch {
      toast.error("Gagal mencatat pembayaran.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="w-full max-w-md rounded-t-xl border border-slate-200 bg-white p-5 sm:rounded-xl sm:p-6">
        <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 id="modal-title" className="text-lg font-semibold text-ink-slate">
            Catat Pembayaran
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
            aria-label="Tutup modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-slate-500">
          Mencatat pembayaran untuk <strong>{expense.name}</strong>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Jumlah" htmlFor="payment-amount" required>
            <InputWithAdornment id="payment-amount" type="number" min="1" step="1" inputMode="numeric" value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} className="tabular-nums" leadingAdornment={<DollarSign className="h-4 w-4" />} required />
          </Field>

          <Field label="Mata Uang" htmlFor="payment-currency">
            <Select
              id="payment-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {CURRENCY_LABELS[c]}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Tanggal Bayar" htmlFor="payment-date" required helperText="Tidak boleh di masa depan">
            <InputWithAdornment id="payment-date" type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} max={new Date().toISOString().slice(0, 10)} className="tabular-nums" leadingAdornment={<Calendar className="h-4 w-4" />} required />
          </Field>

          <Field label="Catatan (opsional)" htmlFor="payment-note">
            <Textarea
              id="payment-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="resize-none"
              placeholder="Catatan tambahan..."
            />
          </Field>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="ds-btn-secondary px-4 py-2"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="ds-btn-primary px-4 py-2"
            >
              {isSubmitting ? "Mencatat..." : "Catat Pembayaran"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
