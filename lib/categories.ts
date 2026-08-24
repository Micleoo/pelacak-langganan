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

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}