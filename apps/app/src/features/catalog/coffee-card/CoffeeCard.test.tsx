import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { coffeeImages } from "../../../assets";
import { accessibilityViolations } from "../../../test/axe";
import { cuban, latte, traditionalEspresso } from "../../../test/coffees";
import { CoffeeCard } from "./CoffeeCard";

describe("CoffeeCard", () => {
  it("is an article named by its name, a level 3 heading in Title S and the subtitle color", () => {
    render(<CoffeeCard coffee={traditionalEspresso} />);

    const card = screen.getByRole("article", { name: "Traditional Espresso" });
    const heading = within(card).getByRole("heading", { level: 3 });

    expect(heading).toHaveTextContent("Traditional Espresso");
    expect(heading).toHaveClass("type-title-s", "text-subtitle");
  });

  it("shows the photo of the slug, with the name as its alt text", () => {
    render(<CoffeeCard coffee={latte} />);

    const photo = screen.getByRole("img", { name: "Latte" });

    expect(photo).toHaveAttribute("src", coffeeImages.latte);
    expect(photo).toHaveAttribute("width", "120");
    expect(photo).toHaveAttribute("height", "120");
  });

  it("makes the photo round, 120 px, and lifts it 20 px over the top edge", () => {
    render(<CoffeeCard coffee={latte} />);

    expect(screen.getByRole("img", { name: "Latte" })).toHaveClass(
      "size-30",
      "-mt-5",
      "rounded-round",
    );
  });

  it("keeps the layout when the app has no photo for a slug: an empty round placeholder", () => {
    render(<CoffeeCard coffee={{ ...latte, slug: "unknown-brew", name: "Unknown Brew" }} />);

    const card = screen.getByRole("article", { name: "Unknown Brew" });

    expect(within(card).queryByRole("img")).not.toBeInTheDocument();
    expect(card.querySelector("[data-photo-placeholder]")).toHaveClass(
      "size-30",
      "-mt-5",
      "rounded-round",
    );
  });

  it("shows every tag in order, as labels", () => {
    render(<CoffeeCard coffee={cuban} />);

    const card = screen.getByRole("article", { name: "Cuban" });

    const tags = ["Special", "Alcoholic", "Iced"].map((name) => within(card).getByText(name));
    expect(tags.map((tag) => tag.textContent)).toEqual(["Special", "Alcoholic", "Iced"]);
    for (const tag of tags) expect(tag).toHaveClass("type-tag", "bg-yellow-light");
    // The DOM order is the order of the API.
    expect(
      tags[0]!.compareDocumentPosition(tags[1]!) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      tags[1]!.compareDocumentPosition(tags[2]!) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("shows no tag label when the coffee has none", () => {
    render(<CoffeeCard coffee={{ ...latte, tags: [] }} />);

    expect(screen.queryByText("Traditional")).not.toBeInTheDocument();
    expect(screen.queryByText("With milk")).not.toBeInTheDocument();
  });

  it("shows the description in Text Regular S and the label color", () => {
    render(<CoffeeCard coffee={traditionalEspresso} />);

    expect(
      screen.getByText("The traditional coffee made with hot water and ground beans"),
    ).toHaveClass("type-text-regular-s", "text-label");
  });

  it("splits the price: a small symbol next to the large amount", () => {
    render(<CoffeeCard coffee={cuban} />);

    const symbol = screen.getByText("$");
    const amount = screen.getByText("12.50");

    expect(symbol).toHaveClass("type-text-regular-s", "text-text");
    expect(amount).toHaveClass("type-subtitle-xl", "text-text");
    expect(symbol.parentElement).toBe(amount.parentElement);
    expect(symbol.parentElement).toHaveTextContent("$12.50");
  });

  it("has the card shape: 256 by 310, the card fill, and the 6/36/6/36 corners", () => {
    render(<CoffeeCard coffee={latte} />);

    expect(screen.getByRole("article")).toHaveClass(
      "w-64",
      "h-77.5",
      "bg-card",
      "rounded-coffee-card",
    );
  });

  it("has no cart control yet: the counter and the button arrive in spec 021", () => {
    render(<CoffeeCard coffee={latte} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
  });

  it("has no accessibility violation", async () => {
    const { container } = render(<CoffeeCard coffee={cuban} />);

    expect(await accessibilityViolations(container)).toEqual([]);
  });
});
