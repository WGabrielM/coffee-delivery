import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { accessibilityViolations } from "../../test/axe";
import { Badge } from "./Badge";

describe("Badge", () => {
  it.each([1, 3, 10, 99])("renders the number %i", (count) => {
    render(<Badge count={count} />);

    expect(screen.getByText(String(count))).toBeInTheDocument();
  });

  it.each([100, 101, 250])("renders 99+ above 99 (%i)", (count) => {
    render(<Badge count={count} />);

    expect(screen.getByText("99+")).toBeInTheDocument();
    expect(screen.queryByText(String(count))).not.toBeInTheDocument();
  });

  it("renders nothing when the number is 0", () => {
    const { container } = render(<Badge count={0} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for a negative number", () => {
    const { container } = render(<Badge count={-2} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("is a 20 by 20 yellow-dark circle with a white bold number", () => {
    render(<Badge count={3} />);

    expect(screen.getByText("3")).toHaveClass(
      "h-5",
      "min-w-5",
      "rounded-round",
      "bg-yellow-dark",
      "text-white",
      "type-text-bold-s",
    );
  });

  it("keeps the digits aligned with tabular numbers", () => {
    render(<Badge count={3} />);

    expect(screen.getByText("3")).toHaveClass("tabular-nums");
  });

  it("passes an axe check", async () => {
    const { container } = render(
      <>
        <Badge count={3} />
        <Badge count={120} />
        <Badge count={0} />
      </>,
    );

    expect(await accessibilityViolations(container)).toEqual([]);
  });
});
