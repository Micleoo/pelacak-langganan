import type { AppSettings, Expense, Interval } from "./types";
import { parseISO, toISO, addInterval, todayUTC } from "./date";
import { convertToBaseCurrency, type Currency } from "./currencies";
import { NONE_CATEGORY_KEY } from "./constants";

export function monthlyAmount(amount: number, interval: Interval): number {
  switch (interval) {
    case "monthly":
      return amount;
    case "yearly":
      return amount / 12;
    case "quarterly":
      return amount / 3;
    case "weekly":
      return (amount * 52) / 12;
  }
}

export function monthlyAmountInBaseCurrency(
  expense: Pick<Expense, "amount" | "interval" | "currency">,
  baseCurrency: Currency = "IDR"
): number {
  const monthly = monthlyAmount(expense.amount, expense.interval);
  return convertToBaseCurrency(monthly, expense.currency as Currency, baseCurrency);
}

export function computeMonthlyCost(expenses: Expense[], baseCurrency: Currency = "IDR"): number {
  return expenses
    .filter((e) => e.status === "active")
    .reduce((sum, e) => sum + monthlyAmountInBaseCurrency(e, baseCurrency), 0);
}

export function computeCategoryBreakdown(
  expenses: Expense[],
  baseCurrency: Currency = "IDR"
): Map<string, number> {
  const breakdown = new Map<string, number>();
  for (const e of expenses.filter((e) => e.status === "active")) {
    const key = e.category_id ?? NONE_CATEGORY_KEY;
    breakdown.set(key, (breakdown.get(key) ?? 0) + monthlyAmountInBaseCurrency(e, baseCurrency));
  }
  return breakdown;
}

export function effectiveNextBillingDate(
  expense: Pick<Expense, "next_billing_date" | "interval">,
  today: Date,
): string {
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let date = parseISO(expense.next_billing_date);
  while (date < t) {
    date = addInterval(date, expense.interval);
  }
  return toISO(date);
}

export function wasAutoAdvanced(
  expense: Pick<Expense, "next_billing_date">,
  today: Date,
): boolean {
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return parseISO(expense.next_billing_date) < t;
}

export function isPaused(expense: Pick<Expense, "status">): boolean {
  return expense.status === "paused";
}

export function isOverdue(expense: Pick<Expense, "status" | "next_billing_date">, today: Date): boolean {
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return expense.status === "active" && parseISO(expense.next_billing_date) < t;
}

export function advanceOverdueExpense(expense: Expense, today: Date): Expense {
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const nextDate = effectiveNextBillingDate(expense, t);
  return {
    ...expense,
    status: "active",
    next_billing_date: nextDate,
    last_paid_date: toISO(t),
  };
}

export function resolveNotifyDays(
  expense: Pick<Expense, "notify_days_before">,
  settings: Pick<AppSettings, "default_notify_days_before">,
): number {
  return expense.notify_days_before ?? settings.default_notify_days_before;
}

export interface UpcomingItem {
  expense: Expense;
  effectiveDate: string;
  overdue: boolean;
  dueSoon: boolean;
}

export function buildUpcoming(
  expenses: Expense[],
  today: Date,
  resolveNotify: (expense: Expense) => number,
): UpcomingItem[] {
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const items = expenses
    .filter((e) => e.status === "active")
    .map((e) => {
      const effectiveDate = effectiveNextBillingDate(e, t);
      const notifyDays = resolveNotify(e);
      const days = Math.round(
        (parseISO(effectiveDate).getTime() - t.getTime()) / 86400000,
      );
      return {
        expense: e,
        effectiveDate,
        overdue: wasAutoAdvanced(e, t),
        dueSoon: days <= notifyDays,
      };
    });
  items.sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate));
  return items;
}