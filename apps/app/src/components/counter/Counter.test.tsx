import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { accessibilityViolations } from "../../test/axe";
import { MAX_QUANTITY, MIN_QUANTITY } from "../../lib/quantity-limits";
import { Counter } from "./Counter";

/** A parent that owns the value, one step below the maximum. */
function Controlled() {
  const [value, setValue] = useState(MAX_QUANTITY - 1);
  return <Counter label="Quantity" value={value} onChange={setValue} />;
}

describe("Counter", () => {
  it("has the limits of the business rule: 1 to 99", () => {
    expect(MIN_QUANTITY).toBe(1);
    expect(MAX_QUANTITY).toBe(99);
  });

  it("shows the value between a Decrease and an Increase button", () => {
    render(<Counter label="Quantity of Latte" value={3} onChange={() => {}} />);

    expect(screen.getByRole("button", { name: "Decrease quantity" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Increase quantity" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("3");
  });

  it("is a group with an accessible name", () => {
    render(<Counter label="Quantity of Latte" value={3} onChange={() => {}} />);

    expect(screen.getByRole("group", { name: "Quantity of Latte" })).toBeInTheDocument();
  });

  it("calls onChange with the new value on Increase and Decrease", async () => {
    const onChange = vi.fn<(value: number) => void>();
    render(<Counter label="Quantity" value={3} onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: "Increase quantity" }));
    await userEvent.click(screen.getByRole("button", { name: "Decrease quantity" }));

    expect(onChange).toHaveBeenNthCalledWith(1, 4);
    expect(onChange).toHaveBeenNthCalledWith(2, 2);
  });

  it("does not change its own value: the parent owns it", async () => {
    render(<Counter label="Quantity" value={3} onChange={() => {}} />);

    await userEvent.click(screen.getByRole("button", { name: "Increase quantity" }));

    expect(screen.getByRole("status")).toHaveTextContent("3");
  });

  it("marks Decrease unavailable at the minimum and never calls onChange below 1", async () => {
    const onChange = vi.fn<(value: number) => void>();
    render(<Counter label="Quantity" value={MIN_QUANTITY} onChange={onChange} />);

    const decrease = screen.getByRole("button", { name: "Decrease quantity" });
    await userEvent.click(decrease);

    expect(decrease).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("button", { name: "Increase quantity" })).not.toHaveAttribute(
      "aria-disabled",
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  it("marks Increase unavailable at the maximum and never calls onChange above 99", async () => {
    const onChange = vi.fn<(value: number) => void>();
    render(<Counter label="Quantity" value={MAX_QUANTITY} onChange={onChange} />);

    const increase = screen.getByRole("button", { name: "Increase quantity" });
    await userEvent.click(increase);

    expect(increase).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("button", { name: "Decrease quantity" })).not.toHaveAttribute(
      "aria-disabled",
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  it("keeps the keyboard focus on the button that reaches a limit", async () => {
    render(<Controlled />);
    const increase = screen.getByRole("button", { name: "Increase quantity" });
    increase.focus();

    await userEvent.keyboard("{Enter}");

    expect(screen.getByRole("status")).toHaveTextContent(String(MAX_QUANTITY));
    expect(increase).toHaveAttribute("aria-disabled", "true");
    expect(increase).toHaveFocus();
  });

  it("dims an unavailable button and removes its hover", () => {
    render(<Counter label="Quantity" value={MIN_QUANTITY} onChange={() => {}} />);

    expect(screen.getByRole("button", { name: "Decrease quantity" })).toHaveClass(
      "aria-disabled:opacity-50",
      "aria-disabled:cursor-not-allowed",
      "not-aria-disabled:hover:bg-hover",
    );
  });

  it("keeps both buttons available between the limits", () => {
    render(<Counter label="Quantity" value={2} onChange={() => {}} />);

    expect(screen.getByRole("button", { name: "Decrease quantity" })).not.toHaveAttribute(
      "aria-disabled",
    );
    expect(screen.getByRole("button", { name: "Increase quantity" })).not.toHaveAttribute(
      "aria-disabled",
    );
  });

  it("works from the keyboard", async () => {
    const onChange = vi.fn<(value: number) => void>();
    render(<Counter label="Quantity" value={5} onChange={onChange} />);

    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    await userEvent.tab();
    await userEvent.keyboard(" ");

    expect(onChange).toHaveBeenNthCalledWith(1, 4);
    expect(onChange).toHaveBeenNthCalledWith(2, 6);
  });

  it("has the 72 by 38 size of the card and the 72 by 32 compact size of the cart", () => {
    const { rerender } = render(<Counter label="Quantity" value={1} onChange={() => {}} />);
    const group = screen.getByRole("group");

    expect(group).toHaveClass("h-9.5", "w-18", "bg-button", "rounded-button");

    rerender(<Counter label="Quantity" value={1} size="compact" onChange={() => {}} />);

    expect(screen.getByRole("group")).toHaveClass("h-8", "w-18");
    expect(screen.getByRole("group")).not.toHaveClass("h-9.5");
  });

  it("gives each button a target of at least 24 by 24 px and a keyboard-only focus ring", () => {
    render(<Counter label="Quantity" value={2} size="compact" onChange={() => {}} />);

    for (const button of screen.getAllByRole("button")) {
      expect(button).toHaveClass("size-6", "focus-visible:outline-2");
    }
  });

  it("hides the plus and minus icons from assistive technology", () => {
    render(<Counter label="Quantity" value={2} onChange={() => {}} />);

    for (const button of screen.getAllByRole("button")) {
      expect(button.querySelector("[aria-hidden='true'] svg")).not.toBeNull();
    }
  });

  it("passes an axe check at the limits and in between", async () => {
    const { container } = render(
      <>
        <Counter label="First" value={MIN_QUANTITY} onChange={() => {}} />
        <Counter label="Second" value={5} size="compact" onChange={() => {}} />
        <Counter label="Third" value={MAX_QUANTITY} onChange={() => {}} />
      </>,
    );

    expect(await accessibilityViolations(container)).toEqual([]);
  });
});
