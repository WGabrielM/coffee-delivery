import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { accessibilityViolations } from "../../test/axe";
import { Input } from "./Input";

describe("Input", () => {
  it("is named by a visually hidden label", () => {
    render(<Input label="ZIP code" placeholder="ZIP code" />);

    const input = screen.getByRole("textbox", { name: "ZIP code" });
    const label = screen.getByText("ZIP code", { selector: "label" });

    expect(input).toBeInTheDocument();
    expect(label).toHaveClass("sr-only");
    expect(label).toHaveAttribute("for", input.id);
  });

  it("gives two inputs different ids, so each label names its own field", () => {
    render(
      <>
        <Input label="Street" />
        <Input label="City" />
      </>,
    );

    expect(screen.getByLabelText("Street")).not.toBe(screen.getByLabelText("City"));
    expect(screen.getByLabelText("Street").id).not.toBe(screen.getByLabelText("City").id);
  });

  it("has the 42 px height, radius 4, and idle border of the design", () => {
    render(<Input label="Street" />);

    expect(screen.getByRole("textbox")).toHaveClass(
      "h-10.5",
      "rounded-input",
      "bg-input",
      "border-button",
      "text-text",
      "placeholder:text-label",
    );
  });

  it("turns the border yellow-dark when focused and when filled", () => {
    render(<Input label="Street" placeholder="Street" />);

    const classes = screen.getByRole("textbox").className.split(/\s+/);

    expect(classes).toContain("focus:border-yellow-dark");
    expect(classes).toContain("not-placeholder-shown:border-yellow-dark");
  });

  it("shows the focus outline of the field, which is not removed without a replacement", () => {
    render(<Input label="Street" />);

    const classes = screen.getByRole("textbox").className.split(/\s+/);

    expect(classes).toContain("focus:outline-1");
    expect(classes).toContain("focus:outline-yellow-dark");
  });

  it("matches the filled style even without a placeholder, through a single space", () => {
    render(<Input label="Street" />);

    expect(screen.getByRole("textbox")).toHaveAttribute("placeholder", " ");
  });

  it("keeps the placeholder it is given", () => {
    render(<Input label="Street" placeholder="Street" />);

    expect(screen.getByPlaceholderText("Street")).toBeInTheDocument();
  });

  it("passes native props, a typed value, and the ref to the input", async () => {
    const ref = createRef<HTMLInputElement>();
    const onChange = vi.fn<() => void>();
    render(
      <Input
        ref={ref}
        label="ZIP code"
        name="zipCode"
        inputMode="numeric"
        autoComplete="postal-code"
        onChange={onChange}
      />,
    );

    await userEvent.type(screen.getByRole("textbox"), "90250");

    expect(ref.current).toBe(screen.getByRole("textbox"));
    expect(ref.current).toHaveAttribute("name", "zipCode");
    expect(ref.current).toHaveAttribute("inputmode", "numeric");
    expect(ref.current).toHaveAttribute("autocomplete", "postal-code");
    expect(ref.current).toHaveValue("90250");
    expect(onChange).toHaveBeenCalledTimes(5);
  });

  describe("optional hint", () => {
    it("shows the hint at the right and describes the field with it", () => {
      render(<Input label="Complement" hint="Optional" />);

      expect(screen.getByText("Optional")).toBeInTheDocument();
      expect(screen.getByRole("textbox")).toHaveAccessibleDescription("Optional");
      expect(screen.getByText("Optional")).toHaveClass("right-3");
    });

    it("leaves room for the hint so the text never runs under it", () => {
      render(<Input label="Complement" hint="Optional" />);

      expect(screen.getByRole("textbox")).toHaveClass("pr-20");
    });

    it("shows no hint by default", () => {
      render(<Input label="Street" />);

      expect(screen.queryByText("Optional")).not.toBeInTheDocument();
      expect(screen.getByRole("textbox")).not.toHaveAttribute("aria-describedby");
    });
  });

  describe("error", () => {
    it("is valid by default: no aria-invalid, no message", () => {
      render(<Input label="ZIP code" />);

      expect(screen.getByRole("textbox")).not.toHaveAttribute("aria-invalid");
      expect(screen.getByRole("textbox")).toHaveClass("border-button");
      expect(screen.getByRole("textbox")).not.toHaveClass("border-error");
    });

    it("shows the message below, uses the error border, and sets aria-invalid", () => {
      render(<Input label="ZIP code" error="Enter a ZIP code like 90250-440." />);

      const input = screen.getByRole("textbox", { name: "ZIP code" });
      const message = screen.getByText("Enter a ZIP code like 90250-440.");

      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(input).toHaveClass("border-error");
      expect(input).not.toHaveClass("border-button");
      expect(message).toHaveClass("text-error");
    });

    it("links the message to the field with aria-describedby", () => {
      render(<Input label="ZIP code" error="Enter a ZIP code like 90250-440." />);

      const input = screen.getByRole("textbox");
      const message = screen.getByText("Enter a ZIP code like 90250-440.");

      expect(input.getAttribute("aria-describedby")?.split(" ")).toContain(message.id);
      expect(input).toHaveAccessibleDescription("Enter a ZIP code like 90250-440.");
    });

    it("describes the field with both the hint and the message", () => {
      render(<Input label="Complement" hint="Optional" error="Too long." />);

      expect(screen.getByRole("textbox")).toHaveAccessibleDescription("Optional Too long.");
    });

    it("announces a message that appears after the first render", () => {
      render(<Input label="ZIP code" error="Required." />);

      expect(screen.getByText("Required.")).toHaveAttribute("aria-live", "polite");
    });

    it("removes the message and aria-invalid when the error is cleared", () => {
      const { rerender } = render(<Input label="ZIP code" error="Required." />);

      rerender(<Input label="ZIP code" />);

      expect(screen.queryByText("Required.")).not.toBeInTheDocument();
      expect(screen.getByRole("textbox")).not.toHaveAttribute("aria-invalid");
      expect(screen.getByRole("textbox")).not.toHaveAttribute("aria-describedby");
    });

    it("keeps the error border when the field has focus", async () => {
      render(<Input label="ZIP code" error="Required." />);

      await userEvent.click(screen.getByRole("textbox"));

      expect(screen.getByRole("textbox")).toHaveClass("border-error");
      expect(screen.getByRole("textbox").className).not.toContain("focus:border-yellow-dark");
    });
  });

  it("can be disabled", () => {
    render(<Input label="Street" disabled />);

    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("passes an axe check: idle, with a hint, and with an error", async () => {
    const { container } = render(
      <>
        <Input label="Street" placeholder="Street" />
        <Input label="Complement" hint="Optional" />
        <Input label="ZIP code" error="Enter a ZIP code like 90250-440." />
      </>,
    );

    expect(await accessibilityViolations(container)).toEqual([]);
  });
});
