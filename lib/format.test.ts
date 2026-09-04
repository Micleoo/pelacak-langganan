import { describe, expect, it } from "vitest";
import {
  parseISO,
  toISO,
  addMonths,
  addInterval,
  formatDate,
  formatRelativeDue,
  formatIntervalFormula,
} from "./format";

describe("format module - Slice 1: parseISO & toISO", () => {
  it("parses standard YYYY-MM-DD string into UTC date", () => {
    const d = parseISO("2026-09-04");
    expect(d.getUTCFullYear()).toBe(2026);
    expect(d.getUTCMonth()).toBe(8); // September is 0-indexed (8)
    expect(d.getUTCDate()).toBe(4);
  });

  it("converts Date to YYYY-MM-DD via toISO", () => {
    const d = new Date(Date.UTC(2026, 8, 4));
    expect(toISO(d)).toBe("2026-09-04");
  });

  it("parses ISO strings that contain timestamps without NaN corruption", () => {
    const d = parseISO("2026-09-04T12:30:00.000Z");
    expect(d.getUTCFullYear()).toBe(2026);
    expect(d.getUTCMonth()).toBe(8);
    expect(d.getUTCDate()).toBe(4);
    expect(isNaN(d.getTime())).toBe(false);
  });
});

describe("format module - Slice 2: addMonths & addInterval", () => {
  it("clamps month end on leap years (Jan 31 -> Feb 29 on 2024)", () => {
    const leapJan31 = parseISO("2024-01-31");
    const feb = addMonths(leapJan31, 1);
    expect(toISO(feb)).toBe("2024-02-29");
  });

  it("clamps month end on non-leap years (Jan 31 -> Feb 28 on 2025)", () => {
    const nonLeapJan31 = parseISO("2025-01-31");
    const feb = addMonths(nonLeapJan31, 1);
    expect(toISO(feb)).toBe("2025-02-28");
  });

  it("clamps 31-day months into 30-day months (May 31 -> Jun 30)", () => {
    const may31 = parseISO("2026-05-31");
    const jun = addMonths(may31, 1);
    expect(toISO(jun)).toBe("2026-06-30");
  });

  it("advances by interval correctly (weekly, monthly, quarterly, yearly)", () => {
    const base = parseISO("2026-01-15");
    expect(toISO(addInterval(base, "weekly"))).toBe("2026-01-22");
    expect(toISO(addInterval(base, "monthly"))).toBe("2026-02-15");
    expect(toISO(addInterval(base, "quarterly"))).toBe("2026-04-15");
    expect(toISO(addInterval(base, "yearly"))).toBe("2027-01-15");
  });
});

describe("format module - Slice 3: formatDate", () => {
  it("formats YYYY-MM-DD date into Indonesian locale string", () => {
    const formatted = formatDate("2026-09-04");
    expect(formatted).toMatch(/4\s+Sep(t)?\s+2026/);
  });

  it("handles ISO strings containing timestamp without producing NaN or invalid date", () => {
    const formatted = formatDate("2026-09-04T15:45:00.000Z");
    expect(formatted).not.toContain("NaN");
    expect(formatted).toMatch(/4\s+Sep(t)?\s+2026/);
  });
});

describe("format module - Slice 4: formatRelativeDue", () => {
  const base = new Date(2026, 8, 4); // 2026-09-04

  it("identifies today", () => {
    const res = formatRelativeDue("2026-09-04", base);
    expect(res.label).toBe("Hari ini");
    expect(res.diffDays).toBe(0);
    expect(res.isToday).toBe(true);
    expect(res.isOverdue).toBe(false);
  });

  it("identifies tomorrow and next 2 days", () => {
    const tmr = formatRelativeDue("2026-09-05", base);
    expect(tmr.label).toBe("Besok");
    expect(tmr.isSoon).toBe(true);

    const lusa = formatRelativeDue("2026-09-06", base);
    expect(lusa.label).toBe("Lusa (2 hari lagi)");
    expect(lusa.isSoon).toBe(true);
  });

  it("identifies past dates (overdue)", () => {
    const yesterday = formatRelativeDue("2026-09-03", base);
    expect(yesterday.label).toBe("Kemarin (terlewat 1 hari)");
    expect(yesterday.isOverdue).toBe(true);

    const past5 = formatRelativeDue("2026-08-30", base);
    expect(past5.label).toBe("Terlewat 5 hari");
    expect(past5.isOverdue).toBe(true);
  });

  it("handles empty or invalid date input without returning NaN labels", () => {
    const res = formatRelativeDue("", base);
    expect(res.label).toBe("-");
    expect(res.isOverdue).toBe(false);
    expect(res.isToday).toBe(false);
    expect(res.isSoon).toBe(false);
  });
});

describe("format module - Slice 5: formatIntervalFormula", () => {
  it("formats IDR yearly interval formula correctly", () => {
    const formula = formatIntervalFormula(1200000, "yearly", "IDR");
    expect(formula).toContain("1.200.000");
    expect(formula).toContain("12 bulan");
    expect(formula).toContain("100.000/bulan");
  });

  it("preserves cents precision for USD yearly formulas without premature Math.round truncation", () => {
    // 20 USD / 12 = 1.666... -> should format as 1,67 or 1.67, NOT 2,00
    const formula = formatIntervalFormula(20, "yearly", "USD");
    expect(formula).toContain("1,67");
    expect(formula).not.toContain("2,00");
  });

  it("preserves cents precision for USD weekly formulas without premature Math.round truncation", () => {
    // 5 USD * 52 / 12 = 21.666... -> should format as 21,67, NOT 22,00
    const formula = formatIntervalFormula(5, "weekly", "USD");
    expect(formula).toContain("21,67");
    expect(formula).not.toContain("22,00");
  });

  it("formats monthly interval straightforwardly", () => {
    const formula = formatIntervalFormula(150000, "monthly", "IDR");
    expect(formula).toContain("150.000/bulan");
  });
});




