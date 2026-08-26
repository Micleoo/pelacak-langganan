"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, X } from "lucide-react";

export function PrivacyBanner() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const isDismissed = localStorage.getItem("privacy_banner_dismissed");
    if (!isDismissed) {
      setDismissed(false);
    }
  }, []);

  function handleDismiss() {
    localStorage.setItem("privacy_banner_dismissed", "true");
    setDismissed(true);
  }

  if (dismissed) return null;

  return (
    <aside
      aria-label="Informasi Privasi Data"
      className="mb-6 flex items-start justify-between gap-3 rounded-xl border border-primary-100 bg-primary-50/70 p-3.5 text-xs text-primary-950 sm:items-center"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
        </span>
        <p className="leading-relaxed">
          <strong className="font-semibold text-primary-900">Privasi & Keamanan:</strong> Data langganan ini tersimpan aman khusus untuk perangkat & sesi Anda. Tanpa pelacak pihak ketiga.
        </p>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Tutup pemberitahuan privasi"
        className="shrink-0 rounded-md p-1 text-primary-600 hover:bg-primary-100/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </aside>
  );
}
