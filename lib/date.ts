import type { Interval } from "./types";

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addMonthsClamped(date: Date, months: number): Date {
  const day = date.getUTCDate();
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target;
}

export function addMonths(date: Date, months: number): Date {
  return addMonthsClamped(date, months);
}

export function addInterval(date: Date, interval: Interval): Date {
  switch (interval) {
    case "weekly":
      return new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000);
    case "monthly":
      return addMonthsClamped(date, 1);
    case "quarterly":
      return addMonthsClamped(date, 3);
    case "yearly":
      return addMonthsClamped(date, 12);
  }
}

export function todayUTC(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}