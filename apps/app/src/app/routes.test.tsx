import { screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fakeCoffeesApi, renderWithQuery } from "../test/coffees";
import { routes } from "./routes";

// The home page reads the catalog, so every test has a query client and a fake API.
beforeEach(() => {
  fakeCoffeesApi();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderAt(path: string) {
  renderPath(path);
}

describe("routes", () => {
  it("renders the home page at /", () => {
    renderAt("/");

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Find the perfect coffee for any time of day",
      }),
    ).toBeInTheDocument();
  });

  it("renders the coffee list under the hero at /", async () => {
    renderAt("/");

    expect(screen.getByRole("heading", { level: 2, name: "Our coffees" })).toBeInTheDocument();
    expect(await screen.findAllByRole("article")).toHaveLength(3);
  });

  it("renders the checkout page at /checkout, loaded when it is needed", async () => {
    renderAt("/checkout");

    expect(await screen.findByRole("heading", { level: 1, name: "Checkout" })).toBeInTheDocument();
  });

  it("renders the order page at /orders/:orderId, which asks the API for that order", async () => {
    renderAt("/orders/abc");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Order confirmation" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Loading your order…")).toBeInTheDocument();
  });

  it("shows the skip link and the navbar while the page of a first visit is loading", () => {
    renderAt("/checkout");

    expect(screen.getByRole("link", { name: "Skip to content" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1, name: "Checkout" })).not.toBeInTheDocument();
  });

  it("renders the not-found page with a link to / for an unknown path", () => {
    renderAt("/does-not-exist");

    expect(screen.getByRole("heading", { level: 1, name: "Page not found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to the home page" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("treats a deeper unknown path as not found too", () => {
    renderAt("/orders");

    expect(screen.getByRole("heading", { level: 1, name: "Page not found" })).toBeInTheDocument();
  });

  it("renders every route inside the layout: skip link, navbar, and main#main-content", async () => {
    for (const path of ["/", "/checkout", "/orders/abc", "/nope"]) {
      const { unmount } = renderPath(path);
      await screen.findByRole("heading", { level: 1 });
      expect(screen.getByRole("link", { name: "Skip to content" })).toBeInTheDocument();
      expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
      expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
      unmount();
    }
  });

  it("gives every page one main landmark", async () => {
    for (const path of ["/", "/checkout", "/orders/abc", "/nope"]) {
      const { unmount } = renderPath(path);
      await screen.findByRole("heading", { level: 1 });
      expect(screen.getAllByRole("main")).toHaveLength(1);
      unmount();
    }
  });
});

function renderPath(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return renderWithQuery(<RouterProvider router={router} />);
}
