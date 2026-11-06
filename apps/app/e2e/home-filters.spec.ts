import { expect, test, type Locator, type Page } from "@playwright/test";

test.use({ viewport: { width: 1440, height: 900 } });

// These tests need the API: `yarn infra:up`, then `yarn api:dev` (port 3000). The dev server of the
// app proxies /api to it.
const TOLERANCE = 2;

const chip = (page: Page, name: string) =>
  page.getByRole("group", { name: "Filter by tag" }).getByRole("button", { name, exact: true });
const cards = (page: Page) => page.getByRole("article");

const style = (locator: Locator) =>
  locator.evaluate((element) => {
    const computed = getComputedStyle(element);
    return {
      background: computed.backgroundColor,
      color: computed.color,
      border: computed.borderTopColor,
      radius: computed.borderTopLeftRadius,
      size: computed.fontSize,
      weight: computed.fontWeight,
    };
  });

test("the five chips sit at the right of the title, in order, none selected", async ({ page }) => {
  await page.goto("/");
  await expect(cards(page)).toHaveCount(14);

  const group = page.getByRole("group", { name: "Filter by tag" });
  const buttons = group.getByRole("button");
  await expect(buttons).toHaveText(["Traditional", "Special", "With milk", "Alcoholic", "Iced"]);
  for (const button of await buttons.all()) {
    await expect(button).toHaveAttribute("aria-pressed", "false");
  }

  const title = await page.getByRole("heading", { level: 2, name: "Our coffees" }).boundingBox();
  const groupBox = await group.boundingBox();
  const lastChip = await chip(page, "Iced").boundingBox();
  if (!title || !groupBox || !lastChip) throw new Error("Missing box.");
  expect(groupBox.x).toBeGreaterThan(title.x + title.width);
  expect(Math.abs(lastChip.x + lastChip.width - 1280)).toBeLessThanOrEqual(TOLERANCE);
  // The chips and the title share a row: their centers are on the same line.
  expect(
    Math.abs(groupBox.y + groupBox.height / 2 - (title.y + title.height / 2)),
  ).toBeLessThanOrEqual(TOLERANCE);
});

test("the chips have the proposed look: yellow border and yellow-dark text; selected, yellow fill and white text", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await expect(cards(page)).toHaveCount(14);

  expect(await style(chip(page, "Special"))).toMatchObject({
    border: "rgb(219, 172, 44)",
    color: "rgb(196, 127, 23)",
    size: "12px",
    weight: "700",
  });
  expect((await style(chip(page, "Special"))).radius).toBe("100px");

  await chip(page, "Special").click();

  // The colors fade in 150 ms, so poll until the transition ends.
  await expect
    .poll(() => style(chip(page, "Special")))
    .toMatchObject({ background: "rgb(219, 172, 44)", color: "rgb(255, 255, 255)" });
});

test("Special shows 5 cards and sends tags=special", async ({ page }) => {
  await page.goto("/");
  await expect(cards(page)).toHaveCount(14);

  const request = page.waitForRequest((r) => r.url().includes("/api/v1/coffees?tags=special"));
  await chip(page, "Special").click();
  await request;

  await expect(cards(page)).toHaveCount(5);
  await expect(chip(page, "Special")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("5 coffees", { exact: true })).toHaveAttribute("aria-live", "polite");
});

test("Iced then Special asks for tags=special,iced and shows only the Cuban", async ({ page }) => {
  await page.goto("/");
  await expect(cards(page)).toHaveCount(14);

  await chip(page, "Iced").click();
  await expect(cards(page)).toHaveCount(2);
  const request = page.waitForRequest((r) => r.url().endsWith("/api/v1/coffees?tags=special,iced"));
  await chip(page, "Special").click();
  await request;

  await expect(cards(page)).toHaveCount(1);
  await expect(cards(page).first().getByRole("heading", { level: 3 })).toHaveText("Cuban");
  await expect(page.getByText("1 coffee", { exact: true })).toBeAttached();
});

test("Traditional and Alcoholic match nothing: the empty state offers Clear filters", async ({
  page,
}) => {
  await page.goto("/");
  await expect(cards(page)).toHaveCount(14);

  await chip(page, "Traditional").click();
  await chip(page, "Alcoholic").click();

  await expect(page.getByText("No coffees match the selected filters.")).toBeVisible();
  await expect(cards(page)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Clear filters" })).toHaveCount(2);

  const message = page.getByText("No coffees match the selected filters.");
  await message.locator("xpath=..").getByRole("button", { name: "Clear filters" }).click();

  await expect(cards(page)).toHaveCount(14);
  await expect(chip(page, "Traditional")).toHaveAttribute("aria-pressed", "false");
  await expect(chip(page, "Alcoholic")).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByRole("button", { name: "Clear filters" })).toHaveCount(0);
});

test("unselecting the last chip shows the whole list again and asks for no tags", async ({
  page,
}) => {
  const urls: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/v1/coffees")) urls.push(request.url());
  });
  await page.goto("/");
  await expect(cards(page)).toHaveCount(14);
  await chip(page, "Special").click();
  await expect(cards(page)).toHaveCount(5);
  urls.length = 0;

  await chip(page, "Special").click();

  await expect(cards(page)).toHaveCount(14);
  // The list without tags is still fresh in the cache (30 s), so the app may not ask again; if it
  // does, it asks with no tags.
  expect(urls.filter((url) => url.includes("tags"))).toEqual([]);
});

test("the chips work with the keyboard", async ({ page }) => {
  await page.goto("/");
  await expect(cards(page)).toHaveCount(14);

  await chip(page, "Special").focus();
  await page.keyboard.press("Space");
  await expect(cards(page)).toHaveCount(5);
  await page.keyboard.press("Tab");
  await expect(chip(page, "With milk")).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(chip(page, "With milk")).toHaveAttribute("aria-pressed", "true");
  // Special and with milk: Hot Chocolate only.
  await expect(cards(page)).toHaveCount(1);
  await expect(cards(page).first().getByRole("heading", { level: 3 })).toHaveText("Hot Chocolate");
});

test("the grid keeps its measures when the list is filtered: 256 by 310, from x = 160", async ({
  page,
}) => {
  await page.goto("/");
  await expect(cards(page)).toHaveCount(14);
  await chip(page, "Special").click();
  await expect(cards(page)).toHaveCount(5);

  const boxes = await Promise.all((await cards(page).all()).map((card) => card.boundingBox()));
  const xs = boxes.map((box) => Math.round(box?.x ?? Number.NaN));
  expect(xs).toEqual([160, 448, 736, 1024, 160]);
  for (const box of boxes) {
    expect(Math.abs((box?.width ?? 0) - 256)).toBeLessThanOrEqual(TOLERANCE);
    expect(Math.abs((box?.height ?? 0) - 310)).toBeLessThanOrEqual(TOLERANCE);
  }
});
