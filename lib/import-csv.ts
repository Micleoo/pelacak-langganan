import type { Category, ExpenseInput } from "./data";
import type { Currency } from "./currencies";

export interface ParsedRow {
  [key: string]: string;
}

export interface ImportError {
  rowIndex: number;
  message: string;
  raw: ParsedRow;
}

export interface ImportResult {
  imported: number;
  skipped: number;
}

const REQUIRED_FIELDS = ["name", "amount", "interval", "next_billing_date"] as const;
const VALID_INTERVALS = ["monthly", "yearly", "quarterly", "weekly"] as const;
const VALID_STATUSES = ["active", "paused", "overdue", "cancelled"] as const;
const VALID_CURRENCIES = ["IDR", "USD", "EUR", "SGD"] as const;

export const CSV_TEMPLATE = `name,amount,interval,category,status,next_billing_date,currency,notify_days_before
Netflix,149000,monthly,Streaming,active,2026-10-01,IDR,3
Spotify,189000,yearly,Music,active,2026-12-01,IDR,3
`;

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());
  const rows: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    if (values.length !== headers.length) continue;

    const row: ParsedRow = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j];
    }
    rows.push(row);
  }

  return rows;
}

function getCategoryId(categoryName: string, existingCategories: Category[]): string | null {
  if (!categoryName) return null;
  const match = existingCategories.find(
    (c) => c.name.toLowerCase() === categoryName.toLowerCase()
  );
  return match?.id ?? null;
}

function validateAmount(value: string): { valid: boolean; amount?: number; error?: string } {
  const num = Number(value);
  if (isNaN(num)) return { valid: false, error: "Nominal harus berupa angka" };
  if (num <= 0) return { valid: false, error: "Nominal harus lebih dari 0" };
  if (!Number.isInteger(num)) return { valid: false, error: "Nominal harus bilangan bulat" };
  return { valid: true, amount: num };
}

function validateDate(value: string): { valid: boolean; error?: string } {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(value)) return { valid: false, error: "Format tanggal harus YYYY-MM-DD" };
  const date = new Date(value);
  if (isNaN(date.getTime())) return { valid: false, error: "Tanggal tidak valid" };
  return { valid: true };
}

export function validateRows(
  rows: ParsedRow[],
  existingCategories: Category[]
): { valid: ExpenseInput[]; errors: ImportError[] } {
  const valid: ExpenseInput[] = [];
  const errors: ImportError[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowErrors: string[] = [];

    // Check required fields
    for (const field of REQUIRED_FIELDS) {
      if (!row[field]?.trim()) {
        rowErrors.push(`Kolom "${field}" wajib diisi`);
      }
    }

    if (rowErrors.length > 0) {
      errors.push({ rowIndex: i + 2, message: rowErrors.join("; "), raw: row });
      continue;
    }

    // Validate amount
    const amountResult = validateAmount(row.amount);
    if (!amountResult.valid) {
      rowErrors.push(amountResult.error!);
    }

    // Validate interval
    if (!VALID_INTERVALS.includes(row.interval as typeof VALID_INTERVALS[number])) {
      rowErrors.push(`Interval harus salah satu: ${VALID_INTERVALS.join(", ")}`);
    }

    // Validate date
    const dateResult = validateDate(row.next_billing_date);
    if (!dateResult.valid) {
      rowErrors.push(dateResult.error!);
    }

    // Validate status (optional, default active)
    if (row.status && !VALID_STATUSES.includes(row.status as typeof VALID_STATUSES[number])) {
      rowErrors.push(`Status harus salah satu: ${VALID_STATUSES.join(", ")}`);
    }

    // Validate currency (optional, default IDR)
    if (row.currency && !VALID_CURRENCIES.includes(row.currency as typeof VALID_CURRENCIES[number])) {
      rowErrors.push(`Mata uang harus salah satu: ${VALID_CURRENCIES.join(", ")}`);
    }

    // Validate notify_days_before (optional)
    if (row.notify_days_before) {
      const notifyDays = Number(row.notify_days_before);
      if (isNaN(notifyDays) || notifyDays < 1 || notifyDays > 7) {
        rowErrors.push("notify_days_before harus angka 1-7");
      }
    }

    if (rowErrors.length > 0) {
      errors.push({ rowIndex: i + 2, message: rowErrors.join("; "), raw: row });
      continue;
    }

    // All valid - construct ExpenseInput
    const categoryId = getCategoryId(row.category || "", existingCategories);
    const isNewCategory = row.category && !categoryId;

    valid.push({
      name: row.name.trim(),
      amount: amountResult.amount!,
      interval: row.interval as ExpenseInput["interval"],
      category_id: categoryId,
      status: (row.status as ExpenseInput["status"]) || "active",
      next_billing_date: row.next_billing_date,
      notify_days_before: row.notify_days_before ? Number(row.notify_days_before) : null,
      last_paid_date: null,
      currency: (row.currency as Currency) || "IDR",
    });

    // If new category, we'll need to create it (handled by caller)
  }

  return { valid, errors };
}

export async function importExpenses(
  validRows: ExpenseInput[],
  store: {
    addExpense: (input: ExpenseInput) => Promise<{ id: string }>;
    addCategory: (input: { name: string }) => Promise<{ id: string }>;
    expenses: Array<{ id: string; name: string }>;
  }
): Promise<ImportResult> {
  let imported = 0;
  let skipped = 0;

  for (const row of validRows) {
    try {
      // If category_id is null but we have a category name that's new, we need to create it
      // This is handled by the caller - they should ensure categories exist first
      await store.addExpense(row);
      imported++;
    } catch (err) {
      console.error("Failed to import expense:", err);
      skipped++;
    }
  }

  return { imported, skipped };
}