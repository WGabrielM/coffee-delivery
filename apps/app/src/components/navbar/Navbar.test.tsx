import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { accessibilityViolations } from "../../test/axe";
import { Navbar } from "./Navbar";

function renderNavbar(cartCount?: number) {
  return render(
    <MemoryRouter>
      {cartCount === undefined ? <Navbar /> : <Navbar cartCount={cartCount} />}
    </MemoryRouter>,
  );
}

describe("Navbar", () => {
  it("is a banner with one navigation named Main", () => {
    renderNavbar();

    expect(screen.getAllByRole("banner")).toHaveLength(1);
    const navigation = screen.getByRole("navigation", { name: "Main" });
    expect(screen.getAllByRole("navigation")).toHaveLength(1);
    expect(within(screen.getByRole("banner")).getByRole("navigation")).toBe(navigation);
  });

  it("links the logo to the home page with a name that says where it goes", () => {
    renderNavbar();

    const logo = screen.getByRole("link", { name: "Coffee Delivery, home" });

    expect(logo).toHaveAttribute("href", "/");
    expect(logo.querySelector("img")).toHaveAttribute("alt", "");
    expect(logo.querySelector("img")).toHaveAttribute("src");
  });

  it("shows the fixed location with the pin icon, and it is not interactive", () => {
    renderNavbar();

    const location = screen.getByText("Porto Alegre, RS");

    expect(location.closest("a, button")).toBeNull();
    expect(location.parentElement?.querySelector("[aria-hidden='true'] svg")).not.toBeNull();
  });

  it("links the cart to the checkout", () => {
    renderNavbar();

    expect(screen.getByRole("link", { name: "Cart, empty" })).toHaveAttribute("href", "/checkout");
  });

  it("has no badge and the name 'Cart, empty' when the count is 0 or not given", () => {
    const { unmount } = renderNavbar();
    expect(screen.getByRole("link", { name: "Cart, empty" }).textContent).toBe("");
    unmount();

    renderNavbar(0);
    expect(screen.getByRole("link", { name: "Cart, empty" }).textContent).toBe("");
  });

  it("shows the badge '3' and the name 'Cart, 3 items' for a count of 3", () => {
    renderNavbar(3);

    const cart = screen.getByRole("link", { name: "Cart, 3 items" });

    expect(cart).toHaveTextContent("3");
  });

  it("uses the singular for one item", () => {
    renderNavbar(1);

    expect(screen.getByRole("link", { name: "Cart, 1 item" })).toHaveTextContent("1");
  });

  it("caps the badge text at 99+ but keeps the real count in the name", () => {
    renderNavbar(120);

    expect(screen.getByRole("link", { name: "Cart, 120 items" })).toHaveTextContent("99+");
  });

  it.each([-2, 2.5, Number.NaN])("treats %s as an empty cart", (count) => {
    renderNavbar(count);

    expect(screen.getByRole("link", { name: "Cart, empty" }).textContent).toBe("");
  });

  it("measures like the design: 104 high on white, 38 high pill and 38 by 38 cart link", () => {
    renderNavbar(2);

    expect(screen.getByRole("banner")).toHaveClass("bg-white", "px-page");
    expect(screen.getByRole("navigation").className).toContain("h-navbar");
    expect(screen.getByRole("navigation").className).toContain("max-w-content");
    expect(screen.getByText("Porto Alegre, RS").parentElement).toHaveClass(
      "h-9.5",
      "bg-purple-light",
      "rounded-button",
      "px-2",
    );
    expect(screen.getByRole("link", { name: "Cart, 2 items" })).toHaveClass(
      "size-9.5",
      "bg-yellow-light",
      "rounded-button",
    );
  });

  it("draws a keyboard-only focus ring on both links", () => {
    renderNavbar();

    for (const link of screen.getAllByRole("link")) {
      expect(link).toHaveClass("focus-visible:outline-2", "focus-visible:outline-purple");
    }
  });

  it("passes an axe check empty and with items", async () => {
    const empty = renderNavbar();
    expect(await accessibilityViolations(empty.container)).toEqual([]);
    empty.unmount();

    const withItems = renderNavbar(3);
    expect(await accessibilityViolations(withItems.container)).toEqual([]);
  });
});
