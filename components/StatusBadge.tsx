"use client";

import type { Status } from "@/lib/types";
import { Badge } from "./ui/Badge";

const STATUS_LABEL: Record<Status, string> = {
  active: "Aktif",
  paused: "Dijeda",
  overdue: "Terlewat",
  cancelled: "Dibatalkan",
};

const STATUS_VARIANT: Record<Status, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  paused: "secondary",
  overdue: "destructive",
  cancelled: "outline",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge variant={STATUS_VARIANT[status]} className="capitalize">
      {STATUS_LABEL[status]}
    </Badge>
  );
}