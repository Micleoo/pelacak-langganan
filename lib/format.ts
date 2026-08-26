const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function formatIDR(amount: number): string {
  return idr.format(amount);
}

export function formatIDRMonthly(amount: number): string {
  return `${idr.format(amount)}/bln`;
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
  interval: "monthly" | "yearly" | "quarterly" | "weekly"
): string {
  switch (interval) {
    case "yearly":
      return `${formatIDR(amount)} ÷ 12 bulan = ${formatIDR(Math.round(amount / 12))}/bulan`;
    case "quarterly":
      return `${formatIDR(amount)} ÷ 3 bulan = ${formatIDR(Math.round(amount / 3))}/bulan`;
    case "weekly":
      return `${formatIDR(amount)} × 52 ÷ 12 = ${formatIDR(Math.round((amount * 52) / 12))}/bulan`;
    case "monthly":
    default:
      return `${formatIDR(amount)}/bulan`;
  }
}