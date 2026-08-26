"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Nav, NavLink } from "./ui/Nav";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/expenses", label: "Daftar Biaya" },
  { href: "/categories", label: "Kategori" },
  { href: "/settings", label: "Pengaturan" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xs">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-4 sm:px-6 sm:py-3">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-ink-slate no-underline shrink-0"
        >
          Pelacak Langganan
        </Link>
        <Nav className="gap-2 sm:gap-4 text-xs sm:text-sm overflow-x-auto no-scrollbar py-0.5">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              aria-current={isActive(pathname, item.href) ? "page" : undefined}
              isActive={isActive(pathname, item.href)}
              className="shrink-0 px-1 py-1"
            >
              {item.label}
            </NavLink>
          ))}
        </Nav>
      </div>
    </header>
  );
}