import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { heroImage } from "../../../assets";
import { accessibilityViolations } from "../../../test/axe";
import { Hero } from "./Hero";

const benefits = [
  { text: "Simple and secure purchase", circle: "bg-yellow-dark" },
  { text: "Packaging keeps the coffee intact", circle: "bg-text" },
  { text: "Fast and tracked delivery", circle: "bg-yellow" },
  { text: "Your coffee arrives fresh to you", circle: "bg-purple" },
] as const;

describe("Hero", () => {
  it("has the one heading of the hero, an h1 in Title XL and the title color", () => {
    render(<Hero />);

    const heading = screen.getByRole("heading", { level: 1 });

    expect(heading).toHaveTextContent("Find the perfect coffee for any time of day");
    expect(screen.getAllByRole("heading")).toHaveLength(1);
    expect(heading).toHaveClass("type-title-xl", "text-title");
  });

  it("has the subtitle in Roboto 20 and the subtitle color", () => {
    render(<Hero />);

    const subtitle = screen.getByText(
      "With Coffee Delivery you get your coffee wherever you are, at any time",
    );

    expect(subtitle).toHaveClass("type-text-regular-l", "text-subtitle");
  });

  it("lists the four benefits in order", () => {
    render(<Hero />);

    const items = within(screen.getByRole("list")).getAllByRole("listitem");

    expect(items.map((item) => item.textContent)).toEqual(benefits.map(({ text }) => text));
  });

  it.each(benefits)(
    'draws "$text" with a 32 px $circle circle and a decorative icon',
    ({ text, circle }) => {
      render(<Hero />);

      const disc = screen.getByText(text).closest("li")?.querySelector("[aria-hidden='true']");

      expect(disc).toHaveClass("size-8", "rounded-round", circle);
      expect(disc?.querySelector("svg")).not.toBeNull();
    },
  );

  it("uses a different icon for each benefit", () => {
    render(<Hero />);

    const icons = benefits.map(
      ({ text }) => screen.getByText(text).closest("li")?.querySelector("svg")?.innerHTML,
    );

    expect(new Set(icons).size).toBe(4);
  });

  it("shows the cup image at 476 by 360 with an empty alt, because the text carries the meaning", () => {
    const { container } = render(<Hero />);

    const image = container.querySelector("img");

    expect(image).toHaveAttribute("src", heroImage);
    expect(image).toHaveAttribute("alt", "");
    expect(image).toHaveAttribute("width", "476");
    expect(image).toHaveAttribute("height", "360");
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("puts a 544 px intro column before the image", () => {
    const { container } = render(<Hero />);

    const intro = screen.getByRole("heading", { level: 1 }).parentElement as HTMLElement;
    const image = container.querySelector("img") as HTMLElement;

    expect(intro).toHaveClass("w-136");
    expect(intro.compareDocumentPosition(image) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("draws the background shapes with styles, not images, and hides them from assistive technology", () => {
    const { container } = render(<Hero />);

    const shapes = container.querySelector("[data-hero-shapes]");

    expect(shapes).toHaveAttribute("aria-hidden", "true");
    expect(shapes?.querySelectorAll("img, svg")).toHaveLength(0);
    expect(shapes?.innerHTML).toContain("bg-hero-blob");
    expect(shapes?.innerHTML).toContain("bg-purple-light");
    expect(container.querySelectorAll("img")).toHaveLength(1);
  });

  it("has no button, link, or form control", () => {
    render(<Hero />);

    const found = (["button", "link", "textbox"] as const).flatMap((role) =>
      screen.queryAllByRole(role).map(() => role),
    );

    expect(found).toEqual([]);
  });

  it("passes an axe check", async () => {
    const { container } = render(<Hero />);

    expect(await accessibilityViolations(container)).toEqual([]);
  });
});
