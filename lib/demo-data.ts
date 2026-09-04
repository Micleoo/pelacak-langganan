import type { Expense, Category, AppSettings, PaymentRecord } from "./types";

export const DEMO_CATEGORIES: Category[] = [
  { id: "demo-cat-streaming", name: "Streaming" },
  { id: "demo-cat-ai", name: "AI Tools" },
  { id: "demo-cat-utilitas", name: "Utilitas" },
  { id: "demo-cat-fitness", name: "Fitness" },
];

export const DEMO_SETTINGS: AppSettings = {
  id: "demo-settings",
  base_currency: "IDR",
  default_notify_days_before: 3,
  email_enabled: true,
  in_app_enabled: true,
  user_email: "demo@pelacak-langganan.app",
};

// Generate realistic next billing dates relative to today
const now = new Date();
const fmtDate = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 86400000);

export const DEMO_EXPENSES: Expense[] = [
  {
    id: "demo-exp-1",
    name: "Netflix Premium",
    amount: 186000,
    currency: "IDR",
    interval: "monthly",
    category_id: "demo-cat-streaming",
    status: "active",
    next_billing_date: fmtDate(addDays(now, 2)), // 2 days from now (Besok lusa)
    notify_days_before: 3,
    last_paid_date: fmtDate(addDays(now, -28)),
    created_at: fmtDate(addDays(now, -90)),
  },
  {
    id: "demo-exp-2",
    name: "Spotify Individual",
    amount: 54990,
    currency: "IDR",
    interval: "monthly",
    category_id: "demo-cat-streaming",
    status: "active",
    next_billing_date: fmtDate(addDays(now, 5)), // 5 days from now
    notify_days_before: 3,
    last_paid_date: fmtDate(addDays(now, -25)),
    created_at: fmtDate(addDays(now, -90)),
  },
  {
    id: "demo-exp-3",
    name: "ChatGPT Plus",
    amount: 20,
    currency: "USD",
    interval: "monthly",
    category_id: "demo-cat-ai",
    status: "active",
    next_billing_date: fmtDate(addDays(now, 12)), // 12 days from now
    notify_days_before: 3,
    last_paid_date: fmtDate(addDays(now, -18)),
    created_at: fmtDate(addDays(now, -120)),
  },
  {
    id: "demo-exp-4",
    name: "Midjourney Pro",
    amount: 10,
    currency: "USD",
    interval: "monthly",
    category_id: "demo-cat-ai",
    status: "active",
    next_billing_date: fmtDate(addDays(now, 19)),
    notify_days_before: 3,
    last_paid_date: fmtDate(addDays(now, -11)),
    created_at: fmtDate(addDays(now, -60)),
  },
  {
    id: "demo-exp-5",
    name: "IndiHome Fiber 50Mbps",
    amount: 375000,
    currency: "IDR",
    interval: "monthly",
    category_id: "demo-cat-utilitas",
    status: "overdue", // Tagihan tertunggak untuk demo alert
    next_billing_date: fmtDate(addDays(now, -2)), // 2 days ago
    notify_days_before: 3,
    last_paid_date: fmtDate(addDays(now, -32)),
    created_at: fmtDate(addDays(now, -180)),
  },
  {
    id: "demo-exp-6",
    name: "Mega Gym All Club",
    amount: 450000,
    currency: "IDR",
    interval: "monthly",
    category_id: "demo-cat-fitness",
    status: "paused", // Dijeda sementara untuk demo fitur jeda
    next_billing_date: fmtDate(addDays(now, 15)),
    notify_days_before: 3,
    last_paid_date: fmtDate(addDays(now, -45)),
    created_at: fmtDate(addDays(now, -150)),
  },
];

// Generate 6 months of historical payment data for charts
export function getDemoPaymentHistory(): PaymentRecord[] {
  const history: PaymentRecord[] = [];
  const months = 6;

  for (let i = months; i >= 1; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 15);
    const monthKey = d.toISOString().slice(0, 7);
    const paidAt = d.toISOString().slice(0, 10);
    const createdAt = d.toISOString();

    // Netflix
    history.push({
      id: `demo-pay-netflix-${monthKey}`,
      expense_id: "demo-exp-1",
      amount_paid: 186000,
      currency: "IDR",
      paid_at: paidAt,
      month_key: monthKey,
      created_at: createdAt,
    });

    // Spotify
    history.push({
      id: `demo-pay-spotify-${monthKey}`,
      expense_id: "demo-exp-2",
      amount_paid: 54990,
      currency: "IDR",
      paid_at: paidAt,
      month_key: monthKey,
      created_at: createdAt,
    });

    // ChatGPT Plus
    history.push({
      id: `demo-pay-chatgpt-${monthKey}`,
      expense_id: "demo-exp-3",
      amount_paid: 20,
      currency: "USD",
      paid_at: paidAt,
      month_key: monthKey,
      created_at: createdAt,
    });

    // IndiHome
    if (i > 1) {
      history.push({
        id: `demo-pay-indihome-${monthKey}`,
        expense_id: "demo-exp-5",
        amount_paid: 375000,
        currency: "IDR",
        paid_at: paidAt,
        month_key: monthKey,
        created_at: createdAt,
      });
    }
  }

  return history;
}
