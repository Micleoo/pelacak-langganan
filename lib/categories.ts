import type { Category } from "./types";
import type { DataStore } from "./data";

export const CATEGORY_COLOR_TOKENS = [
  "cat-1",
  "cat-2",
  "cat-3",
  "cat-4",
  "cat-5",
  "cat-6",
  "cat-7",
  "cat-8",
] as const;

export type CategoryColorToken = (typeof CATEGORY_COLOR_TOKENS)[number];

export const CATEGORY_HEX: Record<CategoryColorToken, string> = {
  "cat-1": "#0d9488",
  "cat-2": "#d97706",
  "cat-3": "#475569",
  "cat-4": "#2563eb",
  "cat-5": "#059669",
  "cat-6": "#7c3aed",
  "cat-7": "#e11d48",
  "cat-8": "#ea580c",
};

const KNOWN_CATEGORIES: Record<string, CategoryColorToken> = {
  Streaming: "cat-1",
  "AI Tools": "cat-2",
  Utilitas: "cat-3",
};

const DEFAULT_COLOR: CategoryColorToken = "cat-4";

export function categoryIdentity(name: string | null | undefined): {
  color: CategoryColorToken;
} {
  if (!name) return { color: DEFAULT_COLOR };
  const known = KNOWN_CATEGORIES[name];
  if (known) return { color: known };
  const index = hashName(name) % CATEGORY_COLOR_TOKENS.length;
  return { color: CATEGORY_COLOR_TOKENS[index] };
}

export async function ensureCategory(
  store: DataStore,
  name: string
): Promise<string | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const existing = store.categories.find(
    (c) => c.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (existing) return existing.id;
  return (await store.addCategory({ name: trimmed })).id;
}

/**
 * Mengembalikan nama kategori hanya untuk layanan yang dapat dikenali dengan
 * cukup yakin. Nilai null sengaja dipakai sebagai fallback agar aplikasi tidak
 * memaksakan klasifikasi yang keliru.
 */
export function suggestCategoryName(expenseName: string): string | null {
  const name = expenseName.toLowerCase();
  if (/netflix|spotify|youtube|disney|vidio|prime video|apple music|hbo|viu/.test(name)) {
    return "Streaming";
  }
  if (/chatgpt|openai|claude|anthropic|midjourney|github copilot|gemini|cursor|perplexity/.test(name)) {
    return "AI Tools";
  }
  if (/indihome|telkom|biznet|wifi|internet|listrik|pln|air|pdam|pulsa/.test(name)) {
    return "Utilitas";
  }
  if (/icloud|google one|dropbox|onedrive|google drive/.test(name)) {
    return "Penyimpanan";
  }
  if (/gym|fitness|strava|classpass/.test(name)) {
    return "Fitness";
  }
  if (/notion|figma|canva|slack|zoom|microsoft 365|office 365/.test(name)) {
    return "Produktivitas";
  }
  return null;
}

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}
