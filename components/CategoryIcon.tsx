import { categoryIdentity, type CategoryColorToken } from "@/lib/categories";

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

export function CategoryIcon({
  name,
  size = 36,
  className = "",
}: {
  name: string | null | undefined;
  size?: number;
  className?: string;
}) {
  const { icon: Icon, color } = categoryIdentity(name);
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