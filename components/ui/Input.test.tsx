import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Field, Input, InputWithAdornment, Select, Textarea } from "./Input";

describe("form presentation primitives", () => {
  it("associates labels, helper text, and errors with its control", () => {
    render(
      <Field label="Email" htmlFor="email" required error="Email wajib diisi.">
        <Input id="email" />
      </Field>,
    );

    const input = screen.getByLabelText(/email/i);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe("email-message");
    expect(screen.getByRole("alert").textContent).toContain("Email wajib diisi.");
  });

  it("shares the standard control recipe across input, select, and textarea", () => {
    render(<><Input aria-label="Input" /><Select aria-label="Select"><option>IDR</option></Select><Textarea aria-label="Textarea" /></>);
    expect(screen.getByLabelText("Input").classList.contains("ds-input")).toBe(true);
    expect(screen.getByLabelText("Select").classList.contains("ds-input")).toBe(true);
    expect(screen.getByLabelText("Textarea").classList.contains("ds-input")).toBe(true);
    expect(screen.getByLabelText("Textarea").classList.contains("ds-textarea")).toBe(true);
  });

  it("keeps adornments outside the input while preserving native input attributes", () => {
    render(<InputWithAdornment aria-label="Nominal" disabled leadingAdornment={<span>Rp</span>} />);
    expect((screen.getByLabelText("Nominal") as HTMLInputElement).disabled).toBe(true);
    expect(screen.getByText("Rp").parentElement?.classList.contains("ds-input-leading")).toBe(true);
  });
});
