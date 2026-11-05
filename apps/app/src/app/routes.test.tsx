import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";

import { routes } from "./routes";

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
}

describe("routes", () => {
  it("renders the home page at /", () => {
    renderAt("/");

    expect(screen.getByRole("heading", { level: 1, name: "Coffee Delivery" })).toBeInTheDocument();
  });

  it("renders the checkout placeholder at /checkout", () => {
    renderAt("/checkout");

    expect(screen.getByRole("heading", { level: 1, name: "Checkout" })).toBeInTheDocument();
  });

  it("renders the order confirmation placeholder with the order id at /orders/:orderId", () => {
    renderAt("/orders/abc");

    expect(
      screen.getByRole("heading", { level: 1, name: "Order confirmation" }),
    ).toBeInTheDocument();
    expect(screen.getByText("abc")).toBeInTheDocument();
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

  it("renders every route inside the layout: skip link, navbar, and main#main-content", () => {
    for (const path of ["/", "/checkout", "/orders/abc", "/nope"]) {
      const { unmount } = renderPath(path);
      expect(screen.getByRole("link", { name: "Skip to content" })).toBeInTheDocument();
      expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
      expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
      unmount();
    }
  });

  it("gives every page one main landmark", () => {
    for (const path of ["/", "/checkout", "/orders/abc", "/nope"]) {
      const { unmount } = renderPath(path);
      expect(screen.getAllByRole("main")).toHaveLength(1);
      unmount();
    }
  });
});

function renderPath(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return render(<RouterProvider router={router} />);
}
