"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/Input";
import { Lock, Mail, Eye, EyeOff, AlertCircle, CheckCircle2, UserPlus } from "lucide-react";

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
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-50 text-primary-600 mb-3 border border-primary-100 shadow-xs">
            <UserPlus className="w-6 h-6 text-teal-600" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Daftar Akun Baru
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Mulai kelola langganan rutin Anda dengan data pribadi terisolasi.
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
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
            <Field>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Email
              </span>
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

            <Field>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                Kata Sandi (Min. 6 Karakter)
              </span>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  minLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  aria-label={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </Field>

            <Field>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                Konfirmasi Kata Sandi
              </span>
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
                className="w-full justify-center py-2.5 text-base font-semibold shadow-xs"
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
          </div>
        </div>
      </div>
    </div>
  );
}
