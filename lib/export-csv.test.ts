import { describe, expect, it } from "vitest";
import { generateCSVContent } from "./export-csv";
import type { Category, Expense } from "./types";

describe("generateCSVContent", () => {
  const categories: Category[] = [
    { id: "cat-1", name: "Streaming" },
    { id: "cat-2", name: "AI Tools" },
  ];

  const expenses: Expense[] = [
    {
      id: "1",
      name: "Netflix",
      amount: 186000,
      currency: "IDR",
      interval: "monthly",
      category_id: "cat-1",
      status: "active",
      next_billing_date: "2026-09-15",
      notify_days_before: 3,
      last_paid_date: "2026-08-15",
    },
    {
      id: "2",
      name: "ChatGPT Plus",
      amount: 20,
      currency: "USD",
      interval: "monthly",
      category_id: "cat-2",
      status: "paused",
      next_billing_date: "2026-09-20",
      notify_days_before: null,
      last_paid_date: null,
    },
    {
      id: "3",
      name: "Old Gym",
      amount: 500000,
      currency: "IDR",
      interval: "monthly",
      category_id: null,
      status: "overdue",
      next_billing_date: "2026-08-01",
      notify_days_before: 1,
      last_paid_date: null,
    },
    {
      id: "4",
      name: "Cancelled Sub",
      amount: 100000,
      currency: "IDR",
      interval: "monthly",
      category_id: null,
      status: "cancelled",
      next_billing_date: "2026-07-01",
      notify_days_before: null,
      last_paid_date: null,
    },
  ];

  it("generates valid CSV with header and correct currency & status mapping", () => {
    const csv = generateCSVContent(expenses, categories);
    const lines = csv.split("\r\n");

    expect(lines[0]).toBe(
      "Nama Layanan,Kategori,Mata Uang,Nominal Asli,Siklus Tagihan,Nominal Bulanan,Tanggal Tagihan Berikutnya,Status,Timing Pengingat (Hari)"
    );

    // Line 1: Netflix (Active -> "Aktif", IDR)
    expect(lines[1]).toContain('"Netflix","Streaming","IDR","186000","monthly","186000","2026-09-15","Aktif","H-3"');

    // Line 2: ChatGPT (Paused -> "Dijeda", USD)
    expect(lines[2]).toContain('"ChatGPT Plus","AI Tools","USD","20","monthly","20","2026-09-20","Dijeda","Global"');

    // Line 3: Old Gym (Overdue -> "Terlewat", No category -> "Tanpa kategori")
    expect(lines[3]).toContain('"Old Gym","Tanpa kategori","IDR","500000","monthly","500000","2026-08-01","Terlewat","H-1"');

    // Line 4: Cancelled Sub (Cancelled -> "Dibatalkan")
    expect(lines[4]).toContain('"Cancelled Sub","Tanpa kategori","IDR","100000","monthly","100000","2026-07-01","Dibatalkan","Global"');
  });

  it("escapes quotes properly", () => {
    const quoteExpense: Expense[] = [
      {
        id: "q1",
        name: 'Special "Pro" Plan',
        amount: 50000,
        currency: "IDR",
        interval: "monthly",
        category_id: null,
        status: "active",
        next_billing_date: "2026-09-01",
        notify_days_before: null,
        last_paid_date: null,
      },
    ];

    const csv = generateCSVContent(quoteExpense, []);
    expect(csv).toContain('""Pro""');
  });
});
