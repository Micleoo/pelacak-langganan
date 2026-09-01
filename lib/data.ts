import type { AppSettings, Category, Expense } from "./types";

export interface ExpenseInput {
  name: string;
  amount: number;
  interval: Expense["interval"];
  category_id: string | null;
  status: Expense["status"];
  next_billing_date: string;
  notify_days_before: number | null;
  last_paid_date: string | null;
  currency: string;
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
  addExpense(input: ExpenseInput): Promise<Expense>;
  updateExpense(id: string, input: ExpenseInput): Promise<void>;
  deleteExpense(id: string): Promise<void>;
  updateExpenseNotifyDays(id: string, notify_days_before: number | null): Promise<void>;
  advanceOverdueExpense(id: string, nextBillingDate: string, lastPaidDate: string): Promise<void>;
  addCategory(input: CategoryInput): Promise<Category>;
  renameCategory(id: string, name: string): Promise<void>;
  deleteCategory(id: string): Promise<void>;
  updateSettings(input: SettingsInput): Promise<AppSettings>;
}