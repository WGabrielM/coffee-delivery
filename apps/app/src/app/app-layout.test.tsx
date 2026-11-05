import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";

import { accessibilityViolations } from "../test/axe";
import { AppLayout } from "./app-layout";

function renderLayout() {
  const router = createMemoryRouter(
    [{ element: <AppLayout />, children: [{ path: "/", element: <h1>Page content</h1> }] }],
    { initialEntries: ["/"] },
  );
  return render(<RouterProvider router={router} />);
}

describe("AppLayout", () => {
  it("renders the page of the route inside main", () => {
    renderLayout();

    expect(screen.getByRole("main")).toContainElement(
      screen.getByRole("heading", { name: "Page content" }),
    );
  });

  it("has one header, one Main navigation, and one main landmark", () => {
    renderLayout();

    expect(screen.getAllByRole("banner")).toHaveLength(1);
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
    expect(screen.getAllByRole("navigation")).toHaveLength(1);
    expect(screen.getAllByRole("main")).toHaveLength(1);
  });

  it("gives main the id main-content and makes it focusable by script", () => {
    renderLayout();

    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
    expect(screen.getByRole("main")).toHaveAttribute("tabindex", "-1");
  });

  it("puts the Skip to content link first in the tab order, pointing at main", async () => {
    renderLayout();

    await userEvent.tab();

    const skip = screen.getByRole("link", { name: "Skip to content" });
    expect(skip).toHaveFocus();
    expect(skip).toHaveAttribute("href", "#main-content");
  });

  it("hides the skip link until it has focus", () => {
    renderLayout();

    expect(screen.getByRole("link", { name: "Skip to content" })).toHaveClass(
      "sr-only",
      "focus:not-sr-only",
    );
  });

  it("puts the navbar before main in the document", () => {
    renderLayout();

    const header = screen.getByRole("banner");
    const main = screen.getByRole("main");

    expect(header.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("shows an empty cart until the cart state is wired", () => {
    renderLayout();

    expect(screen.getByRole("link", { name: "Cart, empty" })).toBeInTheDocument();
  });

  it("passes an axe check", async () => {
    const { container } = renderLayout();

    expect(await accessibilityViolations(container)).toEqual([]);
  });
});
