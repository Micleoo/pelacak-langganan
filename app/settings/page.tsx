"use client";

import { useState } from "react";
import { Bell, Mail } from "lucide-react";
import { useStore } from "@/lib/store";
import { resolveNotifyDays } from "@/lib/recurring";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Card } from "@/components/ui/Card";
import { toast } from "react-hot-toast";
import { NO_CATEGORY_LABEL } from "@/lib/constants";

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

  function onGlobalChange(days: number) {
    updateSettings({ ...settings, default_notify_days_before: days })
      .then(() => toast.success("Timing global diperbarui."))
      .catch(() => toast.error("Gagal memperbarui pengaturan."));
  }

  function saveEmail(val: string) {
    const trimmed = val.trim();
    if (trimmed === (settings.user_email || "")) return;
    updateSettings({ ...settings, user_email: trimmed })
      .then(() => toast.success("Email disimpan."))
      .catch(() => toast.error("Gagal menyimpan email."));
  }

  function handleEmailChange(val: string) {
    setEmailInput(val);
    if (emailDebounceTimer) clearTimeout(emailDebounceTimer);
    const timer = setTimeout(() => {
      saveEmail(val);
    }, 300);
    setEmailDebounceTimer(timer);
  }

  function handleEmailBlur() {
    if (emailDebounceTimer) clearTimeout(emailDebounceTimer);
    saveEmail(emailInput);
  }

  function handleEmailKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      if (emailDebounceTimer) clearTimeout(emailDebounceTimer);
      saveEmail(emailInput);
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
                  Pengingat akan dikirim ke alamat email di bawah.
                </p>
              </div>
            </div>
            <Toggle
              checked={settings.email_enabled}
              label="Aktifkan notifikasi email"
              disabled={!settings.user_email}
              onChange={(v) => {
                if (!settings.user_email && v) {
                  toast.error("Isi alamat email terlebih dahulu.");
                  return;
                }
                updateSettings({ ...settings, email_enabled: v })
                  .then(() =>
                    toast.success(
                      v
                        ? "Notifikasi email diaktifkan."
                        : "Notifikasi email nonaktif.",
                    ),
                  )
                  .catch(() => toast.error("Gagal memperbarui pengaturan."));
              }}
            />
          </div>
          {!settings.user_email && (
            <p className="mt-2 text-xs text-slate-500">
              Isi alamat email di bawah untuk mengaktifkan notifikasi email.
            </p>
          )}
          {settings.email_enabled && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <label htmlFor="user-email" className="mb-1.5 block text-sm font-medium text-ink-slate">
                Alamat Email
              </label>
              <input
                id="user-email"
                type="email"
                className="ds-input w-full"
                placeholder="contoh@email.com"
                value={emailInput}
                onChange={(e) => handleEmailChange(e.target.value)}
                onBlur={handleEmailBlur}
                onKeyDown={handleEmailKeyDown}
              />
              <p className="mt-2 text-xs text-slate-500">
                Disimpan otomatis (debounce 300ms) atau tekan Enter.
              </p>
            </div>
          )}
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
      </div>
    </div>
  );
}