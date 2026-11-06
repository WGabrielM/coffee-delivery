// jsdom loads no stylesheet, so a Tailwind class that does not exist (a typo, or a token the theme
// dropped, such as `bg-red-500` or `shadow-md`) passes every other test and does nothing in the
// browser. This test renders every variant, collects the classes of the real DOM, and compiles them
// with the theme of the app: each class must produce CSS.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { compile } from "tailwindcss";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CoffeeList } from "../features/catalog/coffee-list/CoffeeList";
import {
  fakeCoffeesApi,
  fakeFailingApi,
  fakePendingApi,
  renderWithQuery,
  sampleCoffees,
} from "../test/coffees";

import { Badge } from "./badge/Badge";
import { Button } from "./button/Button";
import { Counter } from "./counter/Counter";
import { Input } from "./input/Input";
import { Navbar } from "./navbar/Navbar";
import { SelectOptionGroup } from "./select-option/SelectOptionGroup";
import { Tag } from "./tag/Tag";

const require = createRequire(import.meta.url);
const styles = join(import.meta.dirname, "..", "styles");

async function loadStylesheet(id: string, base: string) {
  const path =
    id === "tailwindcss"
      ? join(dirname(require.resolve("tailwindcss/package.json")), "index.css")
      : join(base, id);
  return { path, base: dirname(path), content: readFileSync(path, "utf8") };
}

/** The same escaping Tailwind uses for a class in a selector. */
const selector = (name: string) => `.${name.replace(/[^a-zA-Z0-9_-]/g, (char) => `\\${char}`)}`;

/** True when the CSS has the rule of the class, not only a longer class that starts the same way. */
function hasRule(css: string, name: string): boolean {
  const escaped = selector(name).replace(/[\\^$.*+?()[\]{}|]/g, String.raw`\$&`);
  return new RegExp(`${escaped}(?![\\w\\\\-])`).test(css);
}

function renderEveryVariant() {
  return render(
    <>
      <Button>Primary</Button>
      <Button fullWidth disabled>
        Disabled
      </Button>
      <Button variant="secondary" icon="trash">
        Remove
      </Button>
      <Button variant="icon" icon="shopping-cart-fill" aria-label="Add to cart" />
      <Counter label="Default" value={3} onChange={() => {}} />
      <Counter label="Compact" value={1} size="compact" onChange={() => {}} />
      <Input label="Street" />
      <Input label="Complement" hint="Optional" />
      <Input label="ZIP code" error="Enter a ZIP code." disabled />
      <SelectOptionGroup
        label="Payment method"
        options={[
          { value: "CASH", label: "Cash", icon: "money" },
          { value: "BANK", label: "Bank", icon: "bank" },
        ]}
        value="CASH"
        onChange={() => {}}
      />
      <Tag>Traditional</Tag>
      <Tag variant="filter" pressed onPressedChange={() => {}}>
        Special
      </Tag>
      <Tag variant="filter" pressed={false} onPressedChange={() => {}}>
        Iced
      </Tag>
      <Badge count={3} />
      <MemoryRouter>
        <Navbar cartCount={3} />
      </MemoryRouter>
    </>,
  );
}

/** The classes of the coffee list in each of its states, and of a card with no photo. */
async function catalogClasses(): Promise<string[]> {
  const found: string[] = [];
  const collect = (root: HTMLElement) =>
    found.push(...[...root.querySelectorAll("*")].flatMap((element) => [...element.classList]));

  fakePendingApi();
  let view = renderWithQuery(<CoffeeList />);
  collect(view.container);
  view.unmount();

  fakeCoffeesApi([...sampleCoffees, { ...sampleCoffees[0]!, id: "x", slug: "no-photo", tags: [] }]);
  view = renderWithQuery(<CoffeeList />);
  await screen.findByRole("list");
  fireEvent.click(within(view.container).getByRole("button", { name: "Special" })); // a selected chip and Clear filters
  await screen.findByRole("button", { name: "Clear filters" });
  collect(view.container);
  view.unmount();

  fakeFailingApi();
  view = renderWithQuery(<CoffeeList />);
  await screen.findByRole("alert");
  collect(view.container);
  view.unmount();

  fakeCoffeesApi([]);
  view = renderWithQuery(<CoffeeList />);
  await screen.findByText("No coffees found.");
  collect(view.container);
  fireEvent.click(within(view.container).getByRole("button", { name: "Special" }));
  await screen.findByText("No coffees match the selected filters.");
  collect(view.container);
  view.unmount();

  return found;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("the classes of the base components", () => {
  it("each exist in the theme of the app and produce CSS", async () => {
    const { container } = renderEveryVariant();
    const classes = new Set([
      ...[...container.querySelectorAll("*")].flatMap((element) => [...element.classList]),
      ...(await catalogClasses()),
    ]);
    const compiler = await compile('@import "tailwindcss"; @import "./theme.css";', {
      base: styles,
      loadStylesheet,
    });

    const css = compiler.build([...classes]);
    const missing = [...classes].filter((name) => !hasRule(css, name));

    expect(classes.size).toBeGreaterThan(50);
    expect(missing).toEqual([]);
  });

  it("would catch a class the theme does not have", async () => {
    const compiler = await compile('@import "tailwindcss"; @import "./theme.css";', {
      base: styles,
      loadStylesheet,
    });

    const css = compiler.build(["bg-red-500", "shadow-md", "bg-card"]);

    expect(hasRule(css, "bg-card")).toBe(true);
    expect(hasRule(css, "bg-red-500")).toBe(false);
    expect(hasRule(css, "shadow-md")).toBe(false);
  });
});
