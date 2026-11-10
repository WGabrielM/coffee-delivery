import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { accessibilityViolations } from "../../test/axe";
import { LoadingState } from "./LoadingState";

describe("LoadingState", () => {
  it("is an output with the text, so a screen reader hears it as a status", () => {
    render(<LoadingState text="Loading your order…" />);

    const status = screen.getByRole("status");

    expect(status.tagName).toBe("OUTPUT");
    expect(status).toHaveTextContent("Loading your order…");
  });

  it("draws a spinner that is hidden from assistive technology and stops under reduced motion", () => {
    const { container } = render(<LoadingState text="Loading coffees…" />);

    const spinner = container.querySelector("[data-spinner]");

    expect(spinner).toHaveAttribute("aria-hidden", "true");
    expect(spinner).toHaveClass("animate-spin", "motion-reduce:animate-none");
    expect(spinner).toHaveClass(
      "size-6",
      "rounded-round",
      "border-2",
      "border-button",
      "border-t-purple",
    );
  });

  it("puts the spinner before the text, in a row with a 12 px gap", () => {
    const { container } = render(<LoadingState text="Loading payment methods…" />);

    const status = screen.getByRole("status");

    expect(status).toHaveClass("flex", "items-center", "gap-3", "type-text-regular-m", "text-text");
    expect(status.firstElementChild).toBe(container.querySelector("[data-spinner]"));
  });

  it("has no accessibility violation", async () => {
    const { container } = render(<LoadingState text="Loading…" />);

    expect(await accessibilityViolations(container)).toEqual([]);
  });
});
