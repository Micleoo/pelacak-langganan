import { categoryIdentity, type CategoryColorToken } from "@/lib/categories";
import { CATEGORY_ICON_SIZE } from "@/lib/constants";
import {
  Bot,
  CircleDollarSign,
  Clapperboard,
  Wifi,
  type LucideIcon,
} from "lucide-react";

const TEXT_COLOR: Record<CategoryColorToken, string> = {
  "cat-1": "text-cat-1",
  "cat-2": "text-cat-2",
  "cat-3": "text-cat-3",
  "cat-4": "text-cat-4",
  "cat-5": "text-cat-5",
  "cat-6": "text-cat-6",
  "cat-7": "text-cat-7",
  "cat-8": "text-cat-8",
};

const TINT_BG: Record<CategoryColorToken, string> = {
  "cat-1": "bg-cat-1/10",
  "cat-2": "bg-cat-2/10",
  "cat-3": "bg-cat-3/10",
  "cat-4": "bg-cat-4/10",
  "cat-5": "bg-cat-5/10",
  "cat-6": "bg-cat-6/10",
  "cat-7": "bg-cat-7/10",
  "cat-8": "bg-cat-8/10",
};

export const CATEGORY_SOLID: Record<CategoryColorToken, string> = {
  "cat-1": "bg-cat-1",
  "cat-2": "bg-cat-2",
  "cat-3": "bg-cat-3",
  "cat-4": "bg-cat-4",
  "cat-5": "bg-cat-5",
  "cat-6": "bg-cat-6",
  "cat-7": "bg-cat-7",
  "cat-8": "bg-cat-8",
};

const KNOWN_CATEGORIES: Record<string, { icon: LucideIcon; color: CategoryColorToken }> = {
  Streaming: { icon: Clapperboard, color: "cat-1" },
  "AI Tools": { icon: Bot, color: "cat-2" },
  Utilitas: { icon: Wifi, color: "cat-3" },
};

const DEFAULT_CATEGORY: { icon: LucideIcon; color: CategoryColorToken } = {
  icon: CircleDollarSign,
  color: "cat-4",
};

function categoryIconIdentity(name: string | null | undefined): {
  icon: LucideIcon;
  color: CategoryColorToken;
} {
  if (!name) return DEFAULT_CATEGORY;
  const known = KNOWN_CATEGORIES[name];
  if (known) return known;
  const { color } = categoryIdentity(name);
  return { icon: DEFAULT_CATEGORY.icon, color };
}

export function CategoryIcon({
  name,
  size = CATEGORY_ICON_SIZE.md,
  className = "",
}: {
  name: string | null | undefined;
  size?: number;
  className?: string;
}) {
  const { icon: Icon, color } = categoryIconIdentity(name);
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-lg ${TINT_BG[color]} ${TEXT_COLOR[color]} ${className}`}
      style={{ width: size, height: size }}
    >
      <Icon className="h-5 w-5" strokeWidth={1.75} />
    </span>
  );
}