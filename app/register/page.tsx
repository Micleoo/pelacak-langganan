"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Input, InputWithAdornment, Field } from "@/components/ui/Input";
import { Eye, EyeOff, AlertCircle, CheckCircle2, UserPlus } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { signUpWithEmail } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (password.length < 6) {
      setError("Kata sandi minimal harus 6 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setLoading(true);

    try {
      const { error: authError, user, session } = await signUpWithEmail(email, password);

      if (authError) {
        setError(authError.message || "Gagal mendaftar. Silakan coba lagi.");
        setLoading(false);
        return;
      }

      // Jika email sudah terdaftar sebelumnya
      if (user && user.identities && user.identities.length === 0) {
        setError("Email ini sudah terdaftar. Silakan gunakan menu Masuk.");
        setLoading(false);
        return;
      }

      // Jika email confirmation aktif di Supabase (session belum terbentuk)
      if (!session) {
        setSuccessMessage(
          "Pendaftaran berhasil! Tautan verifikasi telah dikirim ke email Anda. Silakan periksa kotak masuk atau folder spam Anda untuk mengaktifkan akun sebelum masuk."
        );
        setLoading(false);
        return;
      }

      setSuccessMessage(
        "Pendaftaran berhasil! Akun Anda telah siap. Mengalihkan ke dashboard..."
      );

      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan tidak terduga.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-50 px-5 py-12 sm:px-8 sm:py-20">
      <div className="mx-auto grid w-full max-w-5xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        {/* Header Branding */}
        <div className="pt-2 lg:pt-8">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary-700 text-white">
            <UserPlus className="h-5 w-5" />
          </div>
          <p className="mt-7 text-sm font-medium text-primary-700">Mulai dengan tenang</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
            Daftar Akun Baru
          </h1>
          <p className="mt-5 max-w-sm text-base leading-7 text-slate-600">
            Mulai kelola langganan rutin Anda dengan data pribadi terisolasi.
          </p>
          <p className="mt-8 hidden border-t border-slate-200 pt-6 text-sm leading-6 text-slate-600 lg:block">
            Buat akun untuk menyimpan daftar biaya, kategori, dan pengingat yang hanya dapat Anda akses sendiri.
          </p>
        </div>

        {/* Card Form */}
        <div className="border border-slate-200 bg-white p-6 sm:p-9">
          <div className="mb-7 border-b border-slate-100 pb-5">
            <h2 className="text-xl font-semibold tracking-[-0.02em] text-slate-950">Buat detail akun</h2>
            <p className="mt-1 text-sm text-slate-500">Gunakan email aktif untuk menerima verifikasi bila diperlukan.</p>
          </div>
          {error && (
            <div
              role="alert"
              className="mb-6 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5 animate-fadeIn"
            >
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div
              role="status"
              className="mb-6 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2.5 animate-fadeIn"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Email" htmlFor="email" required>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </Field>

            <Field label="Kata Sandi (Min. 6 Karakter)" htmlFor="password" required>
              <InputWithAdornment
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  minLength={6}
                trailingAdornment={<button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                  aria-label={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>}
              />
            </Field>

            <Field label="Konfirmasi Kata Sandi" htmlFor="confirm-password" required>
              <Input
                id="confirm-password"
                name="confirm-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                minLength={6}
              />
            </Field>

            <div className="pt-2">
              <Button
                type="submit"
                loading={loading}
                className="w-full justify-center py-3 text-sm"
              >
                {loading ? "Mendaftarkan..." : "Daftar Akun"}
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600">
              Sudah memiliki akun?{" "}
              <Link
                href="/login"
                className="font-medium text-teal-600 hover:text-teal-700 hover:underline transition-colors"
              >
                Masuk ke akun
              </Link>
            </p>

            <div className="mt-4 pt-4 border-t border-slate-100/80">
              <Link
                href="/?demo=true"
                className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-700 transition-colors"
              >
                <span>Atau coba demo interaktif tanpa akun</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
