import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppSettings, Category, Expense } from "./types";
import type {
  CategoryInput,
  DataStore,
  ExpenseInput,
  PaymentHistoryInput,
  PaymentRecord,
  SettingsInput,
} from "./data";

type AdapterMethods = Pick<
  DataStore,
  | "addExpense"
  | "updateExpense"
  | "deleteExpense"
  | "updateExpenseNotifyDays"
  | "advanceOverdueExpense"
  | "addCategory"
  | "renameCategory"
  | "deleteCategory"
  | "updateSettings"
  | "fetchPaymentHistory"
  | "addPaymentHistory"
>;

export interface SupabaseAdapter extends AdapterMethods {
  fetchAll(): Promise<{
    expenses: Expense[];
    categories: Category[];
    settings: AppSettings;
    paymentHistory: PaymentRecord[];
  }>;
}

export function createSupabaseAdapter(
  supabase: SupabaseClient
): SupabaseAdapter {
  const adapter: SupabaseAdapter = {
    async addExpense(input) {
      const { data, error } = await supabase
        .from("expenses")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as Expense;
    },

    async updateExpense(id, input) {
      const { error } = await supabase
        .from("expenses")
        .update(input)
        .eq("id", id);
      if (error) throw error;
    },

    async deleteExpense(id) {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
    },

    async updateExpenseNotifyDays(id, notify_days_before) {
      const { error } = await supabase
        .from("expenses")
        .update({ notify_days_before })
        .eq("id", id);
      if (error) throw error;
    },

    async advanceOverdueExpense(id, nextBillingDate, lastPaidDate) {
      const { error } = await supabase
        .from("expenses")
        .update({
          status: "active",
          next_billing_date: nextBillingDate,
          last_paid_date: lastPaidDate,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },

    async addCategory(input) {
      const { data, error } = await supabase
        .from("categories")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as Category;
    },

    async renameCategory(id, name) {
      const { error } = await supabase
        .from("categories")
        .update({ name })
        .eq("id", id);
      if (error) throw error;
    },

    async deleteCategory(id) {
      const { error } = await supabase
        .rpc("delete_category_with_cascade", { p_category_id: id });
      if (error) throw error;
    },

    async updateSettings(input) {
      const payload: Record<string, unknown> = { ...input };
      if (!payload.id) {
        delete payload.id;
      }
      const { data, error } = await supabase
        .from("app_settings")
        .upsert(payload, { onConflict: payload.id ? "id" : "user_id" })
        .select()
        .single();
      if (error) throw error;
      return data as AppSettings;
    },

    async fetchPaymentHistory(): Promise<PaymentRecord[]> {
      const { data, error } = await supabase
        .from("payment_history")
        .select("*")
        .order("paid_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },

    async addPaymentHistory(input): Promise<PaymentRecord> {
      const { data, error } = await supabase
        .from("payment_history")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as PaymentRecord;
    },

    async fetchAll(): Promise<{
      expenses: Expense[];
      categories: Category[];
      settings: AppSettings;
      paymentHistory: PaymentRecord[];
    }> {
      const [expRes, catRes, setRes, payRes] = await Promise.all([
        supabase.from("expenses").select("*").order("created_at", { ascending: true }),
        supabase.from("categories").select("*").order("name", { ascending: true }),
        supabase.from("app_settings").select("*").limit(1).maybeSingle(),
        supabase.from("payment_history").select("*").order("paid_at", { ascending: false }),
      ]);

      if (expRes.error) throw expRes.error;
      if (catRes.error) throw catRes.error;
      if (setRes.error) throw setRes.error;
      if (payRes.error) throw payRes.error;

      return {
        expenses: expRes.data ?? [],
        categories: catRes.data ?? [],
        settings: setRes.data ?? defaultSettings(),
        paymentHistory: payRes.data ?? [],
      };
    },
  };

  return adapter;
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