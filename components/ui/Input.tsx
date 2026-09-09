import * as React from "react";

const CONTROL_CLASS = "ds-input";

type FieldProps = React.HTMLAttributes<HTMLDivElement> & {
  label: React.ReactNode;
  htmlFor: string;
  required?: boolean;
  helperText?: React.ReactNode;
  error?: React.ReactNode;
};

export function Field({ label, htmlFor, required = false, helperText, error, className, children, ...props }: FieldProps) {
  const messageId = error || helperText ? `${htmlFor}-message` : undefined;
  return (
    <div className={`ds-field ${className || ""}`.trim()} {...props}>
      <label htmlFor={htmlFor} className="ds-field-label">
        {label}{required && <span aria-hidden="true" className="text-rose-600"> *</span>}
      </label>
      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<{ "aria-describedby"?: string; "aria-invalid"?: boolean }>, {
            "aria-describedby": messageId,
            "aria-invalid": error ? true : undefined,
          })
        : children}
      {error ? <p id={messageId} className="ds-field-error" role="alert">{error}</p> : helperText ? <p id={messageId} className="ds-field-helper">{helperText}</p> : null}
    </div>
  );
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input ref={ref} className={`${CONTROL_CLASS} ${className || ""}`.trim()} {...props} />
));
Input.displayName = "Input";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, ...props }, ref) => (
  <select ref={ref} className={`${CONTROL_CLASS} ${className || ""}`.trim()} {...props} />
));
Select.displayName = "Select";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={`${CONTROL_CLASS} ds-textarea ${className || ""}`.trim()} {...props} />
));
Textarea.displayName = "Textarea";

type InputWithAdornmentProps = InputProps & { leadingAdornment?: React.ReactNode; trailingAdornment?: React.ReactNode };

export const InputWithAdornment = React.forwardRef<HTMLInputElement, InputWithAdornmentProps>(({ className, leadingAdornment, trailingAdornment, ...props }, ref) => (
  <div className="ds-input-adornment">
    {leadingAdornment && <span className="ds-input-leading" aria-hidden="true">{leadingAdornment}</span>}
    <Input ref={ref} className={`${leadingAdornment ? "ds-input-has-leading" : ""} ${trailingAdornment ? "ds-input-has-trailing" : ""} ${className || ""}`.trim()} {...props} />
    {trailingAdornment && <span className="ds-input-trailing">{trailingAdornment}</span>}
  </div>
));
InputWithAdornment.displayName = "InputWithAdornment";

export function FieldGroup({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`ds-field-group ${className || ""}`.trim()} {...props}>{children}</div>;
}
