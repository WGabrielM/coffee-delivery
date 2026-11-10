import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { accessibilityViolations } from "../../test/axe";
import { ErrorState } from "./ErrorState";

describe("ErrorState", () => {
  it("is an alert with the message", () => {
    render(<ErrorState message="We couldn't load your order." />);

    const alert = screen.getByRole("alert");

    expect(alert).toHaveTextContent("We couldn't load your order.");
    expect(alert).toHaveClass("flex", "flex-col", "items-start", "gap-4");
    expect(screen.getByText("We couldn't load your order.")).toHaveClass(
      "type-text-regular-m",
      "text-text",
    );
  });

  it("has no button without onRetry", () => {
    render(<ErrorState message="Something failed." />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("has the secondary Try again button with onRetry, and calls it on a click", async () => {
    const onRetry = vi.fn<() => void>();
    render(<ErrorState message="We couldn't load the coffees." onRetry={onRetry} />);

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Try again" })).toHaveAttribute("type", "button");
  });

  it("has no accessibility violation, with or without the button", async () => {
    const { container, rerender } = render(<ErrorState message="Failed." />);
    expect(await accessibilityViolations(container)).toEqual([]);

    rerender(<ErrorState message="Failed." onRetry={() => {}} />);
    expect(await accessibilityViolations(container)).toEqual([]);
  });
});
