import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { accessibilityViolations } from "../../../test/axe";
import {
  coffeesResponse,
  fakeCoffeesApi,
  fakeFailingApi,
  fakeFilteringApi,
  fakePendingApi,
  renderWithQuery,
  requestedUrls,
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

    // As many 256 px columns as fit: four in the 1120 px of the design, two on a tablet, one on a phone.
    expect(list).toHaveClass(
      "grid",
      "grid-cols-[repeat(auto-fill,16rem)]",
      "justify-center",
      "gap-x-8",
      "gap-y-10",
    );
  });

  it("is not busy once the coffees are shown", async () => {
    fakeCoffeesApi();
    renderWithQuery(<CoffeeList />);

    await screen.findByRole("list");

    expect(screen.getByRole("region", { name: "Our coffees" })).toHaveAttribute(
      "aria-busy",
      "false",
    );
    expect(screen.queryByText("Loading coffees…")).not.toBeInTheDocument();
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

function names() {
  return screen.queryAllByRole("heading", { level: 3 }).map((heading) => heading.textContent);
}

const chip = (name: string) => screen.getByRole("button", { name });
const everyCoffee = ["Traditional Espresso", "Cuban", "Latte"];

describe("CoffeeList filters", () => {
  it("puts the five chips at the right of the title, in the same row", async () => {
    fakeFilteringApi();
    renderWithQuery(<CoffeeList />);

    const title = screen.getByRole("heading", { level: 2, name: "Our coffees" });
    const group = screen.getByRole("group", { name: "Filter by tag" });

    expect(title.compareDocumentPosition(group) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(title.parentElement).toContainElement(group);
    // The chips are under the title below 1024 px, and in its row from there.
    expect(title.parentElement).toHaveClass(
      "flex",
      "flex-col",
      "lg:flex-row",
      "lg:items-center",
      "lg:justify-between",
    );
    await screen.findByRole("list");
  });

  it("keeps the chips while the first request runs", () => {
    fakePendingApi();
    renderWithQuery(<CoffeeList />);

    const group = screen.getByRole("group", { name: "Filter by tag" });

    expect(within(group).getAllByRole("button")).toHaveLength(5);
  });

  it("asks the server for the selected tags in chip order: Iced then Special is tags=special,iced", async () => {
    const user = userEvent.setup();
    const fetchMock = fakeFilteringApi();
    renderWithQuery(<CoffeeList />);
    await screen.findByRole("list");

    await user.click(chip("Iced"));
    await waitFor(() => expect(names()).toEqual(["Cuban"]));
    await user.click(chip("Special"));
    await waitFor(() => expect(requestedUrls(fetchMock)).toHaveLength(3));

    expect(requestedUrls(fetchMock)).toEqual([
      "/api/v1/coffees",
      "/api/v1/coffees?tags=iced",
      "/api/v1/coffees?tags=special,iced",
    ]);
  });

  it("shows only the coffees the server returns, and all of them again after Clear filters", async () => {
    const user = userEvent.setup();
    const fetchMock = fakeFilteringApi();
    renderWithQuery(<CoffeeList />);
    await screen.findByRole("list");
    expect(names()).toEqual(everyCoffee);

    await user.click(chip("Special"));
    await waitFor(() => expect(names()).toEqual(["Cuban"]));

    await user.click(chip("Clear filters"));
    await waitFor(() => expect(names()).toEqual(everyCoffee));
    expect(requestedUrls(fetchMock).at(-1)).toBe("/api/v1/coffees");
    for (const name of ["Traditional", "Special", "With milk", "Alcoholic", "Iced"]) {
      expect(chip(name)).toHaveAttribute("aria-pressed", "false");
    }
  });

  it("asks for the list without tags when the last chip is unselected", async () => {
    const user = userEvent.setup();
    const fetchMock = fakeFilteringApi();
    renderWithQuery(<CoffeeList />);
    await screen.findByRole("list");

    await user.click(chip("Special"));
    await waitFor(() => expect(names()).toEqual(["Cuban"]));
    await user.click(chip("Special"));
    await waitFor(() => expect(names()).toEqual(everyCoffee));

    expect(requestedUrls(fetchMock).at(-1)).toBe("/api/v1/coffees");
    expect(screen.queryByRole("button", { name: "Clear filters" })).not.toBeInTheDocument();
  });

  it("says No coffees match the selected filters. for an empty result, with a second Clear filters button", async () => {
    const user = userEvent.setup();
    fakeFilteringApi();
    renderWithQuery(<CoffeeList />);
    await screen.findByRole("list");

    await user.click(chip("Traditional"));
    await user.click(chip("Alcoholic"));

    expect(await screen.findByText("No coffees match the selected filters.")).toBeInTheDocument();
    expect(screen.queryByText("No coffees found.")).not.toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Clear filters" })).toHaveLength(2);
  });

  it("clears every chip from the empty state and shows the list again", async () => {
    const user = userEvent.setup();
    fakeFilteringApi();
    renderWithQuery(<CoffeeList />);
    await screen.findByRole("list");
    await user.click(chip("Traditional"));
    await user.click(chip("Alcoholic"));
    const message = await screen.findByText("No coffees match the selected filters.");

    await user.click(
      within(message.parentElement as HTMLElement).getByRole("button", { name: "Clear filters" }),
    );

    await waitFor(() => expect(names()).toEqual(everyCoffee));
    for (const name of ["Traditional", "Alcoholic"]) {
      expect(chip(name)).toHaveAttribute("aria-pressed", "false");
    }
    expect(screen.queryByRole("button", { name: "Clear filters" })).not.toBeInTheDocument();
  });

  it("keeps saying No coffees found. for an empty catalog with no chip selected", async () => {
    fakeFilteringApi([]);
    renderWithQuery(<CoffeeList />);

    expect(await screen.findByText("No coffees found.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear filters" })).not.toBeInTheDocument();
  });

  it("keeps the previous cards on screen while the new list loads", async () => {
    const user = userEvent.setup();
    const fetchMock = fakeFilteringApi();
    renderWithQuery(<CoffeeList />);
    await screen.findByRole("list");

    fetchMock.mockImplementation(() => new Promise<Response>(() => {}));
    await user.click(chip("Special"));

    expect(names()).toEqual(everyCoffee);
    expect(screen.queryByText("Loading coffees…")).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Our coffees" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("announces the result count in a polite live region", async () => {
    const user = userEvent.setup();
    fakeFilteringApi();
    renderWithQuery(<CoffeeList />);

    const count = await screen.findByText("3 coffees");
    expect(count).toHaveAttribute("aria-live", "polite");
    expect(count).toHaveClass("sr-only");

    await user.click(chip("Special"));

    await waitFor(() => expect(count).toHaveTextContent("1 coffee"));
    expect(count).toHaveAttribute("aria-live", "polite");
  });

  it("announces 0 coffees for an empty filtered result", async () => {
    const user = userEvent.setup();
    fakeFilteringApi();
    renderWithQuery(<CoffeeList />);
    const count = await screen.findByText("3 coffees");

    await user.click(chip("Traditional"));
    await user.click(chip("Alcoholic"));

    await waitFor(() => expect(count).toHaveTextContent("0 coffees"));
  });

  it("keeps the chips and shows the error when the filtered request fails", async () => {
    const user = userEvent.setup();
    const fetchMock = fakeFilteringApi();
    renderWithQuery(<CoffeeList />);
    await screen.findByRole("list");

    fetchMock.mockImplementation(async () =>
      Response.json(
        { error: { code: "unavailable", message: "Try again later." } },
        { status: 503 },
      ),
    );
    await user.click(chip("Special"));

    expect(await screen.findByText("We couldn't load the coffees.")).toBeInTheDocument();
    expect(chip("Special")).toHaveAttribute("aria-pressed", "true");
  });

  it("has no accessibility violation with a chip selected", async () => {
    const user = userEvent.setup();
    fakeFilteringApi();
    const { container } = renderWithQuery(<CoffeeList />);
    await screen.findByRole("list");
    await user.click(chip("Special"));
    await waitFor(() => expect(names()).toEqual(["Cuban"]));

    expect(await accessibilityViolations(container)).toEqual([]);
  });
});
