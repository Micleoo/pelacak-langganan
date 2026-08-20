"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AppSettings, Category, Expense } from "./types";
import type {
  CategoryInput,
  DataStore,
  ExpenseInput,
  SettingsInput,
} from "./data";
import { supabase } from "./supabase";

const StoreContext = createContext<DataStore | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [ready, setReady] = useState(false);
  const settingsRef = useRef<AppSettings | null>(null);
  settingsRef.current = settings;

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      const [expRes, catRes, setRes] = await Promise.all([
        supabase
          .from("expenses")
          .select("*")
          .order("created_at", { ascending: true }),
        supabase
          .from("categories")
          .select("*")
          .order("name", { ascending: true }),
        supabase
          .from("app_settings")
          .select("*")
          .limit(1)
          .maybeSingle(),
      ]);
      if (cancelled) return;
      if (expRes.error) throw expRes.error;
      if (catRes.error) throw catRes.error;
      if (setRes.error) throw setRes.error;
      setExpenses(expRes.data);
      setCategories(catRes.data);
      setSettings(setRes.data ?? defaultSettings());
      setReady(true);
    }

    loadAll().catch((err) => {
      console.error("Gagal memuat data dari Supabase:", err);
      setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const value: DataStore = {
    expenses,
    categories,
    settings: settings ?? defaultSettings(),

    async addExpense(input) {
      const { data, error } = await supabase
        .from("expenses")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      const expense = data as Expense;
      setExpenses((prev) => [...prev, expense]);
      return expense;
    },

    async updateExpense(id, input) {
      const { error } = await supabase
        .from("expenses")
        .update(input)
        .eq("id", id);
      if (error) throw error;
      setExpenses((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...input } : e)),
      );
    },

    async deleteExpense(id) {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    },

    async updateExpenseNotifyDays(id, notify_days_before) {
      const { error } = await supabase
        .from("expenses")
        .update({ notify_days_before })
        .eq("id", id);
      if (error) throw error;
      setExpenses((prev) =>
        prev.map((e) => (e.id === id ? { ...e, notify_days_before } : e)),
      );
    },

    async addCategory(input) {
      const { data, error } = await supabase
        .from("categories")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      const category = data as Category;
      setCategories((prev) => [...prev, category]);
      return category;
    },

    async renameCategory(id, name) {
      const { error } = await supabase
        .from("categories")
        .update({ name })
        .eq("id", id);
      if (error) throw error;
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, name } : c)),
      );
    },

    async deleteCategory(id) {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setExpenses((prev) =>
        prev.map((e) => (e.category_id === id ? { ...e, category_id: null } : e)),
      );
    },

    async updateSettings(input) {
      const current = settingsRef.current ?? defaultSettings();
      const { data, error } = await supabase
        .from("app_settings")
        .upsert({ id: current.id, ...input })
        .select()
        .single();
      if (error) throw error;
      setSettings(data as AppSettings);
    },
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-mist-paper text-sm text-ink-slate">
        Memuat…
      </div>
    );
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
  };
}

export function useStore(): DataStore {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return store;
}