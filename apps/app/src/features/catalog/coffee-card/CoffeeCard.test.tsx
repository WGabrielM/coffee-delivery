import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { coffeeImages } from "../../../assets";
import { accessibilityViolations } from "../../../test/axe";
import { cuban, latte, renderWithCart, traditionalEspresso } from "../../../test/coffees";
import { useCart } from "../../cart/cart-context";
import { CoffeeCard } from "./CoffeeCard";

// Shows what the cart holds, so a test reads the cart through the screen and not through the hook.
function CartProbe() {
  const { lines, totalQuantity } = useCart();
  return (
    <>
      <p>{`In the cart: ${totalQuantity}`}</p>
      <p data-testid="cart-lines">{JSON.stringify(lines)}</p>
    </>
  );
}

describe("CoffeeCard", () => {
  it("is an article named by its name, a level 3 heading in Title S and the subtitle color", () => {
    renderWithCart(<CoffeeCard coffee={traditionalEspresso} />);

    const card = screen.getByRole("article", { name: "Traditional Espresso" });
    const heading = within(card).getByRole("heading", { level: 3 });

    expect(heading).toHaveTextContent("Traditional Espresso");
    expect(heading).toHaveClass("type-title-s", "text-subtitle");
  });

  it("shows the photo of the slug, with the name as its alt text", () => {
    renderWithCart(<CoffeeCard coffee={latte} />);

    const photo = screen.getByRole("img", { name: "Latte" });

    expect(photo).toHaveAttribute("src", coffeeImages.latte);
    expect(photo).toHaveAttribute("width", "120");
    expect(photo).toHaveAttribute("height", "120");
  });

  it("makes the photo round, 120 px, and lifts it 20 px over the top edge", () => {
    renderWithCart(<CoffeeCard coffee={latte} />);

    expect(screen.getByRole("img", { name: "Latte" })).toHaveClass(
      "size-30",
      "-mt-5",
      "rounded-round",
    );
  });

  it("keeps the layout when the app has no photo for a slug: an empty round placeholder", () => {
    renderWithCart(
      <CoffeeCard coffee={{ ...latte, slug: "unknown-brew", name: "Unknown Brew" }} />,
    );

    const card = screen.getByRole("article", { name: "Unknown Brew" });

    expect(within(card).queryByRole("img")).not.toBeInTheDocument();
    expect(card.querySelector("[data-photo-placeholder]")).toHaveClass(
      "size-30",
      "-mt-5",
      "rounded-round",
    );
  });

  it("shows every tag in order, as labels", () => {
    renderWithCart(<CoffeeCard coffee={cuban} />);

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
    renderWithCart(<CoffeeCard coffee={{ ...latte, tags: [] }} />);

    expect(screen.queryByText("Traditional")).not.toBeInTheDocument();
    expect(screen.queryByText("With milk")).not.toBeInTheDocument();
  });

  it("shows the description in Text Regular S and the label color", () => {
    renderWithCart(<CoffeeCard coffee={traditionalEspresso} />);

    expect(
      screen.getByText("The traditional coffee made with hot water and ground beans"),
    ).toHaveClass("type-text-regular-s", "text-label");
  });

  it("splits the price: a small symbol next to the large amount", () => {
    renderWithCart(<CoffeeCard coffee={cuban} />);

    const symbol = screen.getByText("$");
    const amount = screen.getByText("12.50");

    expect(symbol).toHaveClass("type-text-regular-s", "text-text");
    expect(amount).toHaveClass("type-subtitle-xl", "text-text");
    expect(symbol.parentElement).toBe(amount.parentElement);
    expect(symbol.parentElement).toHaveTextContent("$12.50");
  });

  it("has the card shape: 256 by 310, the card fill, and the 6/36/6/36 corners", () => {
    renderWithCart(<CoffeeCard coffee={latte} />);

    expect(screen.getByRole("article")).toHaveClass(
      "w-64",
      "h-77.5",
      "bg-card",
      "rounded-coffee-card",
    );
  });

  describe("the buy row", () => {
    it("has the price at the left, then a counter named for the coffee and the cart button", () => {
      renderWithCart(<CoffeeCard coffee={latte} />);

      const card = screen.getByRole("article", { name: "Latte" });
      const counter = within(card).getByRole("group", { name: "Quantity of Latte" });
      const button = within(card).getByRole("button", { name: "Add Latte to cart" });
      const price = within(card).getByText("$").parentElement;

      expect(price).toHaveTextContent("$9.90");
      expect(price?.parentElement).toHaveClass("flex", "items-center", "justify-between");
      expect(price?.nextElementSibling).toContainElement(counter);
      expect(price?.nextElementSibling).toContainElement(button);
      // The counter comes before the button, as in the design.
      expect(counter.compareDocumentPosition(button)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    it("draws the cart button as the 38 by 38 icon button", () => {
      renderWithCart(<CoffeeCard coffee={latte} />);

      expect(screen.getByRole("button", { name: "Add Latte to cart" })).toHaveClass(
        "size-9.5",
        "bg-purple-dark",
      );
    });

    it("starts the counter at 1 and changes it without touching the cart", async () => {
      const user = userEvent.setup();
      renderWithCart(
        <>
          <CoffeeCard coffee={latte} />
          <CartProbe />
        </>,
      );
      const counter = screen.getByRole("group", { name: "Quantity of Latte" });
      expect(within(counter).getByText("1")).toBeInTheDocument();

      await user.click(within(counter).getByRole("button", { name: "Increase quantity" }));
      await user.click(within(counter).getByRole("button", { name: "Increase quantity" }));

      expect(within(counter).getByText("3")).toBeInTheDocument();
      expect(screen.getByText("In the cart: 0")).toBeInTheDocument();
    });

    it("adds the counter quantity of that coffee to the cart and resets the counter to 1", async () => {
      const user = userEvent.setup();
      renderWithCart(
        <>
          <CoffeeCard coffee={latte} />
          <CartProbe />
        </>,
      );
      const counter = screen.getByRole("group", { name: "Quantity of Latte" });
      await user.click(within(counter).getByRole("button", { name: "Increase quantity" }));

      await user.click(screen.getByRole("button", { name: "Add Latte to cart" }));

      expect(screen.getByTestId("cart-lines")).toHaveTextContent(
        JSON.stringify([{ coffeeId: latte.id, quantity: 2 }]),
      );
      expect(screen.getByText("In the cart: 2")).toBeInTheDocument();
      expect(within(counter).getByText("1")).toBeInTheDocument();
    });

    it("adds one coffee by default and makes the quantity grow when the coffee is added again", async () => {
      const user = userEvent.setup();
      renderWithCart(
        <>
          <CoffeeCard coffee={latte} />
          <CoffeeCard coffee={traditionalEspresso} />
          <CartProbe />
        </>,
      );
      const latteCard = screen.getByRole("article", { name: "Latte" });
      await user.click(within(latteCard).getByRole("button", { name: "Increase quantity" }));
      await user.click(within(latteCard).getByRole("button", { name: "Add Latte to cart" }));
      await user.click(screen.getByRole("button", { name: "Add Traditional Espresso to cart" }));
      expect(screen.getByText("In the cart: 3")).toBeInTheDocument();

      await user.click(within(latteCard).getByRole("button", { name: "Add Latte to cart" }));

      expect(screen.getByText("In the cart: 4")).toBeInTheDocument();
      expect(screen.getByTestId("cart-lines")).toHaveTextContent(
        JSON.stringify([
          { coffeeId: latte.id, quantity: 3 },
          { coffeeId: traditionalEspresso.id, quantity: 1 },
        ]),
      );
    });

    it("keeps the counters of different cards independent", async () => {
      const user = userEvent.setup();
      renderWithCart(
        <>
          <CoffeeCard coffee={latte} />
          <CoffeeCard coffee={cuban} />
        </>,
      );

      await user.click(
        within(screen.getByRole("group", { name: "Quantity of Cuban" })).getByRole("button", {
          name: "Increase quantity",
        }),
      );

      expect(
        within(screen.getByRole("group", { name: "Quantity of Cuban" })).getByText("2"),
      ).toBeInTheDocument();
      expect(
        within(screen.getByRole("group", { name: "Quantity of Latte" })).getByText("1"),
      ).toBeInTheDocument();
    });

    it("stops the counter at 99 and adds that quantity, which the cart keeps at 99", async () => {
      const user = userEvent.setup({ delay: null });
      renderWithCart(
        <>
          <CoffeeCard coffee={latte} />
          <CartProbe />
        </>,
      );
      const increase = screen.getByRole("button", { name: "Increase quantity" });
      for (let click = 0; click < 100; click += 1) await user.click(increase);
      const counter = screen.getByRole("group", { name: "Quantity of Latte" });
      expect(within(counter).getByText("99")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Add Latte to cart" }));
      for (let click = 0; click < 5; click += 1) await user.click(increase);
      await user.click(screen.getByRole("button", { name: "Add Latte to cart" }));

      expect(screen.getByText("In the cart: 99")).toBeInTheDocument();
    });

    it("announces each addition in a polite live region", async () => {
      const user = userEvent.setup();
      renderWithCart(<CoffeeCard coffee={latte} />);
      const card = screen.getByRole("article", { name: "Latte" });
      const live = card.querySelector("[aria-live]");
      expect(live).toHaveAttribute("aria-live", "polite");
      expect(live).toHaveClass("sr-only");
      expect(live).toBeEmptyDOMElement();

      await user.click(within(card).getByRole("button", { name: "Increase quantity" }));
      await user.click(within(card).getByRole("button", { name: "Add Latte to cart" }));

      expect(live).toHaveTextContent("Added 2 × Latte to cart");
    });

    it("announces the same addition again: the text changes even when the words do not", async () => {
      const user = userEvent.setup();
      renderWithCart(<CoffeeCard coffee={latte} />);
      const card = screen.getByRole("article", { name: "Latte" });
      const live = card.querySelector("[aria-live]");

      await user.click(within(card).getByRole("button", { name: "Add Latte to cart" }));
      const first = live?.textContent;
      await user.click(within(card).getByRole("button", { name: "Add Latte to cart" }));

      expect(live).toHaveTextContent("Added 1 × Latte to cart");
      expect(live?.textContent).not.toBe(first);
    });
  });

  it("has no accessibility violation", async () => {
    const { container } = renderWithCart(<CoffeeCard coffee={cuban} />);

    expect(await accessibilityViolations(container)).toEqual([]);
  });
});
