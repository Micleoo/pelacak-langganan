import * as React from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  kind?: "primary" | "secondary";
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, kind = "primary", loading = false, disabled, children, ...props }, ref) => {
    const rootClass = kind === "primary" ? "ds-btn-primary" : "ds-btn-secondary";
    return (
      <button
        ref={ref}
        className={`${rootClass} ${className || ""}`.trim()}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
