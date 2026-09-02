"use client";

import { useState } from "react";
import { Bell, Download, Mail, ShieldCheck, Globe } from "lucide-react";
import { useStore } from "@/lib/store";
import { resolveNotifyDays } from "@/lib/recurring";
import { exportExpensesToCSV } from "@/lib/export-csv";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Card } from "@/components/ui/Card";
import { toast } from "react-hot-toast";
import { NO_CATEGORY_LABEL } from "@/lib/constants";
import { SUPPORTED_CURRENCIES, CURRENCY_LABELS, type Currency } from "@/lib/currencies";

const DAYS = [1, 2, 3, 4, 5, 6, 7];

function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : checked
          ? "bg-primary-600"
          : "bg-slate-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { expenses, categories, settings, updateSettings, updateExpenseNotifyDays } =
    useStore();

  const active = expenses.filter((e) => e.status === "active");
  const globalDays = settings.default_notify_days_before;
  const categoryName = (id: string | null) =>
    categories.find((c) => c.id === id)?.name ?? NO_CATEGORY_LABEL;

  const [emailInput, setEmailInput] = useState(settings.user_email || "");
  const [emailDebounceTimer, setEmailDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isSavingEmail, setIsSavingEmail] = useState(false);

  function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  function onGlobalChange(days: number) {
    updateSettings({ ...settings, default_notify_days_before: days })
      .then(() => toast.success("Timing global diperbarui."))
      .catch(() => toast.error("Gagal memperbarui pengaturan."));
  }

  function saveEmail(val: string, showToast = true): Promise<boolean> {
    const trimmed = val.trim();
    if (trimmed && !isValidEmail(trimmed)) {
      if (showToast) toast.error("Format email tidak valid.");
      return Promise.resolve(false);
    }
    if (trimmed === (settings.user_email || "")) {
      return Promise.resolve(true);
    }
    setIsSavingEmail(true);
    return updateSettings({
      ...settings,
      user_email: trimmed,
      email_enabled: trimmed ? settings.email_enabled : false,
    })
      .then(() => {
        setIsSavingEmail(false);
        if (showToast && trimmed) toast.success("Email berhasil disimpan.");
        return true;
      })
      .catch(() => {
        setIsSavingEmail(false);
        if (showToast) toast.error("Gagal menyimpan email.");
        return false;
      });
  }

  function handleEmailChange(val: string) {
    setEmailInput(val);
    if (emailDebounceTimer) clearTimeout(emailDebounceTimer);
    const timer = setTimeout(() => {
      if (val.trim() === "" || isValidEmail(val)) {
        saveEmail(val, false);
      }
    }, 600);
    setEmailDebounceTimer(timer);
  }

  function handleEmailBlur() {
    if (emailDebounceTimer) clearTimeout(emailDebounceTimer);
    if (emailInput.trim() !== (settings.user_email || "")) {
      saveEmail(emailInput);
    }
  }

  function handleEmailKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      if (emailDebounceTimer) clearTimeout(emailDebounceTimer);
      saveEmail(emailInput);
    }
  }

  async function handleToggleEmail(checked: boolean) {
    if (checked) {
      const emailToUse = emailInput.trim() || settings.user_email || "";
      if (!emailToUse || !isValidEmail(emailToUse)) {
        toast.error("Masukkan alamat email yang valid terlebih dahulu.");
        const inputEl = document.getElementById("user-email") as HTMLInputElement | null;
        if (inputEl) inputEl.focus();
        return;
      }
      const saved = await saveEmail(emailToUse, false);
      if (!saved) return;
      updateSettings({ ...settings, user_email: emailToUse, email_enabled: true })
        .then(() => toast.success("Notifikasi email diaktifkan."))
        .catch(() => toast.error("Gagal memperbarui pengaturan."));
    } else {
      updateSettings({ ...settings, email_enabled: false })
        .then(() => toast.success("Notifikasi email dinonaktifkan."))
        .catch(() => toast.error("Gagal memperbarui pengaturan."));
    }
  }

  async function handleSendTestEmail() {
    const emailToUse = emailInput.trim() || settings.user_email || "";
    if (!emailToUse || !isValidEmail(emailToUse)) {
      toast.error("Masukkan alamat email yang valid untuk mengirim uji coba.");
      const inputEl = document.getElementById("user-email") as HTMLInputElement | null;
      if (inputEl) inputEl.focus();
      return;
    }

    setIsSendingTest(true);
    try {
      // Pastikan email tersimpan sebelum dikirim
      await saveEmail(emailToUse, false);

      const res = await fetch("/api/send-test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToUse }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengirim email uji coba.");
      }

      if (data.delivered) {
        toast.success(`Email uji coba terkirim ke ${emailToUse}!`);
      } else {
        toast.success("Uji coba sukses: " + data.message, { duration: 5000 });
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal mengirim email uji coba.");
    } finally {
      setIsSendingTest(false);
    }
  }

  const inputClass = "ds-input";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-1 text-3xl font-semibold text-ink-slate">
        Pengaturan Notifikasi
      </h1>
      <p className="mb-6 text-sm text-slate-500">
        Konfigurasi pengingat sebelum biaya berulang jatuh tempo.
      </p>

      <div className="space-y-6">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <Bell className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-medium text-ink-slate">
                  Notifikasi in-app
                </p>
                <p className="text-xs text-slate-500">
                  Banner pengingat di dashboard saat mendekati jatuh tempo.
                </p>
              </div>
            </div>
            <Toggle
              checked={settings.in_app_enabled}
              label="Aktifkan notifikasi in-app"
              onChange={(v) => {
                updateSettings({ ...settings, in_app_enabled: v })
                  .then(() =>
                    toast.success(
                      v ? "Notifikasi in-app aktif." : "Notifikasi in-app nonaktif.",
                    ),
                  )
                  .catch(() => toast.error("Gagal memperbarui pengaturan."));
              }}
            />
          </div>
        </Card>

        <Card className="p-5">
          <label htmlFor="global-days" className="mb-1.5 block text-sm font-medium text-ink-slate">
            Timing pengingat global
          </label>
          <p className="mb-3 text-xs text-slate-500">
            Berapa hari sebelum jatuh tempo Anda ingin diingatkan (semua biaya,
            kecuali yang punya pengaturan sendiri).
          </p>
          <select
            id="global-days"
            value={globalDays}
            onChange={(e) => onGlobalChange(Number(e.target.value))}
            className={inputClass}
          >
            {DAYS.map((d) => (
              <option key={d} value={d}>
                H-{d} ({d} hari sebelum)
              </option>
            ))}
          </select>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <Mail className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-medium text-ink-slate">
                  Notifikasi email
                </p>
                <p className="text-xs text-slate-500">
                  Kirim rekap tagihan yang akan jatuh tempo langsung ke inbox Anda.
                </p>
              </div>
            </div>
            <Toggle
              checked={settings.email_enabled}
              label="Aktifkan notifikasi email"
              onChange={handleToggleEmail}
            />
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
            <div>
              <label htmlFor="user-email" className="mb-1.5 block text-sm font-medium text-ink-slate">
                Alamat Email Pengingat
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  id="user-email"
                  type="email"
                  className="ds-input flex-1"
                  placeholder="nama@email.com"
                  value={emailInput}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  onBlur={handleEmailBlur}
                  onKeyDown={handleEmailKeyDown}
                />
                <button
                  type="button"
                  onClick={() => saveEmail(emailInput)}
                  disabled={isSavingEmail}
                  className="ds-btn-secondary shrink-0 text-xs px-3 py-2"
                >
                  {isSavingEmail ? "Menyimpan..." : "Simpan Email"}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                Email disimpan otomatis atau klik Simpan Email.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <span className="text-xs text-slate-500">
                Status:{" "}
                {settings.email_enabled && settings.user_email ? (
                  <span className="font-medium text-primary-700">
                    Aktif (dikirim via cron harian)
                  </span>
                ) : (
                  <span className="font-medium text-slate-500">
                    Nonaktif
                  </span>
                )}
              </span>

              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={isSendingTest}
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-100 disabled:opacity-50 transition-colors"
              >
                <Mail className="h-3.5 w-3.5" aria-hidden />
                {isSendingTest ? "Mengirim Uji Coba..." : "Kirim Email Uji Coba"}
              </button>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-medium text-ink-slate">
            Timing per biaya
          </h2>
          <p className="mb-3 text-xs text-slate-500">
            Atur pengingat berbeda untuk biaya tertentu.
          </p>
          {active.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada biaya aktif.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {active.map((e) => (
                <li key={e.id} className="flex items-center gap-3 py-2.5">
                  <CategoryIcon name={categoryName(e.category_id)} size={28} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-slate">
                    {e.name}
                  </span>
                  <select
                    value={e.notify_days_before ?? ""}
                    onChange={(ev) => {
                      const v = ev.target.value;
                      updateExpenseNotifyDays(
                        e.id,
                        v === "" ? null : Number(v),
                      )
                        .then(() =>
                          toast.success(
                            v === ""
                              ? `${e.name} memakai timing global (H-${globalDays}).`
                              : `${e.name} diingatkan H-${v}.`,
                          ),
                        )
                        .catch(() => toast.error("Gagal memperbarui biaya."));
                    }}
                    className={inputClass}
                    aria-label={`Timing pengingat ${e.name}`}
                  >
                    <option value="">
                      Pakai global (H-{globalDays})
                    </option>
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        H-{d}
                      </option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <Globe className="h-5 w-5" aria-hidden />
            </span>
            <div className="flex-1">
              <h2 className="text-sm font-medium text-ink-slate">Mata Uang Dasar</h2>
              <p className="text-xs text-slate-500">
                Semua total dan rincian dikonversi ke mata uang ini. Kurs tetap (statis) untuk IDR, USD, EUR, SGD.
              </p>
            </div>
          </div>
          <select
            value={settings.base_currency}
            onChange={(e) => {
              const v = e.target.value as Currency;
              updateSettings({ ...settings, base_currency: v })
                .then(() => toast.success(`Mata uang dasar diubah ke ${CURRENCY_LABELS[v]}.`))
                .catch(() => toast.error("Gagal memperbarui pengaturan."));
            }}
            className={inputClass}
            aria-label="Mata uang dasar"
          >
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {CURRENCY_LABELS[c]}
              </option>
            ))}
          </select>
        </Card>

        <Card className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <Download className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 className="text-sm font-medium text-ink-slate">
                  Cadangan & Ekspor Data
                </h2>
                <p className="text-xs text-slate-500">
                  Unduh seluruh daftar biaya berulang dan kategori dalam format file CSV.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (expenses.length === 0) {
                  toast.error("Belum ada data untuk diekspor.");
                  return;
                }
                exportExpensesToCSV(expenses, categories);
                toast.success("File CSV berhasil diunduh.");
              }}
              className="ds-btn-secondary inline-flex items-center justify-center gap-1.5 text-xs py-2 px-3 shrink-0"
            >
              <Download className="h-4 w-4" aria-hidden />
              Unduh File CSV
            </button>
          </div>
        </Card>

        <Card className="p-5 border-dashed bg-slate-50/50">
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200/70 text-slate-600">
              <ShieldCheck className="h-4 w-4" aria-hidden />
            </span>
            <div className="space-y-1 text-xs text-slate-600">
              <p className="font-semibold text-ink-slate">
                Privasi & Kepemilikan Data
              </p>
              <p className="leading-relaxed">
                Aplikasi Pelacak Langganan berjalan secara privat. Data biaya dan preferensi notifikasi Anda tidak pernah dibagikan atau dijual ke pihak ketiga. Anda memiliki kendali penuh atas data Anda kapan saja.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}