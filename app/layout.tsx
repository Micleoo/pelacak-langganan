import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { StoreProvider } from "@/lib/store";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Pelacak Langganan",
  description:
    "Alat pribadi untuk melacak biaya berulang dan sadar ke mana uangmu pergi.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <StoreProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
        </StoreProvider>
      </body>
    </html>
  );
}
