"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, Tags, Settings } from "lucide-react";
import { useAuth } from "./AuthProvider";

const TABS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expenses", label: "Biaya", icon: Receipt },
  { href: "/categories", label: "Kategori", icon: Tags },
  { href: "/settings", label: "Pengaturan", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");

  // Only render for logged in users, not on login/register pages
  if (isAuthPage || !user) {
    return null;
  }

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav
      aria-label="Mobile navigation"
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/90 bg-white/95 backdrop-blur-md px-2 py-1.5 shadow-lg"
    >
      <div className="flex items-center justify-around">
        {TABS.map((tab) => {
          const active = isActive(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center min-w-[64px] py-1 px-2 rounded-lg transition-colors ${
                active
                  ? "text-teal-600 font-semibold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? "stroke-[2.25]" : "stroke-[1.75]"}`} />
              <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
