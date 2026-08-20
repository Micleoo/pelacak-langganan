"use client";

import { useState } from "react";
import { Bell, Mail } from "lucide-react";
import { useStore } from "@/lib/store";
import { resolveNotifyDays } from "@/lib/recurring";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Card } from "@/components/ui/Card";

const DAYS = [1, 2, 3, 4, 5, 6, 7];

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
        checked ? "bg-primary-600" : "bg-slate-300"
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
  const [notice, setNotice] = useState<string | null>(null);

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 2000);
  }

  const active = expenses.filter((e) => e.status === "active");
  const globalDays = settings.default_notify_days_before;
  const categoryName = (id: string | null) =>
    categories.find((c) => c.id === id)?.name ?? "Tanpa kategori";

  function onGlobalChange(days: number) {
    void updateSettings({ ...settings, default_notify_days_before: days })
      .then(() => showNotice("Timing global diperbarui."))
      .catch(() => showNotice("Gagal memperbarui pengaturan."));
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

      {notice && (
        <p role="status" className="mb-4 rounded-lg bg-primary-50 px-3 py-2 text-sm text-primary-800">
          {notice}
        </p>
      )}

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
                void updateSettings({ ...settings, in_app_enabled: v })
                  .then(() =>
                    showNotice(
                      v ? "Notifikasi in-app aktif." : "Notifikasi in-app nonaktif.",
                    ),
                  )
                  .catch(() => showNotice("Gagal memperbarui pengaturan."));
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
              onChange={(v) => {
                void updateSettings({ ...settings, email_enabled: v })
                  .then(() =>
                    showNotice(
                      v
                        ? "Notifikasi email diaktifkan."
                        : "Notifikasi email nonaktif.",
                    ),
                  )
                  .catch(() => showNotice("Gagal memperbarui pengaturan."));
              }}
            />
          </div>
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
                defaultValue={settings.user_email || ""}
                onBlur={(e) => {
                  const val = e.target.value.trim();
                  if (val !== (settings.user_email || "")) {
                    void updateSettings({ ...settings, user_email: val })
                      .then(() => showNotice("Email disimpan."))
                      .catch(() => showNotice("Gagal menyimpan email."));
                  }
                }}
              />
              <p className="mt-2 text-xs text-slate-500">
                Otomatis disimpan saat Anda memindahkan kursor.
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
                      void updateExpenseNotifyDays(
                        e.id,
                        v === "" ? null : Number(v),
                      )
                        .then(() =>
                          showNotice(
                            v === ""
                              ? `${e.name} memakai timing global (H-${globalDays}).`
                              : `${e.name} diingatkan H-${v}.`,
                          ),
                        )
                        .catch(() => showNotice("Gagal memperbarui biaya."));
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