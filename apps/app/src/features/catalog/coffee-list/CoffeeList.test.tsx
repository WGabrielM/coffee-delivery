import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { accessibilityViolations } from "../../../test/axe";
import {
  coffeesResponse,
  fakeCoffeesApi,
  fakeFailingApi,
  fakePendingApi,
  renderWithQuery,
  sampleCoffees,
} from "../../../test/coffees";
import { CoffeeList } from "./CoffeeList";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CoffeeList with data", () => {
  it("has the heading Our coffees, a level 2 in Title L, naming the section", async () => {
    fakeCoffeesApi();
    renderWithQuery(<CoffeeList />);

    const heading = screen.getByRole("heading", { level: 2, name: "Our coffees" });

    expect(heading).toHaveClass("type-title-l", "text-subtitle");
    expect(screen.getByRole("region", { name: "Our coffees" })).toBeInTheDocument();
    await screen.findByRole("list");
  });

  it("lists one card per coffee, in the order of the API, each card a list item", async () => {
    fakeCoffeesApi();
    renderWithQuery(<CoffeeList />);

    const list = await screen.findByRole("list");
    const items = within(list).getAllByRole("listitem");

    expect(items).toHaveLength(sampleCoffees.length);
    expect(
      items.map((item) => within(item).getByRole("heading", { level: 3 }).textContent),
    ).toEqual(["Traditional Espresso", "Cuban", "Latte"]);
    for (const item of items) expect(within(item).getByRole("article")).toBeInTheDocument();
  });

  it("is a grid of four 256 px columns with 32 px between columns and 40 px between rows", async () => {
    fakeCoffeesApi();
    renderWithQuery(<CoffeeList />);

    const list = await screen.findByRole("list");

    expect(list).toHaveClass("grid", "grid-cols-[repeat(4,16rem)]", "gap-x-8", "gap-y-10");
  });

  it("is not busy once the coffees are shown", async () => {
    fakeCoffeesApi();
    renderWithQuery(<CoffeeList />);

    await screen.findByRole("list");

    expect(screen.getByRole("region", { name: "Our coffees" })).toHaveAttribute(
      "aria-busy",
      "false",
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("has no accessibility violation", async () => {
    fakeCoffeesApi();
    const { container } = renderWithQuery(<CoffeeList />);
    await screen.findByRole("list");

    expect(await accessibilityViolations(container)).toEqual([]);
  });
});

describe("CoffeeList while loading", () => {
  it("is busy, shows a loading status, and shows no card", () => {
    fakePendingApi();
    renderWithQuery(<CoffeeList />);

    expect(screen.getByRole("region", { name: "Our coffees" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(screen.getByRole("status")).toHaveTextContent("Loading coffees…");
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
  });

  it("keeps the heading visible", () => {
    fakePendingApi();
    renderWithQuery(<CoffeeList />);

    expect(screen.getByRole("heading", { level: 2, name: "Our coffees" })).toBeInTheDocument();
  });

  it("stops the spinner under reduced motion", () => {
    fakePendingApi();
    renderWithQuery(<CoffeeList />);

    expect(screen.getByRole("status").querySelector("[data-spinner]")).toHaveClass(
      "animate-spin",
      "motion-reduce:animate-none",
    );
  });

  it("has no accessibility violation", async () => {
    fakePendingApi();
    const { container } = renderWithQuery(<CoffeeList />);

    expect(await accessibilityViolations(container)).toEqual([]);
  });
});

describe("CoffeeList after a failed request", () => {
  it("says it could not load the coffees and offers Try again", async () => {
    fakeFailingApi();
    renderWithQuery(<CoffeeList />);

    expect(await screen.findByText("We couldn't load the coffees.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Our coffees" })).toHaveAttribute(
      "aria-busy",
      "false",
    );
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("announces the failure", async () => {
    fakeFailingApi();
    renderWithQuery(<CoffeeList />);

    expect(await screen.findByRole("alert")).toHaveTextContent("We couldn't load the coffees.");
  });

  it("repeats the request on Try again and then shows the coffees", async () => {
    const user = userEvent.setup();
    const fetchMock = fakeFailingApi(); // first answer: 503
    renderWithQuery(<CoffeeList />);
    await screen.findByText("We couldn't load the coffees.");

    fetchMock.mockImplementation(async () => coffeesResponse(sampleCoffees));
    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByRole("list")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(screen.queryByText("We couldn't load the coffees.")).not.toBeInTheDocument();
  });

  it("shows the loading state again while it repeats the request", async () => {
    const user = userEvent.setup();
    const fetchMock = fakeFailingApi();
    renderWithQuery(<CoffeeList />);
    await screen.findByText("We couldn't load the coffees.");

    fetchMock.mockImplementation(() => new Promise<Response>(() => {}));
    await user.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() => expect(screen.getByRole("status")).toBeInTheDocument());
    expect(screen.getByRole("region", { name: "Our coffees" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("has no accessibility violation", async () => {
    fakeFailingApi();
    const { container } = renderWithQuery(<CoffeeList />);
    await screen.findByText("We couldn't load the coffees.");

    expect(await accessibilityViolations(container)).toEqual([]);
  });
});

describe("CoffeeList with no coffee", () => {
  it("says No coffees found. and shows no list", async () => {
    fakeCoffeesApi([]);
    renderWithQuery(<CoffeeList />);

    expect(await screen.findByText("No coffees found.")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Our coffees" })).toHaveAttribute(
      "aria-busy",
      "false",
    );
  });
});
