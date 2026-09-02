import type { Currency } from "./currencies";

export type Interval = "monthly" | "yearly" | "quarterly" | "weekly";

export type Status = "active" | "cancelled" | "paused" | "overdue";

export interface Category {
  id: string;
  name: string;
  created_at?: string;
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  interval: Interval;
  category_id: string | null;
  status: Status;
  next_billing_date: string;
  notify_days_before: number | null;
  last_paid_date: string | null;
  currency: Currency;
  created_at?: string;
}

export interface AppSettings {
  id?: string;
  default_notify_days_before: number;
  email_enabled: boolean;
  in_app_enabled: boolean;
  user_email: string | null;
  base_currency: Currency;
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