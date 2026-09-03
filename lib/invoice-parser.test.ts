import { describe, expect, it } from "vitest";
import {
  parseInvoiceText,
  extractDateFromText,
  extractAmountAndCurrency,
  extractIntervalFromText,
} from "./invoice-parser";

describe("lib/invoice-parser", () => {
  describe("extractDateFromText", () => {
    it("extracts ISO date YYYY-MM-DD", () => {
      expect(extractDateFromText("Jatuh tempo pada 2026-10-25 untuk tagihan.")).toBe("2026-10-25");
    });

    it("extracts slash date DD/MM/YYYY", () => {
      expect(extractDateFromText("Perpanjangan berikutnya: 24/09/2026.")).toBe("2026-09-24");
    });

    it("extracts Indonesian named month format", () => {
      expect(extractDateFromText("Tagihan jatuh tempo pada 15 Oktober 2026.")).toBe("2026-10-15");
      expect(extractDateFromText("Tanggal: 5 Agustus 2026")).toBe("2026-08-05");
    });

    it("extracts English named month format", () => {
      expect(extractDateFromText("Next billing date: September 28, 2026.")).toBe("2026-09-28");
    });

    it("returns null when no date pattern found", () => {
      expect(extractDateFromText("Tidak ada tanggal apapun di sini")).toBeNull();
    });
  });

  describe("extractAmountAndCurrency", () => {
    it("extracts IDR format with thousand dots", () => {
      expect(extractAmountAndCurrency("Total tagihan Anda adalah Rp 186.000")).toEqual({
        amount: 186000,
        currency: "IDR",
      });
      expect(extractAmountAndCurrency("Bayar IDR 54,990 segera")).toEqual({
        amount: 54990,
        currency: "IDR",
      });
    });

    it("extracts USD format with dollar sign or suffix", () => {
      expect(extractAmountAndCurrency("Your card was charged $20.00 today")).toEqual({
        amount: 20,
        currency: "USD",
      });
      expect(extractAmountAndCurrency("Subtotal: 10.50 USD")).toEqual({
        amount: 10.5,
        currency: "USD",
      });
    });

    it("extracts EUR and SGD format", () => {
      expect(extractAmountAndCurrency("Invoice total: €15.00 for month")).toEqual({
        amount: 15,
        currency: "EUR",
      });
      expect(extractAmountAndCurrency("Amount paid: S$ 12.00")).toEqual({
        amount: 12,
        currency: "SGD",
      });
    });

    it("returns null when no valid currency amount is found", () => {
      expect(extractAmountAndCurrency("Halo selamat datang")).toBeNull();
    });
  });

  describe("extractIntervalFromText", () => {
    it("detects yearly interval", () => {
      expect(extractIntervalFromText("Paket langganan tahunan hemat 20%")).toBe("yearly");
      expect(extractIntervalFromText("Billed annually at $120/year")).toBe("yearly");
    });

    it("detects quarterly and weekly intervals", () => {
      expect(extractIntervalFromText("Dikenakan per kuartal (3 bulan)")).toBe("quarterly");
      expect(extractIntervalFromText("Tagihan mingguan $5/week")).toBe("weekly");
    });

    it("defaults to monthly", () => {
      expect(extractIntervalFromText("Tagihan rutin")).toBe("monthly");
    });
  });

  describe("parseInvoiceText (End-to-End Provider Tests)", () => {
    it("parses Netflix billing confirmation email", () => {
      const email = `
        Dari: Netflix <info@account.netflix.com>
        Subjek: Tagihan Anda dari Netflix
        
        Halo Rani,
        Pembayaran keanggotaan bulanan Anda sebesar Rp 186.000 telah berhasil diproses.
        Paket: Netflix Premium
        Tanggal tagihan berikutnya: 24 September 2026.
        Terima kasih telah menonton bersama kami.
      `;

      const result = parseInvoiceText(email);
      expect(result).not.toBeNull();
      expect(result?.name).toBe("Netflix Premium");
      expect(result?.amount).toBe(186000);
      expect(result?.currency).toBe("IDR");
      expect(result?.interval).toBe("monthly");
      expect(result?.next_billing_date).toBe("2026-09-24");
      expect(result?.suggested_category).toBe("Streaming");
      expect(result?.confidence).toBeGreaterThanOrEqual(90);
    });

    it("parses Spotify receipt email", () => {
      const email = `
        Spotify AB - Tanda Terima Pembayaran
        
        Terima kasih telah berlangganan Spotify Premium Individual.
        Nominal tagihan: Rp 54.990
        Metode pembayaran: Kartu Kredit
        Tanggal perpanjangan berikutnya: 15/10/2026
      `;

      const result = parseInvoiceText(email);
      expect(result).not.toBeNull();
      expect(result?.name).toBe("Spotify Premium Individual");
      expect(result?.amount).toBe(54990);
      expect(result?.currency).toBe("IDR");
      expect(result?.next_billing_date).toBe("2026-10-15");
      expect(result?.suggested_category).toBe("Streaming");
    });

    it("parses OpenAI ChatGPT Plus invoice", () => {
      const email = `
        Receipt from OpenAI, LLC
        Invoice #INV-98765
        
        Description: ChatGPT Plus Subscription
        Amount: $20.00 USD
        Renewal date: 2026-11-05
      `;

      const result = parseInvoiceText(email);
      expect(result).not.toBeNull();
      expect(result?.name).toBe("ChatGPT Plus");
      expect(result?.amount).toBe(20);
      expect(result?.currency).toBe("USD");
      expect(result?.interval).toBe("monthly");
      expect(result?.next_billing_date).toBe("2026-11-05");
      expect(result?.suggested_category).toBe("AI Tools");
    });

    it("parses IndiHome internet bill email", () => {
      const email = `
        PT Telkom Indonesia (Persero) Tbk
        Pemberitahuan Tagihan IndiHome
        
        Nomor Pelanggan: 122334455
        Total Tagihan: Rp 350.000
        Jatuh tempo pembayaran: 20 Oktober 2026
        Segera lakukan pembayaran untuk menjaga kelancaran koneksi Anda.
      `;

      const result = parseInvoiceText(email);
      expect(result).not.toBeNull();
      expect(result?.name).toBe("Internet (IndiHome)");
      expect(result?.amount).toBe(350000);
      expect(result?.currency).toBe("IDR");
      expect(result?.suggested_category).toBe("Utilitas");
      expect(result?.next_billing_date).toBe("2026-10-20");
    });

    it("parses Apple iCloud+ receipt", () => {
      const email = `
        Apple Distribution International Ltd.
        Tanda terima dari Apple
        
        iCloud+ dengan penyimpanan 50 GB
        Harga: Rp 15.000 / bulan
        Tanggal tagihan: 2026-09-28
      `;

      const result = parseInvoiceText(email);
      expect(result).not.toBeNull();
      expect(result?.name).toBe("iCloud+");
      expect(result?.amount).toBe(15000);
      expect(result?.currency).toBe("IDR");
      expect(result?.next_billing_date).toBe("2026-09-28");
    });

    it("falls back to heuristic extraction for unknown provider email", () => {
      const email = `
        Subject: Tagihan Domain Web Niagahoster
        Halo Daniel,
        Terima kasih, tagihan perpanjangan tahunan Anda sebesar Rp 250.000 telah terbit.
        Batas akhir pembayaran: 2026-12-10.
      `;

      const result = parseInvoiceText(email);
      expect(result).not.toBeNull();
      expect(result?.amount).toBe(250000);
      expect(result?.currency).toBe("IDR");
      expect(result?.interval).toBe("yearly");
      expect(result?.next_billing_date).toBe("2026-12-10");
      expect(result?.confidence).toBe(70);
    });

    it("returns null for empty or non-invoice text", () => {
      expect(parseInvoiceText("")).toBeNull();
      expect(parseInvoiceText("   ")).toBeNull();
      expect(parseInvoiceText("Halo apa kabar kawan, selamat siang")).toBeNull();
    });
  });
});
