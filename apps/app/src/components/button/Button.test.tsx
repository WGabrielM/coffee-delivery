import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { accessibilityViolations } from "../../test/axe";
import { Button } from "./Button";

describe("Button", () => {
  it("renders a native button that does not submit a form by default", () => {
    render(<Button>Confirm order</Button>);

    const button = screen.getByRole("button", { name: "Confirm order" });

    expect(button.tagName).toBe("BUTTON");
    expect(button).toHaveAttribute("type", "button");
  });

  it("can be a submit button", () => {
    render(<Button type="submit">Confirm order</Button>);

    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn<() => void>();
    render(<Button onClick={onClick}>Confirm order</Button>);

    await userEvent.click(screen.getByRole("button"));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("calls onClick from the keyboard with Enter and Space", async () => {
    const onClick = vi.fn<() => void>();
    render(<Button onClick={onClick}>Confirm order</Button>);

    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");

    expect(onClick).toHaveBeenCalledTimes(2);
  });

  describe("variants", () => {
    it("primary is the yellow action with white text", () => {
      render(<Button>Confirm order</Button>);

      expect(screen.getByRole("button")).toHaveClass("bg-yellow", "text-white", "type-button-g");
    });

    it("primary is the default variant and can fill its container", () => {
      render(
        <Button variant="primary" fullWidth>
          Confirm order
        </Button>,
      );

      expect(screen.getByRole("button")).toHaveClass("w-full");
    });

    it("secondary is the neutral action with a trash icon in the design", () => {
      render(
        <Button variant="secondary" icon="trash">
          Remove
        </Button>,
      );

      const button = screen.getByRole("button", { name: "Remove" });

      expect(button).toHaveClass("bg-button", "text-text", "type-button-s");
      expect(button.querySelector("svg")).not.toBeNull();
    });

    it("icon is a 38 by 38 purple-dark square named by aria-label", () => {
      render(<Button variant="icon" icon="shopping-cart-fill" aria-label="Add Latte to cart" />);

      const button = screen.getByRole("button", { name: "Add Latte to cart" });

      expect(button).toHaveClass("bg-purple-dark", "size-9.5");
      expect(button.querySelector("svg")).not.toBeNull();
    });

    it("hides the decorative icon from assistive technology", () => {
      render(<Button variant="icon" icon="shopping-cart-fill" aria-label="Add to cart" />);

      const icon = screen.getByRole("button").querySelector("svg")?.parentElement;

      expect(icon).toHaveAttribute("aria-hidden", "true");
    });

    it("requires an aria-label on an icon button without a text label", () => {
      // The elements are only created: each line must fail to type-check, and `tsc` fails if one compiles.
      const invalid = [
        // @ts-expect-error an icon button without aria-label must not compile
        <Button key="1" variant="icon" icon="trash" />,
        // @ts-expect-error an icon button takes no text children, so it cannot replace the label
        <Button key="2" variant="icon" icon="trash">
          Remove
        </Button>,
        // @ts-expect-error the primary variant needs a text label
        <Button key="3" variant="primary" />,
      ];

      expect(invalid).toHaveLength(3);
    });
  });

  describe("disabled", () => {
    it("blocks clicks", async () => {
      const onClick = vi.fn<() => void>();
      render(
        <Button disabled onClick={onClick}>
          Confirm order
        </Button>,
      );

      await userEvent.click(screen.getByRole("button"));

      expect(screen.getByRole("button")).toBeDisabled();
      expect(onClick).not.toHaveBeenCalled();
    });

    it("looks different: dimmed, a not-allowed cursor, and no hover color", () => {
      render(<Button disabled>Confirm order</Button>);

      const button = screen.getByRole("button");

      expect(button).toHaveClass("disabled:opacity-50", "disabled:cursor-not-allowed");
      expect(button.className).toContain("enabled:hover:");
      expect(button.className).not.toMatch(/(^|\s)hover:/);
    });

    it("is skipped by the Tab key", async () => {
      render(
        <>
          <Button disabled>First</Button>
          <Button>Second</Button>
        </>,
      );

      await userEvent.tab();

      expect(screen.getByRole("button", { name: "Second" })).toHaveFocus();
    });
  });

  describe("focus ring", () => {
    it("is an outline on keyboard focus only (focus-visible), never on mouse focus", () => {
      render(<Button>Confirm order</Button>);

      const classes = screen.getByRole("button").className.split(/\s+/);

      expect(classes).toContain("focus-visible:outline-2");
      expect(classes).toContain("focus-visible:outline-purple");
      expect(classes).toContain("focus-visible:outline-offset-2");
      expect(classes.some((name) => name.startsWith("focus:"))).toBe(false);
    });

    it("is on every variant", () => {
      render(
        <>
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="icon" icon="trash" aria-label="Icon" />
        </>,
      );

      for (const button of screen.getAllByRole("button")) {
        expect(button).toHaveClass("focus-visible:outline-2");
      }
    });
  });

  it("passes an axe check in every variant and state", async () => {
    const { container } = render(
      <>
        <Button>Primary</Button>
        <Button disabled>Disabled</Button>
        <Button variant="secondary" icon="trash">
          Remove
        </Button>
        <Button variant="icon" icon="shopping-cart-fill" aria-label="Add Latte to cart" />
      </>,
    );

    expect(await accessibilityViolations(container)).toEqual([]);
  });
});
