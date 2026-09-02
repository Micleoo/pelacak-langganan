import { formatCurrency, formatCurrencyMonthly, type Currency } from "./currencies";

export function formatIDR(amount: number): string {
  return formatCurrency(amount, "IDR");
}

export function formatIDRMonthly(amount: number): string {
  return formatCurrencyMonthly(amount, "IDR");
}

export function formatAmount(amount: number, currency: Currency | string): string {
  return formatCurrency(amount, currency);
}

export function formatAmountMonthly(amount: number, currency: Currency | string): string {
  return formatCurrencyMonthly(amount, currency);
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
}

export function formatRelativeDue(
  targetDateInput: string | Date,
  baseDateInput: Date = new Date()
): {
  label: string;
  diffDays: number;
  isOverdue: boolean;
  isToday: boolean;
  isSoon: boolean;
} {
  let targetDate: Date;
  if (typeof targetDateInput === "string") {
    const [y, m, d] = targetDateInput.split("-").map(Number);
    targetDate = new Date(y, m - 1, d);
  } else {
    targetDate = new Date(targetDateInput.getFullYear(), targetDateInput.getMonth(), targetDateInput.getDate());
  }

  const base = new Date(baseDateInput.getFullYear(), baseDateInput.getMonth(), baseDateInput.getDate());
  const diffTime = targetDate.getTime() - base.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  let label = "";
  if (diffDays === 0) {
    label = "Hari ini";
  } else if (diffDays === 1) {
    label = "Besok";
  } else if (diffDays === 2) {
    label = "Lusa (2 hari lagi)";
  } else if (diffDays > 2 && diffDays <= 7) {
    label = `${diffDays} hari lagi`;
  } else if (diffDays > 7 && diffDays <= 30) {
    const weeks = Math.round(diffDays / 7);
    label = weeks === 1 ? "1 minggu lagi" : `${weeks} minggu lagi`;
  } else if (diffDays > 30) {
    const months = Math.round(diffDays / 30);
    label = months === 1 ? "1 bulan lagi" : `${months} bulan lagi`;
  } else if (diffDays === -1) {
    label = "Kemarin (terlewat 1 hari)";
  } else {
    label = `Terlewat ${Math.abs(diffDays)} hari`;
  }

  return {
    label,
    diffDays,
    isOverdue: diffDays < 0,
    isToday: diffDays === 0,
    isSoon: diffDays > 0 && diffDays <= 7,
  };
}

export function formatIntervalFormula(
  amount: number,
  interval: "monthly" | "yearly" | "quarterly" | "weekly",
  currency: Currency | string = "IDR"
): string {
  switch (interval) {
    case "yearly":
      return `${formatAmount(amount, currency)} ÷ 12 bulan = ${formatAmount(Math.round(amount / 12), currency)}/bulan`;
    case "quarterly":
      return `${formatAmount(amount, currency)} ÷ 3 bulan = ${formatAmount(Math.round(amount / 3), currency)}/bulan`;
    case "weekly":
      return `${formatAmount(amount, currency)} × 52 ÷ 12 = ${formatAmount(Math.round((amount * 52) / 12), currency)}/bulan`;
    case "monthly":
    default:
      return `${formatAmount(amount, currency)}/bulan`;
  }
}