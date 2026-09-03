import type { AppSettings, Category, Expense, Interval } from "./types";
import { parseISO, toISO, addInterval, todayUTC } from "./date";
import { convertToBaseCurrency, type Currency } from "./currencies";
import { NONE_CATEGORY_KEY, NO_CATEGORY_LABEL } from "./constants";

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

export interface CategoryBreakdownItem {
  key: string;
  name: string;
  value: number;
  pct: number;
}

export interface InsightSummary {
  totalMonthlyCost: number;
  baseCurrency: Currency;
  breakdown: CategoryBreakdownItem[];
  upcoming: UpcomingItem[];
  notifyItems: UpcomingItem[];
  showBanner: boolean;
  overdueExpenses: Expense[];
  pausedExpenses: Expense[];
  activeExpenses: Expense[];
}

/**
 * Deep Module Seam: computeInsight
 * Menyerap seluruh orkestrasi ringkasan finansial:
 * - normalisasi multi-currency ke base currency
 * - filtrasi status active, overdue, paused
 * - agregasi breakdown kategori beserta persentase kontribusi
 * - resolusi jendela jatuh tempo & status notifikasi in-app
 */
export function computeInsight(
  expenses: Expense[],
  categories: Category[],
  settings: AppSettings | null,
  referenceDate: Date = new Date(),
): InsightSummary {
  const baseCurrency = (settings?.base_currency as Currency) ?? "IDR";
  const activeExpenses = expenses.filter((e) => e.status === "active");
  const overdueExpenses = expenses.filter((e) => e.status === "overdue");
  const pausedExpenses = expenses.filter((e) => e.status === "paused");

  const totalMonthlyCost = computeMonthlyCost(expenses, baseCurrency);

  const categoryMap = new Map<string, string>();
  for (const c of categories) {
    categoryMap.set(c.id, c.name);
  }

  const breakdownMap = computeCategoryBreakdown(expenses, baseCurrency);
  const breakdown: CategoryBreakdownItem[] = [...breakdownMap.entries()]
    .map(([key, value]) => ({
      key,
      name: key === NONE_CATEGORY_KEY ? NO_CATEGORY_LABEL : (categoryMap.get(key) ?? NO_CATEGORY_LABEL),
      value,
      pct: totalMonthlyCost > 0 ? (value / totalMonthlyCost) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);

  const fallbackSettings: Pick<AppSettings, "default_notify_days_before"> = {
    default_notify_days_before: settings?.default_notify_days_before ?? 3,
  };

  const upcoming = buildUpcoming(expenses, referenceDate, (e) =>
    resolveNotifyDays(e, settings ?? fallbackSettings),
  );

  const notifyItems = upcoming.filter((u) => u.overdue || u.dueSoon);
  const showBanner = Boolean(settings?.in_app_enabled) && notifyItems.length > 0;

  return {
    totalMonthlyCost,
    baseCurrency,
    breakdown,
    upcoming,
    notifyItems,
    showBanner,
    overdueExpenses,
    pausedExpenses,
    activeExpenses,
  };
}