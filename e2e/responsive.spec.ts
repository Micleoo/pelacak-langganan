import { test, expect } from "@playwright/test";

test.describe("Responsive Viewport & Layout", () => {
  test("renders correctly on mobile viewport (375x667)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/login");

    // Header branding & input controls should fit cleanly without horizontal overflow
    await expect(page.getByRole("heading", { name: "Masuk ke Pelacak Langganan" })).toBeVisible();
    const emailInput = page.locator("#email");
    await expect(emailInput).toBeVisible();

    const box = await emailInput.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.width).toBeLessThan(375);
    }
  });

  test("renders correctly on desktop viewport (1280x800)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: "Masuk ke Pelacak Langganan" })).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
  });
});
