import { describe, expect, it } from "vitest";
import {
  convertToBaseCurrency,
  formatCurrency,
  formatCurrencyMonthly,
  getCurrencySymbol,
  isValidCurrency,
  SUPPORTED_CURRENCIES,
  EXCHANGE_RATES_TO_IDR,
} from "./currencies";

describe("currencies module", () => {
  describe("isValidCurrency", () => {
    it("recognizes all supported currencies", () => {
      for (const c of SUPPORTED_CURRENCIES) {
        expect(isValidCurrency(c)).toBe(true);
      }
    });

    it("rejects unknown strings or types", () => {
      expect(isValidCurrency("JPY")).toBe(false);
      expect(isValidCurrency("")).toBe(false);
      expect(isValidCurrency(null)).toBe(false);
      expect(isValidCurrency(undefined)).toBe(false);
      expect(isValidCurrency(123)).toBe(false);
    });
  });

  describe("convertToBaseCurrency", () => {
    it("returns unchanged amount when currencies are identical", () => {
      expect(convertToBaseCurrency(100, "IDR", "IDR")).toBe(100);
      expect(convertToBaseCurrency(25, "USD", "USD")).toBe(25);
    });

    it("converts USD to IDR accurately", () => {
      // 10 USD * 15500 = 155000 IDR
      expect(convertToBaseCurrency(10, "USD", "IDR")).toBe(155000);
    });

    it("converts IDR to USD accurately", () => {
      // 155000 IDR / 15500 = 10 USD
      expect(convertToBaseCurrency(155000, "IDR", "USD")).toBe(10);
    });

    it("converts EUR to IDR accurately", () => {
      // 10 EUR * 16800 = 168000 IDR
      expect(convertToBaseCurrency(10, "EUR", "IDR")).toBe(168000);
    });

    it("converts SGD to IDR accurately", () => {
      // 10 SGD * 11500 = 115000 IDR
      expect(convertToBaseCurrency(10, "SGD", "IDR")).toBe(115000);
    });

    it("converts cross-currencies correctly (USD to SGD)", () => {
      // 10 USD = 155000 IDR -> in SGD: 155000 / 11500
      expect(convertToBaseCurrency(10, "USD", "SGD")).toBeCloseTo(155000 / 11500, 4);
    });

    it("handles zero amount", () => {
      expect(convertToBaseCurrency(0, "USD", "IDR")).toBe(0);
    });

    it("falls back gracefully when given invalid currency string", () => {
      expect(convertToBaseCurrency(50000, "INVALID", "IDR")).toBe(50000);
    });
  });

  describe("formatCurrency & formatCurrencyMonthly", () => {
    it("formats IDR without decimal places", () => {
      const formatted = formatCurrency(150000, "IDR");
      expect(formatted).toContain("150.000");
    });

    it("formats USD with fraction digits", () => {
      const formatted = formatCurrency(9.99, "USD");
      expect(formatted).toContain("9,99");
    });

    it("appends /bln in formatCurrencyMonthly", () => {
      expect(formatCurrencyMonthly(150000, "IDR")).toContain("/bln");
      expect(formatCurrencyMonthly(10, "USD")).toContain("/bln");
    });

    it("falls back to IDR without throwing on invalid currency", () => {
      expect(() => formatCurrency(10000, "UNKNOWN")).not.toThrow();
    });
  });

  describe("getCurrencySymbol", () => {
    it("returns correct symbols", () => {
      expect(getCurrencySymbol("IDR")).toBe("Rp");
      expect(getCurrencySymbol("USD")).toBe("$");
      expect(getCurrencySymbol("EUR")).toBe("€");
      expect(getCurrencySymbol("SGD")).toBe("S$");
    });

    it("falls back to Rp on unknown currency", () => {
      expect(getCurrencySymbol("XYZ")).toBe("Rp");
    });
  });
});
