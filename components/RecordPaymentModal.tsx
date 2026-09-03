"use client";

import { useState, useEffect } from "react";
import { X, DollarSign, Calendar } from "lucide-react";
import { useStore } from "@/components/StoreProvider";
import type { Expense } from "@/lib/types";
import { toast } from "react-hot-toast";
import { SUPPORTED_CURRENCIES, CURRENCY_LABELS, type Currency } from "@/lib/currencies";
import { parseISO } from "@/lib/format";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 id="modal-title" className="text-lg font-semibold text-ink-slate">
            Catat Pembayaran
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-full p-1"
            aria-label="Tutup modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-slate-500">
          Mencatat pembayaran untuk <strong>{expense.name}</strong>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="payment-amount" className="mb-1.5 block text-sm font-medium text-ink-slate">
              Jumlah <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden />
              <input
                id="payment-amount"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
                className="ds-input pl-9 pr-3 py-2 tabular-nums"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="payment-currency" className="mb-1.5 block text-sm font-medium text-ink-slate">
              Mata Uang
            </label>
            <select
              id="payment-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="ds-input"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {CURRENCY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="payment-date" className="mb-1.5 block text-sm font-medium text-ink-slate">
              Tanggal Bayar <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden />
              <input
                id="payment-date"
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
                className="ds-input pl-9 pr-3 py-2 tabular-nums"
                required
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">Tidak boleh di masa depan</p>
          </div>

          <div>
            <label htmlFor="payment-note" className="mb-1.5 block text-sm font-medium text-ink-slate">
              Catatan (opsional)
            </label>
            <textarea
              id="payment-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="ds-input resize-none"
              placeholder="Catatan tambahan..."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
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