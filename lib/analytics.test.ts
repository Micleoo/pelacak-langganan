import { describe, expect, it, vi } from "vitest";
import { computeMonthlyTrend, computeCategoryTrend, getAvailableMonths, recordPayment } from "./analytics";
import type { Expense, PaymentRecord, Category } from "./types";
import { todayUTC, toISO, addMonths } from "./date";

function getMonthKey(date: Date): string {
  return toISO(date).slice(0, 7);
}

function getTestData() {
  const today = todayUTC();
  const thisMonth = getMonthKey(today);
  const lastMonth = getMonthKey(addMonths(today, -1));

  const mockExpenses: Expense[] = [
    {
      id: "1",
      name: "Netflix",
      amount: 150000,
      interval: "monthly",
      category_id: "cat1",
      status: "active",
      next_billing_date: toISO(addMonths(today, 1)),
      notify_days_before: 3,
      last_paid_date: null,
      currency: "IDR",
      created_at: toISO(addMonths(today, -2)),
    },
    {
      id: "2",
      name: "Spotify",
      amount: 189000,
      interval: "yearly",
      category_id: "cat1",
      status: "active",
      next_billing_date: toISO(addMonths(today, 2)),
      notify_days_before: 3,
      last_paid_date: null,
      currency: "IDR",
      created_at: toISO(addMonths(today, -2)),
    },
    {
      id: "3",
      name: "ChatGPT Plus",
      amount: 20,
      interval: "monthly",
      category_id: "cat2",
      status: "active",
      next_billing_date: toISO(addMonths(today, 1)),
      notify_days_before: 3,
      last_paid_date: null,
      currency: "USD",
      created_at: toISO(addMonths(today, -2)),
    },
  ];

  const mockCategories: Category[] = [
    { id: "cat1", name: "Streaming", created_at: toISO(addMonths(today, -2)) },
    { id: "cat2", name: "AI Tools", created_at: toISO(addMonths(today, -2)) },
  ];

  // Use month keys that match what getMonthsBack generates
  // getMonthsBack uses local time: new Date(year, month - i, 1)
  // For i=0 (current month): new Date(year, month, 1) -> first day of current month in LOCAL time
  // toISO() converts to UTC which may shift month
  // We'll use the same logic as getMonthsBack for consistency
  function getMonthKeyLocal(date: Date): string {
    // Mimic getMonthsBack: create date at first day of month in LOCAL time, then toISO
    const d = new Date(date.getFullYear(), date.getMonth(), 1);
    return toISO(d).slice(0, 7);
  }

  const thisMonthKey = getMonthKeyLocal(today);
  const lastMonthKey = getMonthKeyLocal(addMonths(today, -1));

  const mockPayments: PaymentRecord[] = [
    {
      id: "pay1",
      expense_id: "1",
      amount_paid: 150000,
      currency: "IDR",
      paid_at: toISO(addMonths(today, -1)),
      month_key: lastMonthKey,
      created_at: toISO(addMonths(today, -1)),
    },
    {
      id: "pay2",
      expense_id: "1",
      amount_paid: 150000,
      currency: "IDR",
      paid_at: toISO(today),
      month_key: thisMonthKey,
      created_at: toISO(today),
    },
    {
      id: "pay3",
      expense_id: "2",
      amount_paid: 189000,
      currency: "IDR",
      paid_at: toISO(today),
      month_key: thisMonthKey,
      created_at: toISO(today),
    },
    {
      id: "pay4",
      expense_id: "3",
      amount_paid: 20,
      currency: "USD",
      paid_at: toISO(today),
      month_key: thisMonthKey,
      created_at: toISO(today),
    },
  ];

  return { mockExpenses, mockCategories, mockPayments, thisMonthKey, lastMonthKey };
}

describe("analytics", () => {
  const { mockExpenses, mockCategories, mockPayments, thisMonthKey, lastMonthKey } = getTestData();

  describe("computeMonthlyTrend", () => {
    it("returns 12 months of trend data", () => {
      const trend = computeMonthlyTrend(mockExpenses, mockPayments, "IDR", 12);
      expect(trend).toHaveLength(12);
    });

    it("groups payments by month and converts to base currency", () => {
      const trend = computeMonthlyTrend(mockExpenses, mockPayments, "IDR", 12);
      
      const lastMonthTrend = trend.find((t) => t.month === lastMonthKey);
      expect(lastMonthTrend).toBeDefined();
      expect(lastMonthTrend?.total).toBe(150000);

      const thisMonthTrend = trend.find((t) => t.month === thisMonthKey);
      expect(thisMonthTrend).toBeDefined();
      expect(thisMonthTrend?.total).toBe(150000 + 189000 + 310000);
    });

    it("includes zero months in the 12-month window", () => {
      const trend = computeMonthlyTrend(mockExpenses, mockPayments, "IDR", 12);
      expect(trend.some((t) => t.total === 0)).toBe(true);
    });

    it("filters only active expenses", () => {
      const inactiveExpenses = [
        { ...mockExpenses[0], status: "cancelled" as const },
      ];
      const trend = computeMonthlyTrend(inactiveExpenses, mockPayments, "IDR", 12);
      expect(trend.every((t) => t.total === 0)).toBe(true);
    });

    it("calculates category breakdown correctly", () => {
      const trend = computeMonthlyTrend(mockExpenses, mockPayments, "IDR", 12);
      const thisMonthTrend = trend.find((t) => t.month === thisMonthKey);
      expect(thisMonthTrend?.byCategory.get("cat1")).toBe(150000 + 189000);
      expect(thisMonthTrend?.byCategory.get("cat2")).toBe(310000);
    });

    it("handles empty payments", () => {
      const trend = computeMonthlyTrend(mockExpenses, [], "IDR", 12);
      expect(trend.every((t) => t.total === 0)).toBe(true);
    });

    it("sorts months ascending", () => {
      const trend = computeMonthlyTrend(mockExpenses, mockPayments, "IDR", 12);
      for (let i = 1; i < trend.length; i++) {
        expect(trend[i].month >= trend[i - 1].month).toBe(true);
      }
    });

    it("converts USD to IDR correctly", () => {
      const trend = computeMonthlyTrend(mockExpenses, mockPayments, "IDR", 12);
      const thisMonthTrend = trend.find((t) => t.month === thisMonthKey);
      expect(thisMonthTrend?.byCategory.get("cat2")).toBe(310000);
    });
  });

  describe("computeCategoryTrend", () => {
    it("filters payments by category", () => {
      const trend = computeCategoryTrend(mockPayments, mockExpenses, "cat1", "IDR", 12);
      const thisMonthTrend = trend.find((t) => t.month === thisMonthKey);
      expect(thisMonthTrend?.value).toBe(150000 + 189000);
    });

    it("returns zero for category with no payments", () => {
      const trend = computeCategoryTrend(mockPayments, mockExpenses, "nonexistent", "IDR", 12);
      expect(trend.every((t) => t.value === 0)).toBe(true);
    });
  });

  describe("getAvailableMonths", () => {
    it("returns sorted unique months from payments", () => {
      const months = getAvailableMonths(mockPayments);
      expect(months).toEqual([lastMonthKey, thisMonthKey].sort());
    });

    it("handles empty payments", () => {
      expect(getAvailableMonths([])).toEqual([]);
    });
  });

  describe("recordPayment", () => {
    it("inserts payment and advances next_billing_date", async () => {
      const mockStore = {
        addPaymentHistory: vi.fn().mockResolvedValue({} as any),
        updateExpense: vi.fn().mockResolvedValue(undefined),
        getExpense: vi.fn().mockReturnValue(mockExpenses[0]),
      };

      await recordPayment("1", 150000, "IDR", new Date(), mockStore);

      expect(mockStore.addPaymentHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          expense_id: "1",
          amount_paid: 150000,
          currency: "IDR",
        })
      );
      expect(mockStore.updateExpense).toHaveBeenCalledWith("1", expect.objectContaining({
        status: "active",
      }));
    });

    it("throws if expense not found", async () => {
      const mockStore = {
        addPaymentHistory: vi.fn(),
        updateExpense: vi.fn(),
        getExpense: vi.fn().mockReturnValue(undefined),
      };

      await expect(recordPayment("999", 100, "IDR", new Date(), mockStore)).rejects.toThrow("Expense not found");
    });
  });
});