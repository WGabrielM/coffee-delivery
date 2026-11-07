import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { coffeeImages } from "../../../assets";
import { accessibilityViolations } from "../../../test/axe";
import { CoffeePhoto } from "./CoffeePhoto";

describe("CoffeePhoto", () => {
  it("shows the photo of the slug with the name as alt text and the size as width and height", () => {
    render(<CoffeePhoto slug="latte" name="Latte" size={64} className="size-16" />);

    const photo = screen.getByRole("img", { name: "Latte" });

    expect(photo).toHaveAttribute("src", coffeeImages.latte);
    expect(photo).toHaveAttribute("width", "64");
    expect(photo).toHaveAttribute("height", "64");
    expect(photo).toHaveClass("size-16");
  });

  it("draws an empty, hidden, round placeholder for a slug with no photo", () => {
    const { container } = render(
      <CoffeePhoto slug="unknown-brew" name="Unknown Brew" size={64} className="size-16" />,
    );

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    const placeholder = container.querySelector("[data-photo-placeholder]");
    expect(placeholder).toHaveAttribute("aria-hidden", "true");
    expect(placeholder).toHaveClass("size-16", "bg-hover");
  });

  it("has no accessibility violation", async () => {
    const { container } = render(<CoffeePhoto slug="latte" name="Latte" size={64} className="" />);

    expect(await accessibilityViolations(container)).toEqual([]);
  });
});
