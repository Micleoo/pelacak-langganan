"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { createSupabaseAdapter } from "@/lib/supabase-adapter";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import type { DataStore } from "@/lib/data";
import type { AppSettings, Category, Expense, PaymentRecord } from "@/lib/types";
import type { Currency } from "@/lib/currencies";
import { effectiveNextBillingDate } from "@/lib/recurring";
import { toISO } from "@/lib/format";

const StoreContext = createContext<(DataStore & { error: string | null; clearError: () => void }) | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading, hasProvider } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const adapterRef = useRef<ReturnType<typeof createSupabaseAdapter> | null>(null);

  if (!adapterRef.current) {
    adapterRef.current = createSupabaseAdapter(createClient());
  }

  useEffect(() => {
    let cancelled = false;

    // Jika di dalam AuthProvider dan status auth masih loading
    if (hasProvider && authLoading) return;

    // Jika di dalam AuthProvider dan user belum login (misal di /login atau logout)
    if (hasProvider && !user) {
      setExpenses([]);
      setCategories([]);
      setSettings(null);
      setPaymentHistory([]);
      setReady(true);
      return;
    }

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
  }, [user?.id, authLoading, hasProvider]);

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

    async pauseExpense(id) {
      const expense = expenses.find((e) => e.id === id);
      if (!expense) throw new Error(`Biaya dengan ID "${id}" tidak ditemukan.`);
      await adapterRef.current!.updateExpense(id, { status: "paused" });
      const updated = { ...expense, status: "paused" as const };
      setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)));
      return updated;
    },

    async resumeExpense(id) {
      const expense = expenses.find((e) => e.id === id);
      if (!expense) throw new Error(`Biaya dengan ID "${id}" tidak ditemukan.`);
      await adapterRef.current!.updateExpense(id, { status: "active" });
      const updated = { ...expense, status: "active" as const };
      setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)));
      return updated;
    },

    async settlePayment(expenseId, amount, currency, paidAt = new Date()) {
      const expense = expenses.find((e) => e.id === expenseId);
      if (!expense) throw new Error(`Biaya dengan ID "${expenseId}" tidak ditemukan.`);

      const t = new Date(paidAt.getFullYear(), paidAt.getMonth(), paidAt.getDate());
      const paidAtIso = toISO(t);
      const monthKey = paidAtIso.slice(0, 7);

      // 1. Simpan riwayat pembayaran via adapter
      const record = await adapterRef.current!.addPaymentHistory({
        expense_id: expenseId,
        amount_paid: amount,
        currency,
        paid_at: paidAtIso,
        month_key: monthKey,
      });

      // 2. Majukan siklus jatuh tempo berikutnya dan normalkan status ke active
      const nextDate = effectiveNextBillingDate(expense, t);
      await adapterRef.current!.advanceOverdueExpense(expenseId, nextDate, paidAtIso);

      const updatedExpense: Expense = {
        ...expense,
        status: "active",
        next_billing_date: nextDate,
        last_paid_date: paidAtIso,
      };

      setPaymentHistory((prev) => [record, ...prev]);
      setExpenses((prev) => prev.map((e) => (e.id === expenseId ? updatedExpense : e)));

      return { expense: updatedExpense, payment: record };
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