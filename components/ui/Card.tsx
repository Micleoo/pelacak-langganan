import * as React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`ds-card ${className || ""}`.trim()}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";
