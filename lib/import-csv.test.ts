import { describe, expect, it, vi } from "vitest";
import { parseCSV, validateRows, importExpenses, CSV_TEMPLATE } from "./import-csv";
import type { Category, ExpenseInput } from "./data";

const mockCategories: Category[] = [
  { id: "cat1", name: "Streaming", created_at: "2026-08-01" },
  { id: "cat2", name: "AI Tools", created_at: "2026-08-01" },
];

describe("import-csv", () => {
  describe("parseCSV", () => {
    it("parses basic comma-separated values", () => {
      const csv = `name,amount,interval
Netflix,150000,monthly`;
      const rows = parseCSV(csv);
      expect(rows).toHaveLength(1);
      expect(rows[0]).toEqual({ name: "Netflix", amount: "150000", interval: "monthly" });
    });

    it("handles quoted fields with commas", () => {
      const csv = `name,amount,interval
"Netflix, Premium",150000,monthly`;
      const rows = parseCSV(csv);
      expect(rows[0].name).toBe("Netflix, Premium");
    });

    it("handles escaped quotes", () => {
      const csv = `name,amount,interval
"Netflix ""Premium""",150000,monthly`;
      const rows = parseCSV(csv);
      expect(rows[0].name).toBe('Netflix "Premium"');
    });

    it("skips empty lines", () => {
      const csv = `name,amount,interval
Netflix,150000,monthly

Spotify,189000,yearly`;
      const rows = parseCSV(csv);
      expect(rows).toHaveLength(2);
    });

    it("returns empty array for headers only", () => {
      const csv = `name,amount,interval`;
      const rows = parseCSV(csv);
      expect(rows).toHaveLength(0);
    });

    it("normalizes header names to lowercase", () => {
      const csv = `NAME,AMOUNT,INTERVAL
Netflix,150000,monthly`;
      const rows = parseCSV(csv);
      expect(rows[0]).toHaveProperty("name");
      expect(rows[0]).toHaveProperty("amount");
      expect(rows[0]).toHaveProperty("interval");
    });
  });

  describe("validateRows", () => {
    it("validates required fields", () => {
      const rows = [
        { name: "", amount: "150000", interval: "monthly", next_billing_date: "2026-10-01" },
      ];
      const { valid, errors } = validateRows(rows, mockCategories);
      expect(valid).toHaveLength(0);
      expect(errors[0].message).toContain('Kolom "name" wajib diisi');
    });

    it("validates amount is positive integer", () => {
      const rows = [
        { name: "Netflix", amount: "-100", interval: "monthly", next_billing_date: "2026-10-01" },
        { name: "Spotify", amount: "abc", interval: "monthly", next_billing_date: "2026-10-01" },
        { name: "Disney+", amount: "100.5", interval: "monthly", next_billing_date: "2026-10-01" },
      ];
      const { valid, errors } = validateRows(rows, mockCategories);
      expect(valid).toHaveLength(0);
      expect(errors).toHaveLength(3);
    });

    it("validates interval enum", () => {
      const rows = [
        { name: "Netflix", amount: "150000", interval: "invalid", next_billing_date: "2026-10-01" },
      ];
      const { valid, errors } = validateRows(rows, mockCategories);
      expect(valid).toHaveLength(0);
      expect(errors[0].message).toContain("Interval harus salah satu");
    });

    it("validates date format YYYY-MM-DD", () => {
      const rows = [
        { name: "Netflix", amount: "150000", interval: "monthly", next_billing_date: "01-10-2026" },
        { name: "Spotify", amount: "150000", interval: "monthly", next_billing_date: "invalid-date" },
      ];
      const { valid, errors } = validateRows(rows, mockCategories);
      expect(valid).toHaveLength(0);
      expect(errors).toHaveLength(2);
    });

    it("validates status enum", () => {
      const rows = [
        { name: "Netflix", amount: "150000", interval: "monthly", next_billing_date: "2026-10-01", status: "invalid" },
      ];
      const { valid, errors } = validateRows(rows, mockCategories);
      expect(valid).toHaveLength(0);
      expect(errors[0].message).toContain("Status harus salah satu");
    });

    it("validates currency enum", () => {
      const rows = [
        { name: "Netflix", amount: "150000", interval: "monthly", next_billing_date: "2026-10-01", currency: "INVALID" },
      ];
      const { valid, errors } = validateRows(rows, mockCategories);
      expect(valid).toHaveLength(0);
      expect(errors[0].message).toContain("Mata uang harus salah satu");
    });

    it("validates notify_days_before range", () => {
      const rows = [
        { name: "Netflix", amount: "150000", interval: "monthly", next_billing_date: "2026-10-01", notify_days_before: "0" },
        { name: "Spotify", amount: "150000", interval: "monthly", next_billing_date: "2026-10-01", notify_days_before: "8" },
      ];
      const { valid, errors } = validateRows(rows, mockCategories);
      expect(valid).toHaveLength(0);
      expect(errors).toHaveLength(2);
    });

    it("maps existing category by name (case-insensitive)", () => {
      const rows = [
        { name: "Netflix", amount: "150000", interval: "monthly", next_billing_date: "2026-10-01", category: "streaming" },
      ];
      const { valid } = validateRows(rows, mockCategories);
      expect(valid).toHaveLength(1);
      expect(valid[0].category_id).toBe("cat1");
    });

    it("returns null category_id for new category", () => {
      const rows = [
        { name: "Netflix", amount: "150000", interval: "monthly", next_billing_date: "2026-10-01", category: "New Category" },
      ];
      const { valid } = validateRows(rows, mockCategories);
      expect(valid).toHaveLength(1);
      expect(valid[0].category_id).toBeNull();
    });

    it("applies defaults for optional fields", () => {
      const rows = [
        { name: "Netflix", amount: "150000", interval: "monthly", next_billing_date: "2026-10-01" },
      ];
      const { valid } = validateRows(rows, mockCategories);
      expect(valid[0].status).toBe("active");
      expect(valid[0].currency).toBe("IDR");
      expect(valid[0].notify_days_before).toBeNull();
      expect(valid[0].last_paid_date).toBeNull();
    });

    it("returns errors with rowIndex and message", () => {
      const rows = [
        { name: "", amount: "150000", interval: "monthly", next_billing_date: "2026-10-01" },
      ];
      const { errors } = validateRows(rows, mockCategories);
      expect(errors[0].rowIndex).toBe(2); // header is row 1, data starts at row 2
      expect(errors[0].message).toBeTruthy();
    });
  });

  describe("importExpenses", () => {
    it("imports valid expenses sequentially", async () => {
      const validRows: ExpenseInput[] = [
        { name: "Netflix", amount: 150000, interval: "monthly", category_id: "cat1", status: "active", next_billing_date: "2026-10-01", notify_days_before: 3, last_paid_date: null, currency: "IDR" },
        { name: "Spotify", amount: 189000, interval: "yearly", category_id: "cat1", status: "active", next_billing_date: "2026-12-01", notify_days_before: 3, last_paid_date: null, currency: "IDR" },
      ];

      const mockStore = {
        addExpense: vi.fn().mockResolvedValue({ id: "new-id" }),
        addCategory: vi.fn(),
        expenses: [],
      };

      const result = await importExpenses(validRows, mockStore);
      expect(result.imported).toBe(2);
      expect(result.skipped).toBe(0);
      expect(mockStore.addExpense).toHaveBeenCalledTimes(2);
    });

    it("handles partial failures", async () => {
      const validRows: ExpenseInput[] = [
        { name: "Netflix", amount: 150000, interval: "monthly", category_id: "cat1", status: "active", next_billing_date: "2026-10-01", notify_days_before: 3, last_paid_date: null, currency: "IDR" },
        { name: "Spotify", amount: 189000, interval: "yearly", category_id: "cat1", status: "active", next_billing_date: "2026-12-01", notify_days_before: 3, last_paid_date: null, currency: "IDR" },
      ];

      const mockStore = {
        addExpense: vi.fn()
          .mockResolvedValueOnce({ id: "1" })
          .mockRejectedValueOnce(new Error("DB error")),
        addCategory: vi.fn(),
        expenses: [],
      };

      const result = await importExpenses(validRows, mockStore);
      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(1);
    });

    it("continues after errors and imports remaining valid rows", async () => {
      const validRows: ExpenseInput[] = [
        { name: "Netflix", amount: 150000, interval: "monthly", category_id: "cat1", status: "active", next_billing_date: "2026-10-01", notify_days_before: 3, last_paid_date: null, currency: "IDR" },
        { name: "Spotify", amount: 189000, interval: "yearly", category_id: "cat1", status: "active", next_billing_date: "2026-12-01", notify_days_before: 3, last_paid_date: null, currency: "IDR" },
        { name: "Disney+", amount: 200000, interval: "monthly", category_id: "cat1", status: "active", next_billing_date: "2026-10-01", notify_days_before: 3, last_paid_date: null, currency: "IDR" },
      ];

      const mockStore = {
        addExpense: vi.fn()
          .mockResolvedValueOnce({ id: "1" })
          .mockRejectedValueOnce(new Error("DB error"))
          .mockResolvedValueOnce({ id: "3" }),
        addCategory: vi.fn(),
        expenses: [],
      };

      const result = await importExpenses(validRows, mockStore);
      // Continues after error, imports 2 out of 3
      expect(result.imported).toBe(2);
      expect(result.skipped).toBe(1);
    });
  });

  describe("CSV_TEMPLATE", () => {
    it("contains all required headers", () => {
      const headers = CSV_TEMPLATE.split("\n")[0].split(",");
      expect(headers).toContain("name");
      expect(headers).toContain("amount");
      expect(headers).toContain("interval");
      expect(headers).toContain("category");
      expect(headers).toContain("status");
      expect(headers).toContain("next_billing_date");
      expect(headers).toContain("currency");
      expect(headers).toContain("notify_days_before");
    });

    it("contains example row", () => {
      const rows = CSV_TEMPLATE.split("\n");
      expect(rows.length).toBeGreaterThan(1);
      expect(rows[1]).toContain("Netflix");
      expect(rows[1]).toContain("149000");
    });
  });
});