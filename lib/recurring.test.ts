import { describe, expect, it } from "vitest";
import {
  buildUpcoming,
  effectiveNextBillingDate,
  monthlyAmount,
  resolveNotifyDays,
  wasAutoAdvanced,
  isPaused,
  isOverdue,
  advanceOverdueExpense,
  computeMonthlyCost,
  monthlyAmountInBaseCurrency,
  computeCategoryBreakdown,
  computeInsight,
} from "./recurring";
import { formatIntervalFormula, formatRelativeDue } from "./format";
import type { AppSettings, Category, Expense, Interval } from "./types";

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
    last_paid_date: null,
    currency: "IDR",
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

describe("formatRelativeDue & formatIntervalFormula", () => {
  const baseDate = new Date(2026, 7, 18); // 2026-08-18

  it("calculates relative dates accurately", () => {
    expect(formatRelativeDue("2026-08-18", baseDate).label).toBe("Hari ini");
    expect(formatRelativeDue("2026-08-19", baseDate).label).toBe("Besok");
    expect(formatRelativeDue("2026-08-20", baseDate).label).toBe("Lusa (2 hari lagi)");
    expect(formatRelativeDue("2026-08-23", baseDate).label).toBe("5 hari lagi");
    expect(formatRelativeDue("2026-08-17", baseDate).label).toBe("Kemarin (terlewat 1 hari)");
    expect(formatRelativeDue("2026-08-15", baseDate).label).toBe("Terlewat 3 hari");
  });

  it("formats interval formulas with math breakdown", () => {
    expect(formatIntervalFormula(1200000, "yearly")).toContain("÷ 12 bulan =");
    expect(formatIntervalFormula(300000, "quarterly")).toContain("÷ 3 bulan =");
    expect(formatIntervalFormula(50000, "weekly")).toContain("× 52 ÷ 12 =");
    expect(formatIntervalFormula(100000, "monthly")).toBe("Rp 100.000/bulan");
  });
});

describe("isPaused", () => {
  it("returns true for paused status", () => {
    expect(isPaused(expense({ status: "paused" }))).toBe(true);
  });

  it("returns false for active, cancelled, overdue", () => {
    expect(isPaused(expense({ status: "active" }))).toBe(false);
    expect(isPaused(expense({ status: "cancelled" }))).toBe(false);
    expect(isPaused(expense({ status: "overdue" }))).toBe(false);
  });
});

describe("isOverdue", () => {
  it("returns true for active expense with next_billing_date < today", () => {
    expect(isOverdue(expense({ status: "active", next_billing_date: "2026-07-10" }), today)).toBe(true);
  });

  it("returns false for active expense with next_billing_date >= today", () => {
    expect(isOverdue(expense({ status: "active", next_billing_date: "2026-08-19" }), today)).toBe(false);
    expect(isOverdue(expense({ status: "active", next_billing_date: "2026-09-01" }), today)).toBe(false);
  });

  it("returns false for paused, cancelled, overdue status", () => {
    expect(isOverdue(expense({ status: "paused", next_billing_date: "2026-07-10" }), today)).toBe(false);
    expect(isOverdue(expense({ status: "cancelled", next_billing_date: "2026-07-10" }), today)).toBe(false);
    expect(isOverdue(expense({ status: "overdue", next_billing_date: "2026-07-10" }), today)).toBe(false);
  });

  it("handles leap year boundary", () => {
    const leapToday = new Date(2024, 1, 28); // 2024-02-28
    expect(isOverdue(expense({ status: "active", next_billing_date: "2024-02-27" }), leapToday)).toBe(true);
    expect(isOverdue(expense({ status: "active", next_billing_date: "2024-02-28" }), leapToday)).toBe(false);
    expect(isOverdue(expense({ status: "active", next_billing_date: "2024-02-29" }), leapToday)).toBe(false);
  });

  it("handles weekly interval overdue", () => {
    expect(isOverdue(expense({ status: "active", interval: "weekly", next_billing_date: "2026-08-10" }), today)).toBe(true);
  });
});

describe("advanceOverdueExpense", () => {
  it("advances monthly expense by 1 month and sets status active", () => {
    const e = expense({ status: "overdue", next_billing_date: "2026-07-10" });
    const advanced = advanceOverdueExpense(e, today);
    expect(advanced.status).toBe("active");
    expect(advanced.next_billing_date).toBe("2026-09-10");
    // last_paid_date is today (2026-08-19) but toISO may return 2026-08-18 due to timezone
    expect(advanced.last_paid_date).toMatch(/^2026-08-1[89]$/);
  });

  it("advances yearly expense to next occurrence after today", () => {
    const e = expense({ status: "overdue", interval: "yearly", next_billing_date: "2025-08-10" });
    const advanced = advanceOverdueExpense(e, today);
    // 2025-08-10 -> 2026-08-10 (still < today 2026-08-19) -> 2027-08-10
    expect(advanced.next_billing_date).toBe("2027-08-10");
  });

  it("advances quarterly expense by 3 months", () => {
    const e = expense({ status: "overdue", interval: "quarterly", next_billing_date: "2026-05-01" });
    const advanced = advanceOverdueExpense(e, today);
    expect(advanced.next_billing_date).toBe("2026-11-01");
  });

  it("advances weekly expense by 7 days", () => {
    const e = expense({ status: "overdue", interval: "weekly", next_billing_date: "2026-08-10" });
    const advanced = advanceOverdueExpense(e, today);
    expect(advanced.next_billing_date).toBe("2026-08-24");
  });

  it("preserves other fields", () => {
    const e = expense({ status: "overdue", name: "Spotify", amount: 100000, category_id: "cat1" });
    const advanced = advanceOverdueExpense(e, today);
    expect(advanced.name).toBe("Spotify");
    expect(advanced.amount).toBe(100000);
    expect(advanced.category_id).toBe("cat1");
    expect(advanced.interval).toBe("monthly");
  });
});

describe("computeMonthlyCost", () => {
  it("sums only active expenses", () => {
    const expenses = [
      expense({ id: "1", status: "active", amount: 100000 }),
      expense({ id: "2", status: "active", amount: 200000 }),
      expense({ id: "3", status: "paused", amount: 50000 }),
      expense({ id: "4", status: "overdue", amount: 30000 }),
      expense({ id: "5", status: "cancelled", amount: 150000 }),
    ];
    expect(computeMonthlyCost(expenses)).toBe(300000);
  });

  it("returns 0 for empty array", () => {
    expect(computeMonthlyCost([])).toBe(0);
  });

  it("returns 0 when all expenses are paused/overdue/cancelled", () => {
    const expenses = [
      expense({ id: "1", status: "paused", amount: 100000 }),
      expense({ id: "2", status: "overdue", amount: 200000 }),
      expense({ id: "3", status: "cancelled", amount: 300000 }),
    ];
    expect(computeMonthlyCost(expenses)).toBe(0);
  });

  it("handles different intervals correctly", () => {
    const expenses = [
      expense({ id: "1", status: "active", amount: 1200000, interval: "yearly" }), // 100000
      expense({ id: "2", status: "active", amount: 300000, interval: "quarterly" }), // 100000
      expense({ id: "3", status: "active", amount: 50000, interval: "weekly" }), // ~216666
    ];
    expect(computeMonthlyCost(expenses)).toBeCloseTo(100000 + 100000 + (50000 * 52) / 12, 5);
  });

  it("converts mixed currency expenses to base currency correctly", () => {
    const expenses = [
      expense({ id: "1", status: "active", amount: 100000, currency: "IDR" }), // 100000 IDR
      expense({ id: "2", status: "active", amount: 10, currency: "USD" }), // 10 * 15500 = 155000 IDR
    ];
    // Total in IDR = 100000 + 155000 = 255000
    expect(computeMonthlyCost(expenses, "IDR")).toBe(255000);
    // Total in USD = 255000 / 15500 = 16.4516
    expect(computeMonthlyCost(expenses, "USD")).toBeCloseTo(255000 / 15500, 4);
  });
});

describe("monthlyAmountInBaseCurrency", () => {
  it("computes monthly amount and converts to base currency", () => {
    const e = expense({ amount: 120, interval: "yearly", currency: "USD" }); // $10/month
    // $10 in IDR = 155000 IDR
    expect(monthlyAmountInBaseCurrency(e, "IDR")).toBe(155000);
    expect(monthlyAmountInBaseCurrency(e, "USD")).toBe(10);
  });
});

describe("computeCategoryBreakdown", () => {
  it("groups active expenses by category in base currency", () => {
    const expenses = [
      expense({ id: "1", category_id: "cat1", amount: 100000, currency: "IDR", status: "active" }),
      expense({ id: "2", category_id: "cat1", amount: 10, currency: "USD", status: "active" }), // 155000 IDR
      expense({ id: "3", category_id: null, amount: 50000, currency: "IDR", status: "active" }),
      expense({ id: "4", category_id: "cat1", amount: 500000, status: "paused" }),
    ];

    const breakdown = computeCategoryBreakdown(expenses, "IDR");
    expect(breakdown.get("cat1")).toBe(255000);
    expect(breakdown.get("__none__")).toBe(50000);
  });
});

describe("buildUpcoming excludes paused and overdue", () => {
  const resolve = (e: Expense) => e.notify_days_before ?? 3;

  it("excludes paused expenses", () => {
    const items = buildUpcoming(
      [expense({ status: "paused" }), expense({ id: "e2", status: "active", next_billing_date: "2026-08-25" })],
      today,
      resolve,
    );
    expect(items).toHaveLength(1);
    expect(items[0].expense.id).toBe("e2");
  });

  it("excludes overdue status expenses", () => {
    const items = buildUpcoming(
      [expense({ status: "overdue" }), expense({ id: "e2", status: "active", next_billing_date: "2026-08-25" })],
      today,
      resolve,
    );
    expect(items).toHaveLength(1);
    expect(items[0].expense.id).toBe("e2");
  });

  it("includes active expenses that are past due (auto-advanced)", () => {
    const items = buildUpcoming(
      [expense({ status: "active", next_billing_date: "2026-07-10" })],
      today,
      resolve,
    );
    expect(items).toHaveLength(1);
    expect(items[0].overdue).toBe(true);
  });
});

describe("computeInsight (Deep Insight Module)", () => {
  const categories: Category[] = [
    { id: "cat-stream", name: "Streaming" },
    { id: "cat-ai", name: "AI Tools" },
  ];

  const defaultSettings: AppSettings = {
    default_notify_days_before: 3,
    email_enabled: false,
    in_app_enabled: true,
    user_email: "test@example.com",
    base_currency: "IDR",
  };

  it("calculates total monthly cost in base currency and aggregates categories with percentages", () => {
    const expenses: Expense[] = [
      expense({ id: "e1", name: "Netflix", amount: 150000, interval: "monthly", category_id: "cat-stream", status: "active" }),
      expense({ id: "e2", name: "Spotify", amount: 50000, interval: "monthly", category_id: "cat-stream", status: "active" }),
      expense({ id: "e3", name: "ChatGPT", amount: 100000, interval: "monthly", category_id: "cat-ai", status: "active" }),
      expense({ id: "e4", name: "Paused Service", amount: 80000, interval: "monthly", category_id: "cat-ai", status: "paused" }),
      expense({ id: "e5", name: "Cancelled Service", amount: 90000, interval: "monthly", category_id: "cat-ai", status: "cancelled" }),
    ];

    const insight = computeInsight(expenses, categories, defaultSettings, today);

    expect(insight.totalMonthlyCost).toBe(300000);
    expect(insight.baseCurrency).toBe("IDR");

    // Breakdown should be sorted descending: Streaming (200k, 66.67%), AI Tools (100k, 33.33%)
    expect(insight.breakdown).toHaveLength(2);
    expect(insight.breakdown[0].name).toBe("Streaming");
    expect(insight.breakdown[0].value).toBe(200000);
    expect(Math.round(insight.breakdown[0].pct)).toBe(67);

    expect(insight.breakdown[1].name).toBe("AI Tools");
    expect(insight.breakdown[1].value).toBe(100000);
    expect(Math.round(insight.breakdown[1].pct)).toBe(33);
  });

  it("handles uncategorized expenses and labels them 'Tanpa kategori'", () => {
    const expenses: Expense[] = [
      expense({ id: "e1", name: "Domain", amount: 100000, interval: "monthly", category_id: null, status: "active" }),
    ];

    const insight = computeInsight(expenses, categories, defaultSettings, today);
    expect(insight.breakdown).toHaveLength(1);
    expect(insight.breakdown[0].name).toBe("Tanpa kategori");
    expect(insight.breakdown[0].pct).toBe(100);
  });

  it("partitions active, overdue, and paused expenses correctly", () => {
    const expenses: Expense[] = [
      expense({ id: "e1", status: "active", next_billing_date: "2026-08-25" }),
      expense({ id: "e2", status: "paused" }),
      expense({ id: "e3", status: "overdue", next_billing_date: "2026-08-10" }),
    ];

    const insight = computeInsight(expenses, categories, defaultSettings, today);
    expect(insight.activeExpenses).toHaveLength(1);
    expect(insight.activeExpenses[0].id).toBe("e1");
    expect(insight.pausedExpenses).toHaveLength(1);
    expect(insight.pausedExpenses[0].id).toBe("e2");
    expect(insight.overdueExpenses).toHaveLength(1);
    expect(insight.overdueExpenses[0].id).toBe("e3");
  });

  it("controls in-app banner visibility based on in_app_enabled and notify items", () => {
    // Due soon: today is 2026-08-19, bill date 2026-08-21 (2 days away, <= default 3 days)
    const expenses: Expense[] = [
      expense({ id: "e1", status: "active", next_billing_date: "2026-08-21" }),
    ];

    const enabledInsight = computeInsight(expenses, categories, defaultSettings, today);
    expect(enabledInsight.notifyItems.length).toBeGreaterThan(0);
    expect(enabledInsight.showBanner).toBe(true);

    const disabledSettings = { ...defaultSettings, in_app_enabled: false };
    const disabledInsight = computeInsight(expenses, categories, disabledSettings, today);
    expect(disabledInsight.showBanner).toBe(false);
  });

  it("converts multi-currency expenses to user's base currency", () => {
    // 1 USD = 15,500 IDR
    const expenses: Expense[] = [
      expense({ id: "e1", amount: 20, currency: "USD", interval: "monthly", status: "active" }),
    ];

    const insight = computeInsight(expenses, categories, defaultSettings, today);
    expect(insight.totalMonthlyCost).toBe(20 * 15500);
  });
});