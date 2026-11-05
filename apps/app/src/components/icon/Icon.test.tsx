import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ICON_NAMES } from "../../assets";
import { accessibilityViolations } from "../../test/axe";
import { Icon } from "./Icon";

describe("Icon", () => {
  it.each(ICON_NAMES)("draws %s inline, hidden from assistive technology", (name) => {
    const { container } = render(<Icon name={name} />);

    const wrapper = container.firstElementChild;

    expect(wrapper).toHaveAttribute("aria-hidden", "true");
    expect(wrapper?.querySelector("svg path")).not.toBeNull();
  });

  it("passes the size and color classes to the wrapper and makes the svg fill it", () => {
    const { container } = render(<Icon name="trash" className="size-4 text-purple" />);

    expect(container.firstElementChild).toHaveClass("size-4", "text-purple", "[&>svg]:size-full");
  });

  it("passes an axe check", async () => {
    const { container } = render(<Icon name="coffee-fill" />);

    expect(await accessibilityViolations(container)).toEqual([]);
  });
});
