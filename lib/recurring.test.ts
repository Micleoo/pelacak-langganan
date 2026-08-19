import { describe, expect, it } from "vitest";
import {
  buildUpcoming,
  effectiveNextBillingDate,
  monthlyAmount,
  resolveNotifyDays,
  wasAutoAdvanced,
} from "./recurring";
import type { AppSettings, Expense, Interval } from "./types";

const today = new Date(2026, 7, 19);

function expense(overrides: Partial<Expense>): Expense {
  return {
    id: "e1",
    name: "Netflix",
    amount: 150000,
    interval: "monthly",
    category_id: null,
    status: "active",
    next_billing_date: "2026-08-25",
    notify_days_before: null,
    ...overrides,
  };
}

describe("monthlyAmount", () => {
  it("returns the amount unchanged for monthly", () => {
    expect(monthlyAmount(150000, "monthly")).toBe(150000);
  });

  it("divides by 12 for yearly", () => {
    expect(monthlyAmount(1200000, "yearly")).toBe(100000);
  });

  it("divides by 3 for quarterly", () => {
    expect(monthlyAmount(300000, "quarterly")).toBe(100000);
  });

  it("uses 52/12 for weekly", () => {
    expect(monthlyAmount(50000, "weekly")).toBeCloseTo((50000 * 52) / 12, 5);
  });

  it("keeps intermediate values unrounded", () => {
    expect(Number.isInteger(monthlyAmount(1200000, "yearly"))).toBe(true);
    expect(Number.isInteger(monthlyAmount(100000, "yearly"))).toBe(false);
  });
});

describe("effectiveNextBillingDate", () => {
  it("leaves a future date unchanged", () => {
    expect(effectiveNextBillingDate(expense({ next_billing_date: "2026-09-10" }), today)).toBe("2026-09-10");
  });

  it("keeps a date equal to today unchanged", () => {
    expect(effectiveNextBillingDate(expense({ next_billing_date: "2026-08-19" }), today)).toBe("2026-08-19");
  });

  it("advances a monthly expense that is overdue, past today's day-of-month", () => {
    expect(effectiveNextBillingDate(expense({ next_billing_date: "2026-07-10" }), today)).toBe("2026-09-10");
  });

  it("advances multiple months when far overdue", () => {
    expect(effectiveNextBillingDate(expense({ next_billing_date: "2026-01-10" }), today)).toBe("2026-09-10");
  });

  it("advances quarterly by three months, past today", () => {
    expect(effectiveNextBillingDate(expense({ interval: "quarterly", next_billing_date: "2026-05-01" }), today)).toBe("2026-11-01");
  });

  it("advances weekly by seven days, past today", () => {
    expect(effectiveNextBillingDate(expense({ interval: "weekly", next_billing_date: "2026-08-10" }), today)).toBe("2026-08-24");
  });

  it("clamps end-of-month on yearly (leap day)", () => {
    expect(effectiveNextBillingDate(expense({ interval: "yearly", next_billing_date: "2024-02-29" }), new Date(2024, 11, 1))).toBe("2025-02-28");
  });
});

describe("wasAutoAdvanced", () => {
  it("is true when the persisted date is in the past", () => {
    expect(wasAutoAdvanced(expense({ next_billing_date: "2026-07-10" }), today)).toBe(true);
  });

  it("is false when due today or later", () => {
    expect(wasAutoAdvanced(expense({ next_billing_date: "2026-08-19" }), today)).toBe(false);
    expect(wasAutoAdvanced(expense({ next_billing_date: "2026-09-01" }), today)).toBe(false);
  });
});

describe("resolveNotifyDays", () => {
  const settings: Pick<AppSettings, "default_notify_days_before"> = {
    default_notify_days_before: 3,
  };

  it("uses the per-expense override when set", () => {
    expect(resolveNotifyDays(expense({ notify_days_before: 7 }), settings)).toBe(7);
  });

  it("falls back to the global default when null", () => {
    expect(resolveNotifyDays(expense({ notify_days_before: null }), settings)).toBe(3);
  });
});

describe("buildUpcoming", () => {
  const resolve = (e: Expense) => e.notify_days_before ?? 3;

  it("excludes cancelled expenses", () => {
    const items = buildUpcoming(
      [expense({ status: "cancelled" }), expense({ id: "e2", status: "active", next_billing_date: "2026-08-25" })],
      today,
      resolve,
    );
    expect(items).toHaveLength(1);
  });

  it("flags an overdue expense", () => {
    const items = buildUpcoming([expense({ next_billing_date: "2026-07-10" })], today, resolve);
    expect(items[0].overdue).toBe(true);
  });

  it("flags an expense within the notify window as due soon", () => {
    const items = buildUpcoming([expense({ next_billing_date: "2026-08-20" })], today, resolve);
    expect(items[0].dueSoon).toBe(true);
  });

  it("sorts by effective date ascending", () => {
    const items = buildUpcoming(
      [
        expense({ id: "late", next_billing_date: "2026-09-05" }),
        expense({ id: "early", next_billing_date: "2026-08-25" }),
      ],
      today,
      resolve,
    );
    expect(items.map((i) => i.expense.id)).toEqual(["early", "late"]);
  });
});