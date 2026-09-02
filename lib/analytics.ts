import type { Expense, Category, AppSettings } from "./types";
import { todayUTC, toISO } from "./date";
import { convertToBaseCurrency, type Currency } from "./currencies";
import { effectiveNextBillingDate, monthlyAmount } from "./recurring";

export interface MonthlyTrend {
  month: string;           // 'YYYY-MM'
  total: number;           // in baseCurrency
  byCategory: Map<string, number>;  // category_id -> amount in baseCurrency
}

export interface CategoryTrend {
  month: string;   // 'YYYY-MM'
  value: number;   // in baseCurrency
}

export interface PaymentRecord {
  id: string;
  expense_id: string;
  amount_paid: number;
  currency: Currency;
  paid_at: string;   // ISO date
  month_key: string; // 'YYYY-MM'
  created_at: string;
}

function monthKeyFromDate(date: Date): string {
  return toISO(date).slice(0, 7);
}

function getMonthsBack(monthsBack: number): string[] {
  const today = todayUTC();
  const months: string[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push(toISO(d).slice(0, 7));
  }
  return months;
}

export function computeMonthlyTrend(
  expenses: Expense[],
  payments: PaymentRecord[],
  baseCurrency: Currency,
  monthsBack = 12
): MonthlyTrend[] {
  const activeExpenses = expenses.filter((e) => e.status === "active");
  const expenseById = new Map(activeExpenses.map((e) => [e.id, e]));
  const categoryIds = [...new Set(activeExpenses.map((e) => e.category_id).filter(Boolean))];

  const months = getMonthsBack(monthsBack);

  const trend: MonthlyTrend[] = months.map((month) => ({
    month,
    total: 0,
    byCategory: new Map<string, number>(),
  }));

  for (const payment of payments) {
    const expense = expenseById.get(payment.expense_id);
    if (!expense) continue;

    const monthIndex = months.indexOf(payment.month_key);
    if (monthIndex === -1) continue;

    const converted = convertToBaseCurrency(payment.amount_paid, payment.currency, baseCurrency);

    const trendEntry = trend[monthIndex];
    trendEntry.total += converted;

    const catKey = expense.category_id ?? "__none__";
    trendEntry.byCategory.set(
      catKey,
      (trendEntry.byCategory.get(catKey) ?? 0) + converted
    );
  }

  return trend;
}

export function computeCategoryTrend(
  payments: PaymentRecord[],
  expenses: Expense[],
  categoryId: string | null,
  baseCurrency: Currency,
  monthsBack = 12
): CategoryTrend[] {
  const expenseById = new Map(expenses.map((e) => [e.id, e]));
  const months = getMonthsBack(monthsBack);

  const trend: CategoryTrend[] = months.map((month) => ({
    month,
    value: 0,
  }));

  for (const payment of payments) {
    const expense = expenseById.get(payment.expense_id);
    if (!expense) continue;
    if (expense.category_id !== categoryId) continue;

    const monthIndex = months.indexOf(payment.month_key);
    if (monthIndex === -1) continue;

    const converted = convertToBaseCurrency(payment.amount_paid, payment.currency, baseCurrency);
    trend[monthIndex].value += converted;
  }

  return trend;
}

export function getAvailableMonths(payments: PaymentRecord[]): string[] {
  const months = new Set(payments.map((p) => p.month_key));
  return [...months].sort();
}

export async function recordPayment(
  expenseId: string,
  amountPaid: number,
  currency: Currency,
  paidAt: Date,
  store: {
    addPaymentHistory: (input: {
      expense_id: string;
      amount_paid: number;
      currency: Currency;
      paid_at: string;
      month_key: string;
    }) => Promise<PaymentRecord>;
    updateExpense: (id: string, input: { status?: Expense["status"]; next_billing_date?: string; last_paid_date?: string }) => Promise<void>;
    getExpense: (id: string) => Expense | undefined;
  }
): Promise<void> {
  const expense = store.getExpense(expenseId);
  if (!expense) throw new Error("Expense not found");

  const monthKey = monthKeyFromDate(paidAt);
  const nextBillingDate = effectiveNextBillingDate(expense, paidAt);

  await store.addPaymentHistory({
    expense_id: expenseId,
    amount_paid: amountPaid,
    currency,
    paid_at: toISO(paidAt),
    month_key: monthKey,
  });

  await store.updateExpense(expenseId, {
    status: "active",
    next_billing_date: nextBillingDate,
    last_paid_date: toISO(paidAt),
  });
}