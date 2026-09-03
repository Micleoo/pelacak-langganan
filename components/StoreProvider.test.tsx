import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act, cleanup } from "@testing-library/react";
import { StoreProvider, useStore } from "@/components/StoreProvider";
import type { Expense, Category, AppSettings, PaymentRecord } from "@/lib/types";

// Use vi.hoisted to define mock at top level
const { mockSupabaseFrom } = vi.hoisted(() => ({
  mockSupabaseFrom: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: mockSupabaseFrom,
  }),
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
        update: () => ({
          eq: () => Promise.resolve({ data: null, error: null }),
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
        insert: (input: any) => ({
          select: () => ({
            single: () => Promise.resolve({ data: { id: "p1", ...input, created_at: "2026-08-19" }, error: null }),
          }),
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

  it("executes atomic pause, resume, and settlePayment domain operations", async () => {
    const initialExpense: Expense = {
      id: "exp-1",
      name: "Netflix",
      amount: 150000,
      interval: "monthly",
      category_id: null,
      status: "overdue",
      next_billing_date: "2026-08-10",
      notify_days_before: null,
      last_paid_date: null,
      currency: "IDR",
    };

    setupMocks([initialExpense], [], null, [], null);

    let storeInstance: any;
    function ActionComponent() {
      storeInstance = useStore();
      return (
        <div>
          <span data-testid="status">{storeInstance.expenses[0]?.status}</span>
          <span data-testid="billing-date">{storeInstance.expenses[0]?.next_billing_date}</span>
          <span data-testid="history-count">{storeInstance.paymentHistory.length}</span>
        </div>
      );
    }

    render(
      <StoreProvider>
        <ActionComponent />
      </StoreProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("overdue");
    });

    // 1. Test pauseExpense
    await act(async () => {
      await storeInstance.pauseExpense("exp-1");
    });
    expect(screen.getByTestId("status").textContent).toBe("paused");

    // 2. Test resumeExpense
    await act(async () => {
      await storeInstance.resumeExpense("exp-1");
    });
    expect(screen.getByTestId("status").textContent).toBe("active");

    // 3. Test settlePayment
    const payDate = new Date(2026, 7, 19); // 2026-08-19
    await act(async () => {
      await storeInstance.settlePayment("exp-1", 150000, "IDR", payDate);
    });

    // Billing date must advance to 2026-09-10 (monthly from 2026-08-10 relative to 2026-08-19)
    expect(screen.getByTestId("status").textContent).toBe("active");
    expect(screen.getByTestId("billing-date").textContent).toBe("2026-09-10");
    expect(screen.getByTestId("history-count").textContent).toBe("1");
  });
});