import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
      <p className="text-sm font-medium text-primary-700">Halaman tidak ditemukan</p>
      <h1 className="mt-2 text-4xl font-bold tabular-nums text-ink-slate">404</h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-slate-500">
        Halaman yang Anda cari tidak ada atau sudah dipindahkan. Kembali ke
        dashboard untuk melihat biaya berulang Anda.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
      >
        Kembali ke dashboard
      </Link>
    </div>
  );
}