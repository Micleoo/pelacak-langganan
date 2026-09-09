import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
      <p className="text-5xl font-bold tabular-nums text-primary-700">404</p>
      <h1 className="mt-3 text-2xl font-semibold text-ink-slate">Halaman tidak ditemukan</h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-slate-500">
        Halaman yang Anda cari tidak ada atau sudah dipindahkan. Kembali ke
        dashboard untuk melihat biaya berulang Anda.
      </p>
      <Link
        href="/"
        className="ds-btn-primary mt-6 inline-flex items-center gap-1.5"
      >
        Kembali ke dashboard
      </Link>
    </div>
  );
}
