import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import { StoreProvider } from "@/components/StoreProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { BottomNav } from "@/components/BottomNav";
import { ToastProvider } from "@/components/ui/ToastProvider";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pelacak-langganan.vercel.app"),
  title: "Pelacak Langganan",
  description:
    "Alat pribadi untuk melacak biaya berulang dan sadar ke mana uangmu pergi.",
  openGraph: {
    title: "Pelacak Langganan",
    description:
      "Alat pribadi untuk melacak biaya berulang dan sadar ke mana uangmu pergi.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Pelacak Langganan",
    description:
      "Alat pribadi untuk melacak biaya berulang dan sadar ke mana uangmu pergi.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Lewati ke konten
        </a>
        <AuthProvider>
          <StoreProvider>
            <ToastProvider />
            <SiteHeader />
            <main id="main" className="flex-1 pb-16 sm:pb-0">{children}</main>
            <BottomNav />
          </StoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
