import type { AppSettings, Expense, Interval } from "./types";

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

function parseDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addMonthsClamped(date: Date, months: number): Date {
  const day = date.getDate();
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, lastDay));
  return target;
}

function addInterval(date: Date, interval: Interval): Date {
  switch (interval) {
    case "weekly":
      return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7);
    case "monthly":
      return addMonthsClamped(date, 1);
    case "quarterly":
      return addMonthsClamped(date, 3);
    case "yearly":
      return addMonthsClamped(date, 12);
  }
}

export function effectiveNextBillingDate(
  expense: Pick<Expense, "next_billing_date" | "interval">,
  today: Date,
): string {
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let date = parseDate(expense.next_billing_date);
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
  return parseDate(expense.next_billing_date) < t;
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
        (parseDate(effectiveDate).getTime() - t.getTime()) / 86400000,
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