import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { accessibilityViolations } from "./axe";

describe("accessibilityViolations", () => {
  it("is empty for an accessible button", async () => {
    const { container } = render(<button type="button">Save</button>);

    expect(await accessibilityViolations(container)).toEqual([]);
  });

  it("names the rule that an unlabeled button and an unlabeled input break", async () => {
    const { container } = render(
      <div>
        {/* oxlint-disable-next-line jsx-a11y/control-has-associated-label -- unlabeled on purpose: axe must flag it */}
        <button type="button" />
        <input type="text" />
      </div>,
    );

    const violations = await accessibilityViolations(container);

    expect(violations.some((violation) => violation.startsWith("button-name"))).toBe(true);
    expect(violations.some((violation) => violation.startsWith("label"))).toBe(true);
  });
});
