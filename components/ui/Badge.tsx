import * as React from "react";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variantClass = {
      default: "ds-chip-default",
      secondary: "ds-chip-secondary",
      destructive: "ds-chip-destructive",
      outline: "ds-chip-outline",
    }[variant];

    return (
      <span
        ref={ref}
        className={`ds-chip ${variantClass} ${className || ""}`.trim()}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";