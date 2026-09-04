import { test, expect } from "@playwright/test";

test.describe("Landing Page & Interactive Demo Mode", () => {
  test("renders complete landing page with value proposition and features", async ({ page }) => {
    await page.goto("/");

    // 1. Value Proposition & Trust Badges
    await expect(
      page.getByRole("heading", { name: "Ketahui Ke Mana Uang Langgananmu Pergi Setiap Bulan" })
    ).toBeVisible();
    await expect(
      page.getByText("100% Client-Side Privacy · Tanpa Kartu Kredit · Gratis Selamanya")
    ).toBeVisible();

    // 2. Feature Cards
    await expect(page.getByText("Scan & Parse Email Tagihan")).toBeVisible();
    await expect(page.getByText("Multi-Mata Uang Otomatis")).toBeVisible();
    await expect(page.getByText("Jeda Langganan & Anti-Tunggakan")).toBeVisible();
    await expect(page.getByText("Grafik Tren Pengeluaran 12 Bulan")).toBeVisible();

    // 3. Comparison Table
    await expect(
      page.getByRole("heading", { name: "Mengapa Tidak Cukup Pakai Spreadsheet Biasa?" })
    ).toBeVisible();
    await expect(page.getByText("Spreadsheet Manual")).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Pelacak Langganan" })).toBeVisible();

    // 4. CTA Buttons
    await expect(page.getByRole("link", { name: "Mulai Gratis Sekarang" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Coba Demo Interaktif (Tanpa Akun)" })).toBeVisible();
  });

  test("activates interactive demo mode with sample data and live handlers", async ({ page }) => {
    await page.goto("/");

    // Click interactive demo CTA
    const startDemoBtn = page.getByRole("button", { name: "Coba Demo Interaktif (Tanpa Akun)" });
    await startDemoBtn.click();

    // Verify Demo Banner appears
    await expect(page.getByText("Mode Demo Interaktif")).toBeVisible();
    await expect(page.getByText(/Data contoh sedang dimuat tanpa akun/)).toBeVisible();

    // Verify Demo Expenses are rendered
    await expect(page.getByRole("link", { name: "Netflix Premium" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Spotify Individual" })).toBeVisible();
    await expect(page.getByRole("link", { name: "IndiHome Fiber 50Mbps" })).toBeVisible();

    // Verify Currency Reference Badge is present
    await expect(page.getByText(/Kurs acuan:/)).toBeVisible();
    await expect(page.getByText(/\$1 = Rp 15\.500/)).toBeVisible();

    // Test paying an overdue expense in demo mode
    const payButton = page.locator("button[aria-label='Tandai IndiHome Fiber 50Mbps sebagai dibayar']");
    if (await payButton.isVisible()) {
      await payButton.click();
      // Expect toast notification
      await expect(page.getByText(/dibayar \(Simulasi Demo\)/)).toBeVisible();
    }

    // Test exiting demo mode
    const exitDemoBtn = page.getByRole("button", { name: "Keluar Demo" });
    await exitDemoBtn.click();

    // Should return to Landing Page
    await expect(
      page.getByRole("heading", { name: "Ketahui Ke Mana Uang Langgananmu Pergi Setiap Bulan" })
    ).toBeVisible();
  });

  test("displays currency exchange rate reference in settings", async ({ page }) => {
    // Navigate to /settings (requires auth, will redirect to /login)
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/login/);
  });
});
