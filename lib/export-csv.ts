import type { Category, Expense } from "./types";
import { monthlyAmount } from "./recurring";
import { NO_CATEGORY_LABEL } from "./constants";

export function generateCSVContent(expenses: Expense[], categories: Category[]): string {
  const categoryMap = new Map<string, string>();
  categories.forEach((c) => categoryMap.set(c.id, c.name));

  const headers = [
    "Nama Layanan",
    "Kategori",
    "Nominal Asli (IDR)",
    "Siklus Tagihan",
    "Nominal Bulanan (IDR)",
    "Tanggal Tagihan Berikutnya",
    "Status",
    "Timing Pengingat (Hari)",
  ];

  const escapeCSV = (str: string | number | null | undefined): string => {
    if (str === null || str === undefined) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = expenses.map((e) => {
    const catName = e.category_id ? categoryMap.get(e.category_id) ?? NO_CATEGORY_LABEL : NO_CATEGORY_LABEL;
    const monthlyVal = monthlyAmount(e.amount, e.interval);
    const notifyStr = e.notify_days_before !== null && e.notify_days_before !== undefined ? `H-${e.notify_days_before}` : "Global";

    return [
      escapeCSV(e.name),
      escapeCSV(catName),
      escapeCSV(e.amount),
      escapeCSV(e.interval),
      escapeCSV(monthlyVal),
      escapeCSV(e.next_billing_date),
      escapeCSV(e.status === "active" ? "Aktif" : "Dibatalkan"),
      escapeCSV(notifyStr),
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\r\n");
}

export function downloadCSV(filename: string, csvContent: string): void {
  // Gunakan UTF-8 BOM agar Excel dapat membuka karakter dengan benar
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportExpensesToCSV(expenses: Expense[], categories: Category[]): void {
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `pelacak-langganan-${dateStr}.csv`;
  const csvContent = generateCSVContent(expenses, categories);
  downloadCSV(filename, csvContent);
}
