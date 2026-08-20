import * as React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  kind?: "primary" | "secondary";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, kind = "primary", ...props }, ref) => {
    const rootClass = kind === "primary" ? "ds-btn-primary" : "ds-btn-secondary";
    return (
      <button
        ref={ref}
        className={`${rootClass} ${className || ""}`.trim()}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
