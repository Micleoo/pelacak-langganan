"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createSupabaseClient } from "@/lib/supabase-client";
import { createSupabaseAdapter } from "@/lib/supabase-adapter";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import type { DataStore } from "@/lib/data";
import type { AppSettings, Category, Expense, PaymentRecord } from "@/lib/types";
import type { Currency } from "@/lib/currencies";

const StoreContext = createContext<(DataStore & { error: string | null; clearError: () => void }) | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const adapterRef = useRef<ReturnType<typeof createSupabaseAdapter> | null>(null);

  if (!adapterRef.current) {
    adapterRef.current = createSupabaseAdapter(createSupabaseClient());
  }

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      try {
        const data = await adapterRef.current!.fetchAll();
        if (cancelled) return;
        setExpenses(data.expenses);
        setCategories(data.categories);
        setSettings(data.settings);
        setPaymentHistory(data.paymentHistory);
        setReady(true);
      } catch (err) {
        console.error("Gagal memuat data dari Supabase:", err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Gagal memuat data");
          setReady(true);
        }
      }
    }

    loadAll();

    return () => {
      cancelled = true;
    };
  }, []);

  function clearError() {
    setError(null);
  }

  const value: DataStore & { error: string | null; clearError: () => void } = {
    expenses,
    categories,
    settings: settings ?? defaultSettings(),
    paymentHistory,
    error,
    clearError,

    async addExpense(input) {
      const expense = await adapterRef.current!.addExpense(input);
      setExpenses((prev) => [...prev, expense]);
      return expense;
    },

    async updateExpense(id, input) {
      await adapterRef.current!.updateExpense(id, input);
      setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...input, currency: input.currency as Currency } : e)));
    },

    async deleteExpense(id) {
      await adapterRef.current!.deleteExpense(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    },

    async updateExpenseNotifyDays(id, notify_days_before) {
      await adapterRef.current!.updateExpenseNotifyDays(id, notify_days_before);
      setExpenses((prev) =>
        prev.map((e) => (e.id === id ? { ...e, notify_days_before } : e)),
      );
    },

    async advanceOverdueExpense(id, nextBillingDate, lastPaidDate) {
      await adapterRef.current!.advanceOverdueExpense(id, nextBillingDate, lastPaidDate);
      setExpenses((prev) =>
        prev.map((e) =>
          e.id === id
            ? { ...e, status: "active" as const, next_billing_date: nextBillingDate, last_paid_date: lastPaidDate }
            : e
        ),
      );
    },

    async addCategory(input) {
      const category = await adapterRef.current!.addCategory(input);
      setCategories((prev) => [...prev, category]);
      return category;
    },

    async renameCategory(id, name) {
      await adapterRef.current!.renameCategory(id, name);
      setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)));
    },

    async deleteCategory(id) {
      await adapterRef.current!.deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setExpenses((prev) =>
        prev.map((e) => (e.category_id === id ? { ...e, category_id: null } : e)),
      );
    },

    async updateSettings(input) {
      const newSettings = await adapterRef.current!.updateSettings(input);
      setSettings(newSettings);
      return newSettings;
    },

    async fetchPaymentHistory() {
      const history = await adapterRef.current!.fetchPaymentHistory();
      setPaymentHistory(history);
      return history;
    },

    async addPaymentHistory(input) {
      const record = await adapterRef.current!.addPaymentHistory(input);
      setPaymentHistory((prev) => [record, ...prev]);
      return record;
    },
  };

  if (!ready) {
    return <DashboardSkeleton />;
  }

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

function defaultSettings(): AppSettings {
  return {
    id: "",
    default_notify_days_before: 3,
    email_enabled: false,
    in_app_enabled: true,
    user_email: null,
    base_currency: "IDR",
  };
}

export function useStore(): DataStore & { error: string | null; clearError: () => void } {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return store;
}