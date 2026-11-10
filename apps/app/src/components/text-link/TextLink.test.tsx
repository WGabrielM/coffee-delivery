import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";

import { accessibilityViolations } from "../../test/axe";
import { TextLink } from "./TextLink";

function renderLink() {
  return render(
    <MemoryRouter initialEntries={["/orders/1"]}>
      <Routes>
        <Route path="/" element={<p>Home</p>} />
        <Route path="/orders/1" element={<TextLink to="/">Back to coffees</TextLink>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("TextLink", () => {
  it("is a link to the path with the text of its children", () => {
    renderLink();

    expect(screen.getByRole("link", { name: "Back to coffees" })).toHaveAttribute("href", "/");
  });

  it("is the underlined purple-dark link of the design, at least 24 px high, with the focus ring", () => {
    renderLink();

    expect(screen.getByRole("link")).toHaveClass(
      "inline-flex",
      "min-h-6",
      "items-center",
      "type-button-g",
      "text-purple-dark",
      "underline",
      "focus-visible:outline-2",
      "focus-visible:outline-offset-2",
      "focus-visible:outline-purple",
    );
  });

  it("moves inside the app without a page load", async () => {
    renderLink();

    await userEvent.click(screen.getByRole("link"));

    expect(screen.getByText("Home")).toBeInTheDocument();
  });

  it("has no accessibility violation", async () => {
    const { container } = renderLink();

    expect(await accessibilityViolations(container)).toEqual([]);
  });
});
