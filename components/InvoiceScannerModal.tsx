"use client";

import { useState } from "react";
import {
  X,
  Sparkles,
  Mail,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Check,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { parseInvoiceText, type ParsedInvoice } from "@/lib/invoice-parser";
import { useStore } from "@/components/StoreProvider";
import { SUPPORTED_CURRENCIES, CURRENCY_LABELS, type Currency } from "@/lib/currencies";
import type { Interval } from "@/lib/types";
import { ensureCategory, suggestCategoryName } from "@/lib/categories";
import { Field, FieldGroup, Input, Select, Textarea } from "@/components/ui/Input";

interface InvoiceScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyToForm?: (invoice: ParsedInvoice) => void;
  onSavedSuccessfully?: () => void;
}

const SAMPLE_TEMPLATES = [
  {
    label: "Netflix",
    text: `Dari: Netflix <info@account.netflix.com>
Subjek: Tagihan Anda dari Netflix

Halo Daniel,
Pembayaran keanggotaan bulanan Anda sebesar Rp 186.000 telah berhasil diproses.
Paket: Netflix Premium
Tanggal tagihan berikutnya: 28 September 2026.
Terima kasih telah menonton bersama kami.`,
  },
  {
    label: "Spotify",
    text: `Spotify AB - Tanda Terima Pembayaran

Terima kasih telah berlangganan Spotify Premium Individual.
Nominal tagihan: Rp 54.990 / bulan
Metode pembayaran: Kartu Kredit
Tanggal perpanjangan berikutnya: 15/10/2026.`,
  },
  {
    label: "ChatGPT Plus",
    text: `Receipt from OpenAI, LLC
Invoice #INV-2026-98765

Description: ChatGPT Plus Subscription
Amount paid: $20.00 USD
Renewal date: 2026-11-05
Thank you for subscribing to OpenAI.`,
  },
];

export function InvoiceScannerModal({
  isOpen,
  onClose,
  onApplyToForm,
  onSavedSuccessfully,
}: InvoiceScannerModalProps) {
  const store = useStore();
  const { addExpense, settings } = store;
  const [inputText, setInputText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [parsed, setParsed] = useState<ParsedInvoice | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  function handleScan(textToScan?: string) {
    const text = textToScan ?? inputText;
    if (!text.trim()) {
      toast.error("Silakan tempel teks email atau unggah file terlebih dahulu.");
      return;
    }

    const result = parseInvoiceText(text);
    if (!result) {
      toast.error("Gagal mendeteksi informasi tagihan. Pastikan teks berisi nama layanan, nominal, dan tanggal.");
      return;
    }

    setParsed(result);
    toast.success(`Berhasil mendeteksi tagihan ${result.name}!`);
  }

  function handleFileRead(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setInputText(content);
      handleScan(content);
    };
    reader.readAsText(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileRead(file);
    }
  }

  async function handleSaveDirectly() {
    if (!parsed) return;
    setIsSaving(true);
    try {
      let categoryId: string | null = null;
      const suggestedCategory = parsed.suggested_category ?? suggestCategoryName(parsed.name);
      if (suggestedCategory) {
        categoryId = await ensureCategory(store, suggestedCategory);
      }

      await addExpense({
        name: parsed.name,
        amount: parsed.amount,
        currency: parsed.currency,
        interval: parsed.interval,
        category_id: categoryId,
        status: "active",
        next_billing_date: parsed.next_billing_date,
        notify_days_before: settings?.default_notify_days_before ?? 3,
        last_paid_date: null,
      });

      toast.success(`${parsed.name} berhasil disimpan ke daftar biaya!`);
      onSavedSuccessfully?.();
      onClose();
    } catch {
      toast.error("Gagal menyimpan biaya. Silakan coba lagi.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleApply() {
    if (!parsed) return;
    onApplyToForm?.(parsed);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scanner-modal-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-xl border border-slate-200 bg-white sm:max-h-[90vh] sm:rounded-xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-primary-200 bg-primary-50 p-2 text-primary-700">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 id="scanner-modal-title" className="text-lg font-semibold text-ink-slate">
                Scan Email Tagihan & Invoice
              </h2>
              <p className="text-xs text-slate-500">
                Deteksi nama, nominal, mata uang, dan tanggal tagihan secara instan.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-white hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Privacy Note */}
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>
              <strong>Privasi Terjamin:</strong> Pemrosesan berjalan 100% di browser Anda. Konten email tidak pernah dikirim ke server pihak ketiga.
            </span>
          </div>

          {/* Quick Samples */}
          <div>
            <span className="text-xs font-medium text-slate-500 mb-1.5 block">
              Contoh cepat teks tagihan:
            </span>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.label}
                  type="button"
                  onClick={() => {
                    setInputText(tpl.text);
                    handleScan(tpl.text);
                  }}
                  className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-primary-50 hover:text-primary-700 text-slate-700 rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5"
                >
                  <Mail className="h-3 w-3" />
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input Textarea & Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`relative rounded-lg border transition-colors p-3 ${
              isDragging
                ? "border-primary-500 bg-primary-50/30"
                : "border-dashed border-slate-300 hover:border-slate-400 bg-slate-50/50"
            }`}
          >
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Tempel teks isi email konfirmasi tagihan di sini (atau tarik file .eml / .txt)..."
              rows={5}
              className="w-full min-h-[120px] border-0 bg-transparent p-0 text-sm text-slate-800 placeholder-slate-400 focus:outline-none resize-y"
            />
            <div className="mt-2 flex items-center justify-between border-t border-slate-200/60 pt-2 text-xs text-slate-400">
              <label className="cursor-pointer hover:text-primary-600 flex items-center gap-1">
                <UploadCloud className="h-4 w-4" />
                <span>Pilih file .eml / .txt</span>
                <input
                  type="file"
                  accept=".eml,.txt,.csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileRead(file);
                  }}
                />
              </label>
              <button
                type="button"
                onClick={() => handleScan()}
                className="ds-btn-primary inline-flex min-h-0 items-center gap-1.5 px-3.5 py-1.5 text-xs"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Ekstrak Tagihan
              </button>
            </div>
          </div>

          {/* Extraction Result Card */}
          {parsed && (
            <div className="space-y-3 rounded-lg border border-primary-200 bg-primary-50/40 p-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span className="text-sm font-semibold text-ink-slate">Hasil Ekstraksi Cerdas</span>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  Keyakinan {parsed.confidence}%
                </span>
              </div>

              {/* Editable Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <Field label="Nama Layanan" htmlFor="scanner-name">
                  <Input
                    id="scanner-name"
                    type="text"
                    value={parsed.name}
                    onChange={(e) => setParsed({ ...parsed, name: e.target.value })}
                    className="text-sm font-medium"
                  />
                </Field>

                <Field label="Nominal & Mata Uang" htmlFor="scanner-amount">
                  <FieldGroup>
                    <Select
                      value={parsed.currency}
                      onChange={(e) => setParsed({ ...parsed, currency: e.target.value as Currency })}
                      aria-label="Mata uang"
                      className="w-24 text-xs font-medium"
                    >
                      {SUPPORTED_CURRENCIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </Select>
                    <Input
                      id="scanner-amount"
                      type="number"
                      value={parsed.amount}
                      onChange={(e) => setParsed({ ...parsed, amount: Number(e.target.value) })}
                      aria-label="Nominal tagihan"
                      className="text-sm font-semibold tabular-nums"
                    />
                  </FieldGroup>
                </Field>

                <Field label="Siklus Tagihan" htmlFor="scanner-interval">
                  <Select
                    id="scanner-interval"
                    value={parsed.interval}
                    onChange={(e) => setParsed({ ...parsed, interval: e.target.value as Interval })}
                    className="text-sm"
                  >
                    <option value="monthly">Bulanan</option>
                    <option value="yearly">Tahunan</option>
                    <option value="quarterly">Kuartal</option>
                    <option value="weekly">Mingguan</option>
                  </Select>
                </Field>

                <Field label="Jatuh Tempo Berikutnya" htmlFor="scanner-next-billing-date">
                  <Input
                    id="scanner-next-billing-date"
                    type="date"
                    value={parsed.next_billing_date}
                    onChange={(e) => setParsed({ ...parsed, next_billing_date: e.target.value })}
                    className="text-sm tabular-nums"
                  />
                </Field>
              </div>

              {parsed.suggested_category && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1">
                  <span>Kategori yang disarankan:</span>
                  <span className="font-semibold text-primary-700 bg-primary-100/70 px-2 py-0.5 rounded-md">
                    {parsed.suggested_category}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col-reverse justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="ds-btn-secondary px-4 py-2"
          >
            Batal
          </button>

          {parsed && (
            <>
              {onApplyToForm && (
                <button
                  type="button"
                  onClick={handleApply}
                  className="inline-flex min-h-[42px] items-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-800 transition-colors hover:bg-primary-100"
                >
                  <ArrowRight className="h-4 w-4" />
                  Terapkan ke Form
                </button>
              )}

              <button
                type="button"
                onClick={handleSaveDirectly}
                disabled={isSaving}
                className="ds-btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-sm"
              >
                <Check className="h-4 w-4" />
                {isSaving ? "Menyimpan..." : "Simpan ke Daftar Biaya"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
