import * as React from "react";

export const Field = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => {
  return (
    <label
      ref={ref}
      className={`ds-field ${className || ""}`.trim()}
      {...props}
    />
  );
});
Field.displayName = "Field";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`ds-input ${className || ""}`.trim()}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
