import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { accessibilityViolations } from "../../../test/axe";
import { CoffeeFilters } from "./CoffeeFilters";

const chipNames = ["Traditional", "Special", "With milk", "Alcoholic", "Iced"];

function chips() {
  return within(screen.getByRole("group", { name: "Filter by tag" })).getAllByRole("button");
}

describe("CoffeeFilters", () => {
  it("is a group named Filter by tag with the five chips in order", () => {
    render(<CoffeeFilters selected={[]} onChange={() => {}} />);

    expect(chips().map((chip) => chip.textContent)).toEqual(chipNames);
  });

  it("makes each chip a toggle button: aria-pressed false when nothing is selected", () => {
    render(<CoffeeFilters selected={[]} onChange={() => {}} />);

    for (const chip of chips()) expect(chip).toHaveAttribute("aria-pressed", "false");
  });

  it("marks the selected chips as pressed", () => {
    render(<CoffeeFilters selected={["special", "iced"]} onChange={() => {}} />);

    expect(chips().map((chip) => chip.getAttribute("aria-pressed"))).toEqual([
      "false",
      "true",
      "false",
      "false",
      "true",
    ]);
  });

  it("selects a chip: onChange gets the slugs in chip order, not in the order they were picked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<(selected: string[]) => void>();
    render(<CoffeeFilters selected={["iced"]} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Special" }));

    expect(onChange).toHaveBeenCalledExactlyOnceWith(["special", "iced"]);
  });

  it("unselects a pressed chip", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<(selected: string[]) => void>();
    render(<CoffeeFilters selected={["special", "iced"]} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Special" }));

    expect(onChange).toHaveBeenCalledExactlyOnceWith(["iced"]);
  });

  it("has no Clear filters button while nothing is selected", () => {
    render(<CoffeeFilters selected={[]} onChange={() => {}} />);

    expect(screen.queryByRole("button", { name: "Clear filters" })).not.toBeInTheDocument();
  });

  it("shows Clear filters next to the chips when a chip is selected, and it unselects all", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<(selected: string[]) => void>();
    render(<CoffeeFilters selected={["special"]} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Clear filters" }));

    expect(onChange).toHaveBeenCalledExactlyOnceWith([]);
  });

  it("is reachable and togglable with the keyboard", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<(selected: string[]) => void>();
    render(<CoffeeFilters selected={[]} onChange={onChange} />);

    await user.tab();
    expect(screen.getByRole("button", { name: "Traditional" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Special" })).toHaveFocus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");

    expect(onChange).toHaveBeenNthCalledWith(1, ["special"]);
    expect(onChange).toHaveBeenNthCalledWith(2, ["special"]);
  });

  it("has no accessibility violation, with and without a selection", async () => {
    const { container, rerender } = render(<CoffeeFilters selected={[]} onChange={() => {}} />);
    expect(await accessibilityViolations(container)).toEqual([]);

    rerender(<CoffeeFilters selected={["special", "iced"]} onChange={() => {}} />);
    expect(await accessibilityViolations(container)).toEqual([]);
  });
});
