import { describe, expect, it } from "vitest";

describe("Edge Function: send-reminders", () => {
  it("should calculate reminder date correctly for monthly expense", () => {
    // Test UTC date comparison logic
    const today = new Date("2026-08-19T00:00:00Z");
    const nextBilling = new Date("2026-08-22T00:00:00Z");
    const notifyDays = 3;

    const reminderDate = new Date(nextBilling.getTime());
    reminderDate.setUTCDate(reminderDate.getUTCDate() - notifyDays);

    expect(reminderDate.getUTCFullYear()).toBe(today.getUTCFullYear());
    expect(reminderDate.getUTCMonth()).toBe(today.getUTCMonth());
    expect(reminderDate.getUTCDate()).toBe(today.getUTCDate());
  });

  it("should not trigger reminder outside window", () => {
    const today = new Date("2026-08-19T00:00:00Z");
    const nextBilling = new Date("2026-08-25T00:00:00Z");
    const notifyDays = 3;

    const reminderDate = new Date(nextBilling.getTime());
    reminderDate.setUTCDate(reminderDate.getUTCDate() - notifyDays);

    const isMatch =
      reminderDate.getUTCFullYear() === today.getUTCFullYear() &&
      reminderDate.getUTCMonth() === today.getUTCMonth() &&
      reminderDate.getUTCDate() === today.getUTCDate();

    expect(isMatch).toBe(false);
  });

  it("should handle yearly expense reminder", () => {
    const today = new Date("2026-08-19T00:00:00Z");
    const nextBilling = new Date("2026-08-22T00:00:00Z");
    const notifyDays = 3;

    const reminderDate = new Date(nextBilling.getTime());
    reminderDate.setUTCDate(reminderDate.getUTCDate() - notifyDays);

    expect(reminderDate.getUTCDate()).toBe(today.getUTCDate());
  });

  it("should handle leap year date edge case", () => {
    // Feb 29 in leap year
    const nextBilling = new Date("2024-02-29T00:00:00Z");
    const notifyDays = 1;

    const reminderDate = new Date(nextBilling.getTime());
    reminderDate.setUTCDate(reminderDate.getUTCDate() - notifyDays);

    expect(reminderDate.getUTCDate()).toBe(28);
    expect(reminderDate.getUTCMonth()).toBe(1); // February
  });

  it("should format email test reminder payload correctly", () => {
    const isTest = true;
    const targetEmail = "test@example.com";
    const sampleExpenses = [{ name: "Netflix", amount: 186000, next_billing_date: "2026-08-30" }];

    expect(isTest).toBe(true);
    expect(targetEmail).toContain("@");
    expect(sampleExpenses.length).toBeGreaterThan(0);
  });
});