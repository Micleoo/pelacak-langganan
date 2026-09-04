import { test, expect } from "@playwright/test";

test.describe("API Route Security & Protection", () => {
  test("returns 401 Unauthorized JSON when unauthenticated client calls /api/send-test-email", async ({ request }) => {
    const res = await request.post("/api/send-test-email", {
      data: { email: "test@example.com" },
    });

    expect(res.status()).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  test("does not return HTML login page for unauthenticated API routes", async ({ request }) => {
    const res = await request.post("/api/send-test-email", {
      data: {},
    });

    expect(res.headers()["content-type"]).toContain("application/json");
    expect(res.status()).toBe(401);
  });
});
