import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { accessibilityViolations } from "../../test/axe";
import { Tag } from "./Tag";

describe("Tag", () => {
  describe("label (the coffee tag)", () => {
    it("renders its text with the original case and uppercases it through styling", () => {
      render(<Tag>Traditional</Tag>);

      const tag = screen.getByText("Traditional");

      expect(tag.textContent).toBe("Traditional");
      expect(tag).toHaveClass("type-tag");
    });

    it("has the yellow-light pill with yellow-dark text of the design", () => {
      render(<Tag>With milk</Tag>);

      expect(screen.getByText("With milk")).toHaveClass(
        "rounded-tag",
        "bg-yellow-light",
        "text-yellow-dark",
      );
    });

    it("is not interactive: no button, no aria-pressed", () => {
      render(<Tag>Iced</Tag>);

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      expect(screen.getByText("Iced")).not.toHaveAttribute("aria-pressed");
    });
  });

  describe("filter chip", () => {
    it("is a native button that toggles, with aria-pressed false when unselected", () => {
      render(
        <Tag variant="filter" pressed={false} onPressedChange={() => {}}>
          Special
        </Tag>,
      );

      const chip = screen.getByRole("button", { name: "Special" });

      expect(chip.tagName).toBe("BUTTON");
      expect(chip).toHaveAttribute("type", "button");
      expect(chip).toHaveAttribute("aria-pressed", "false");
    });

    it("has aria-pressed true when selected", () => {
      render(
        <Tag variant="filter" pressed onPressedChange={() => {}}>
          Special
        </Tag>,
      );

      expect(screen.getByRole("button", { name: "Special" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });

    it("asks for the opposite value when clicked", async () => {
      const onPressedChange = vi.fn<(pressed: boolean) => void>();
      const { rerender } = render(
        <Tag variant="filter" pressed={false} onPressedChange={onPressedChange}>
          Special
        </Tag>,
      );

      await userEvent.click(screen.getByRole("button"));
      rerender(
        <Tag variant="filter" pressed onPressedChange={onPressedChange}>
          Special
        </Tag>,
      );
      await userEvent.click(screen.getByRole("button"));

      expect(onPressedChange).toHaveBeenNthCalledWith(1, true);
      expect(onPressedChange).toHaveBeenNthCalledWith(2, false);
    });

    it("toggles from the keyboard with Enter and Space", async () => {
      const onPressedChange = vi.fn<(pressed: boolean) => void>();
      render(
        <Tag variant="filter" pressed={false} onPressedChange={onPressedChange}>
          Special
        </Tag>,
      );

      await userEvent.tab();
      await userEvent.keyboard("{Enter}");
      await userEvent.keyboard(" ");

      expect(onPressedChange).toHaveBeenCalledTimes(2);
    });

    it("keeps the text case and uppercases it through styling", () => {
      render(
        <Tag variant="filter" pressed={false} onPressedChange={() => {}}>
          With milk
        </Tag>,
      );

      const chip = screen.getByRole("button");

      expect(chip.textContent).toBe("With milk");
      expect(chip).toHaveClass("type-tag-l");
    });

    it("shows the unselected chip with a yellow border and the selected one filled", () => {
      const { rerender } = render(
        <Tag variant="filter" pressed={false} onPressedChange={() => {}}>
          Iced
        </Tag>,
      );

      expect(screen.getByRole("button")).toHaveClass("border-yellow", "text-yellow-dark");
      expect(screen.getByRole("button")).not.toHaveClass("bg-yellow");

      rerender(
        <Tag variant="filter" pressed onPressedChange={() => {}}>
          Iced
        </Tag>,
      );

      expect(screen.getByRole("button")).toHaveClass("bg-yellow", "text-white");
    });

    it("has a target of at least 24 px and a keyboard-only focus ring", () => {
      render(
        <Tag variant="filter" pressed={false} onPressedChange={() => {}}>
          Iced
        </Tag>,
      );

      expect(screen.getByRole("button")).toHaveClass("min-h-6", "focus-visible:outline-2");
    });

    it("requires pressed and onPressedChange", () => {
      const invalid = [
        // @ts-expect-error a filter chip needs its pressed state and its handler
        <Tag key="1" variant="filter">
          Special
        </Tag>,
      ];

      expect(invalid).toHaveLength(1);
    });
  });

  it("passes an axe check for the tag and both chip states", async () => {
    const { container } = render(
      <>
        <Tag>Traditional</Tag>
        <Tag variant="filter" pressed={false} onPressedChange={() => {}}>
          Special
        </Tag>
        <Tag variant="filter" pressed onPressedChange={() => {}}>
          Iced
        </Tag>
      </>,
    );

    expect(await accessibilityViolations(container)).toEqual([]);
  });
});
