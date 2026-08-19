export type Interval = "monthly" | "yearly" | "quarterly" | "weekly";

export type Status = "active" | "cancelled";

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
  created_at?: string;
}

export interface AppSettings {
  id?: string;
  default_notify_days_before: number;
  email_enabled: boolean;
  in_app_enabled: boolean;
}