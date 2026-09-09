"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Input, InputWithAdornment, Field } from "@/components/ui/Input";
import { ArrowRight, Check, Eye, EyeOff, AlertCircle, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { signInWithEmail } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: authError } = await signInWithEmail(email, password);

      if (authError) {
        if (authError.message.includes("Invalid login credentials")) {
          setError("Email atau kata sandi salah. Silakan periksa kembali.");
        } else if (authError.message.includes("Email not confirmed")) {
          setError(
            "Email belum dikonfirmasi. Silakan periksa kotak masuk atau spam email Anda untuk mengklik tautan verifikasi, atau matikan fitur 'Confirm email' di Supabase Authentication."
          );
        } else {
          setError(authError.message || "Gagal masuk. Silakan coba lagi.");
        }
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
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
          <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-primary-600 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <p className="mt-7 text-sm font-medium text-primary-700">Selamat datang kembali</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
            Masuk ke Pelacak Langganan
          </h1>
          <p className="mt-5 max-w-sm text-base leading-7 text-slate-600">
            Sadar ke mana uangmu pergi dengan privasi data terlindungi.
          </p>
          <ul className="mt-8 hidden space-y-3 border-t border-slate-200 pt-6 text-sm text-slate-600 lg:block">
            {["Dashboard biaya berulang yang rapi", "Pengingat tagihan yang tepat waktu", "Data terisolasi untuk akun Anda"].map((item) => <li key={item} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary-600" aria-hidden />{item}</li>)}
          </ul>
        </div>

        {/* Card Form */}
        <div className="border border-slate-200 bg-white p-6 sm:p-9">
          <div className="mb-7 border-b border-slate-100 pb-5"><h2 className="text-xl font-semibold tracking-[-0.02em] text-slate-950">Masukkan detail akun</h2><p className="mt-1 text-sm text-slate-500">Gunakan email dan kata sandi yang terdaftar.</p></div>
          {error && (
            <div
              role="alert"
              className="mb-6 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5 animate-fadeIn"
            >
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
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

            <Field label="Kata Sandi" htmlFor="password" required>
              <InputWithAdornment
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
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

            <div className="pt-2">
              <Button
                type="submit"
                loading={loading}
                className="w-full justify-center py-3 text-sm font-semibold"
              >
                {loading ? "Memproses..." : <span className="inline-flex items-center gap-2">Masuk <ArrowRight className="h-4 w-4" /></span>}
              </Button>
            </div>
          </form>

          <div className="mt-7 border-t border-slate-100 pt-5 text-center">
            <p className="text-sm text-slate-600">
              Belum punya akun?{" "}
              <Link
                href="/register"
                className="font-medium text-teal-600 hover:text-teal-700 hover:underline transition-colors"
              >
                Daftar sekarang
              </Link>
            </p>

            <div className="mt-5 pt-4 border-t border-slate-100/80">
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
