import { test, expect } from "@playwright/test";

test.describe("Authentication & Navigation Flow", () => {
  test("renders landing page for unauthenticated visitors on root /", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/");
    await expect(
      page.getByRole("heading", { name: "Ketahui Ke Mana Uang Langgananmu Pergi Setiap Bulan" })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Coba Demo Interaktif (Tanpa Akun)" })).toBeVisible();
  });

  test("redirects unauthenticated user from /expenses to /login", async ({ page }) => {
    await page.goto("/expenses");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Masuk ke Pelacak Langganan" })).toBeVisible();
  });

  test("renders login page with all expected inputs and branding", async ({ page }) => {
    await page.goto("/login");

    // Branding and title
    await expect(page.getByRole("heading", { name: "Masuk ke Pelacak Langganan" })).toBeVisible();
    await expect(page.getByText("Sadar ke mana uangmu pergi dengan privasi data terlindungi.")).toBeVisible();

    // Form inputs
    const emailInput = page.locator("#email");
    const passwordInput = page.locator("#password");
    const submitBtn = page.getByRole("button", { name: "Masuk", exact: true });

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitBtn).toBeVisible();

    // Toggle password visibility
    await passwordInput.fill("secret123");
    await expect(passwordInput).toHaveAttribute("type", "password");

    const togglePasswordBtn = page.locator("button[aria-label='Tampilkan sandi']");
    await togglePasswordBtn.click();
    await expect(passwordInput).toHaveAttribute("type", "text");

    const hidePasswordBtn = page.locator("button[aria-label='Sembunyikan sandi']");
    await hidePasswordBtn.click();
    await expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("displays error feedback on invalid login credentials", async ({ page }) => {
    await page.goto("/login");

    await page.locator("#email").fill("wronguser@example.com");
    await page.locator("#password").fill("wrongpassword123");
    await page.getByRole("button", { name: "Masuk", exact: true }).click();

    // Expect alert role to display feedback (excluding Next.js route announcer)
    const errorAlert = page.locator(".animate-fadeIn[role='alert']");
    await expect(errorAlert).toBeVisible({ timeout: 10000 });
    await expect(errorAlert).toContainText(/Email atau kata sandi salah|Gagal masuk/);
  });

  test("allows navigation between /login and /register", async ({ page }) => {
    await page.goto("/login");

    // Click register link
    await page.getByRole("link", { name: "Daftar sekarang" }).click();
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByRole("heading", { name: "Daftar Akun Baru" })).toBeVisible();
    await expect(page.getByText("Mulai kelola langganan rutin Anda dengan data pribadi terisolasi.")).toBeVisible();

    // Click back to login link
    await page.getByRole("link", { name: "Masuk ke akun" }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Masuk ke Pelacak Langganan" })).toBeVisible();
  });

  test("validates password confirmation match on /register", async ({ page }) => {
    await page.goto("/register");

    await page.locator("#email").fill("testuser@example.com");
    await page.locator("#password").fill("password123");
    await page.locator("#confirm-password").fill("different456");
    await page.getByRole("button", { name: "Daftar Akun" }).click();

    const errorAlert = page.locator(".animate-fadeIn[role='alert']");
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText("Konfirmasi kata sandi tidak cocok.");
  });

  test("allows navigating directly from /login to interactive demo", async ({ page }) => {
    await page.goto("/login");
    const demoLink = page.getByRole("link", { name: /coba demo interaktif tanpa akun/i });
    await expect(demoLink).toBeVisible();
    await demoLink.click();

    await expect(page).toHaveURL(/\?demo=true/);
    await expect(page.getByText("Mode Demo Interaktif")).toBeVisible();
    await expect(page.getByRole("link", { name: "Netflix Premium" })).toBeVisible();
  });
});
