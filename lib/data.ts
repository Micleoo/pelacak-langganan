import type { AppSettings, Category, Expense } from "./types";

export type { Category };
import type { Currency } from "./currencies";

export interface PaymentHistoryInput {
  expense_id: string;
  amount_paid: number;
  currency: Currency;
  paid_at: string;
  month_key: string;
}

export interface PaymentRecord {
  id: string;
  expense_id: string;
  amount_paid: number;
  currency: Currency;
  paid_at: string;
  month_key: string;
  created_at: string;
}

export interface ExpenseInput {
  name: string;
  amount: number;
  interval: Expense["interval"];
  category_id: string | null;
  status: Expense["status"];
  next_billing_date: string;
  notify_days_before: number | null;
  last_paid_date: string | null;
  currency: Currency;
}

export interface ExpenseUpdateInput {
  name?: string;
  amount?: number;
  interval?: Expense["interval"];
  category_id?: string | null;
  status?: Expense["status"];
  next_billing_date?: string;
  notify_days_before?: number | null;
  last_paid_date?: string | null;
  currency?: Currency;
}

export interface CategoryInput {
  name: string;
}

export interface SettingsInput {
  default_notify_days_before: number;
  email_enabled: boolean;
  in_app_enabled: boolean;
  user_email: string | null;
  base_currency: string;
}

export interface DataStore {
  expenses: Expense[];
  categories: Category[];
  settings: AppSettings;
  paymentHistory: PaymentRecord[];
  addExpense(input: ExpenseInput): Promise<Expense>;
  updateExpense(id: string, input: ExpenseUpdateInput): Promise<void>;
  deleteExpense(id: string): Promise<void>;
  updateExpenseNotifyDays(id: string, notify_days_before: number | null): Promise<void>;
  advanceOverdueExpense(id: string, nextBillingDate: string, lastPaidDate: string): Promise<void>;
  addCategory(input: CategoryInput): Promise<Category>;
  renameCategory(id: string, name: string): Promise<void>;
  deleteCategory(id: string): Promise<void>;
  updateSettings(input: SettingsInput): Promise<AppSettings>;
  fetchPaymentHistory(): Promise<PaymentRecord[]>;
  addPaymentHistory(input: PaymentHistoryInput): Promise<PaymentRecord>;
}