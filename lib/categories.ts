import {
  Bot,
  CircleDollarSign,
  Clapperboard,
  Wifi,
  type LucideIcon,
} from "lucide-react";

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

const KNOWN_CATEGORIES: Record<
  string,
  { icon: LucideIcon; color: CategoryColorToken }
> = {
  Streaming: { icon: Clapperboard, color: "cat-1" },
  "AI Tools": { icon: Bot, color: "cat-2" },
  Utilitas: { icon: Wifi, color: "cat-3" },
};

const DEFAULT_CATEGORY: { icon: LucideIcon; color: CategoryColorToken } = {
  icon: CircleDollarSign,
  color: "cat-4",
};

export function categoryIdentity(name: string | null | undefined): {
  icon: LucideIcon;
  color: CategoryColorToken;
} {
  if (!name) return DEFAULT_CATEGORY;
  const known = KNOWN_CATEGORIES[name];
  if (known) return known;
  const index = hashName(name) % CATEGORY_COLOR_TOKENS.length;
  return { icon: DEFAULT_CATEGORY.icon, color: CATEGORY_COLOR_TOKENS[index] };
}

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}