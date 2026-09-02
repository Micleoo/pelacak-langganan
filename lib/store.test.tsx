import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act, cleanup } from "@testing-library/react";
import { StoreProvider, useStore } from "./store";
import type { Expense, Category, AppSettings } from "./types";

// Use vi.hoisted to define mock at top level
const { mockSupabaseFrom } = vi.hoisted(() => ({
  mockSupabaseFrom: vi.fn(),
}));

vi.mock("@/lib/supabase-client", () => ({
  createSupabaseClient: () => ({
    from: mockSupabaseFrom,
  }),
}));

vi.mock("./supabase-client", () => ({
  createSupabaseClient: () => ({
    from: mockSupabaseFrom,
  }),
}));

vi.mock("./supabase", () => ({
  supabase: {
    from: mockSupabaseFrom,
  },
}));

// Test component to access store
function TestComponent() {
  const store = useStore();
  return (
    <div>
      <span data-testid="expenses-count">{store.expenses.length}</span>
      <span data-testid="categories-count">{store.categories.length}</span>
      <span data-testid="settings-loaded">{store.settings ? "yes" : "no"}</span>
    </div>
  );
}

function renderWithStore() {
  return render(
    <StoreProvider>
      <TestComponent />
    </StoreProvider>
  );
}

import type { PaymentRecord } from "./types";

function setupMocks(
  expenses: Expense[] = [],
  categories: Category[] = [],
  settings: AppSettings | null = null,
  paymentHistory: PaymentRecord[] = [],
  error: Error | null = null
) {
  mockSupabaseFrom.mockImplementation((table: string) => {
    const baseSelect = () => ({
      order: () => Promise.resolve({ data: [], error: error }),
      limit: () => ({
        maybeSingle: () => Promise.resolve({ data: settings, error: error }),
      }),
    });

    if (table === "expenses") {
      return {
        select: () => ({
          order: () => Promise.resolve({ data: expenses, error: error }),
        }),
      };
    }
    if (table === "categories") {
      return {
        select: () => ({
          order: () => Promise.resolve({ data: categories, error: error }),
        }),
      };
    }
    if (table === "app_settings") {
      return {
        select: () => ({
          limit: () => ({
            maybeSingle: () => Promise.resolve({ data: settings, error: error }),
          }),
        }),
      };
    }
    if (table === "payment_history") {
      return {
        select: () => ({
          order: () => Promise.resolve({ data: paymentHistory, error: error }),
        }),
      };
    }
    return baseSelect;
  });
}

describe("Store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("loads data successfully", async () => {
    const mockExpenses: Expense[] = [
      { id: "1", name: "Netflix", amount: 150000, interval: "monthly", category_id: null, status: "active", next_billing_date: "2026-08-25", notify_days_before: null, last_paid_date: null, currency: "IDR", created_at: "2026-08-01" },
    ];
    const mockCategories: Category[] = [
      { id: "cat1", name: "Streaming", created_at: "2026-08-01" },
    ];
    const mockSettings: AppSettings = {
      id: "set1",
      default_notify_days_before: 3,
      email_enabled: false,
      in_app_enabled: true,
      user_email: null,
      base_currency: "IDR",
    };

    setupMocks(mockExpenses, mockCategories, mockSettings, [], null);

    renderWithStore();

    await waitFor(() => {
      expect(screen.getByTestId("expenses-count").textContent).toBe("1");
      expect(screen.getByTestId("categories-count").textContent).toBe("1");
      expect(screen.getByTestId("settings-loaded").textContent).toBe("yes");
    });
  });

  it("handles load failure gracefully", async () => {
    const error = new Error("Connection failed");
    setupMocks([], [], null, [], error);

    renderWithStore();

    await waitFor(() => {
      // On error, defaultSettings() is used so settings-loaded shows "yes"
      expect(screen.getByTestId("settings-loaded").textContent).toBe("yes");
      expect(screen.getByTestId("expenses-count").textContent).toBe("0");
      expect(screen.getByTestId("categories-count").textContent).toBe("0");
    });
  });
});