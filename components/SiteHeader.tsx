"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  LayoutDashboard,
  Receipt,
  Tags,
  Settings,
  CreditCard,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "./AuthProvider";
import { Nav, NavLink } from "./ui/Nav";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expenses", label: "Daftar Biaya", icon: Receipt },
  { href: "/categories", label: "Kategori", icon: Tags },
  { href: "/settings", label: "Pengaturan", icon: Settings },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close mobile menu when pressing Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }
    if (mobileMenuOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Gagal logout:", err);
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xs">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold tracking-tight text-ink-slate no-underline"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600 text-white shadow-xs">
            <CreditCard className="h-4 w-4" aria-hidden />
          </span>
          <span>Pelacak Langganan</span>
        </Link>

        {/* Desktop Navigation */}
        {!isAuthPage && user && (
          <Nav className="hidden sm:flex items-center gap-1 sm:gap-2">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                aria-current={isActive(pathname, item.href) ? "page" : undefined}
                isActive={isActive(pathname, item.href)}
                className="px-2.5 py-1.5 text-xs font-medium"
              >
                {item.label}
              </NavLink>
            ))}
          </Nav>
        )}

        {/* User Info & Actions (Desktop) */}
        {!isAuthPage && user && (
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200/60">
              <UserIcon className="w-3 h-3 text-slate-400" />
              <span className="max-w-[140px] truncate" title={user.email}>
                {user.email}
              </span>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50"
              title="Keluar dari akun"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{signingOut ? "..." : "Keluar"}</span>
            </button>
          </div>
        )}

        {/* Auth page links */}
        {isAuthPage && (
          <div className="flex items-center gap-2 text-xs font-medium">
            {pathname.startsWith("/login") ? (
              <Link
                href="/register"
                className="text-teal-600 hover:text-teal-700 hover:underline"
              >
                Daftar Akun
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-teal-600 hover:text-teal-700 hover:underline"
              >
                Masuk
              </Link>
            )}
          </div>
        )}

        {/* Mobile Hamburger Button */}
        {!isAuthPage && user && (
          <div className="flex sm:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
              className="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-ink-slate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" aria-hidden />
              ) : (
                <Menu className="h-5 w-5" aria-hidden />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Mobile Navigation Dropdown Menu */}
      {!isAuthPage && user && mobileMenuOpen && (
        <div className="border-t border-slate-100 bg-white px-4 py-3 sm:hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="mb-3 pb-2 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <UserIcon className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-medium truncate max-w-[200px]">{user.email}</span>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="text-xs text-red-600 hover:underline font-medium inline-flex items-center gap-1"
            >
              <LogOut className="w-3 h-3" />
              Keluar
            </button>
          </div>
          <nav className="flex flex-col gap-1" aria-label="Navigasi Mobile">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary-50 text-primary-700 font-semibold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-ink-slate"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      active ? "text-primary-600" : "text-slate-400"
                    }`}
                    aria-hidden
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}