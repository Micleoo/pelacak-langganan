import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={`ds-chip ${className || ""}`.trim()}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";
