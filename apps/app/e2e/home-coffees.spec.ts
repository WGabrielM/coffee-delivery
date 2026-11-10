import { expect, test, type Locator } from "@playwright/test";

import { boxOf } from "./checkout-helpers";

test.use({ viewport: { width: 1440, height: 900 } });

// These tests need the API: `yarn infra:up`, then `yarn api:dev` (port 3000). The dev server of the
// app proxies /api to it.
const TOLERANCE = 2;

const style = (locator: Locator) =>
  locator.evaluate((element) => {
    const computed = getComputedStyle(element);
    return {
      family: computed.fontFamily,
      size: computed.fontSize,
      weight: computed.fontWeight,
      color: computed.color,
    };
  });

type Box = { x: number; y: number; width: number; height: number };

test("the page lists the 14 coffees of the API, starting with Traditional Espresso", async ({
  page,
}) => {
  await page.goto("/");

  const cards = page.getByRole("article");

  await expect(cards).toHaveCount(14);
  await expect(cards.first().getByRole("heading", { level: 3 })).toHaveText("Traditional Espresso");
  await expect(page.getByRole("heading", { level: 2, name: "Our coffees" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Our coffees" })).toHaveAttribute(
    "aria-busy",
    "false",
  );
});

test("each card shows its photo, tags, name, description, and price", async ({ page }) => {
  await page.goto("/");

  const cuban = page.getByRole("article", { name: "Cuban" });

  await expect(cuban.getByRole("img", { name: "Cuban" })).toBeVisible();
  // A photo that fails to load still counts as "visible", so wait until it has decoded.
  await expect
    .poll(() => cuban.getByRole("img").evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);
  await expect(cuban.getByText("Special", { exact: true })).toBeVisible();
  await expect(cuban.getByText("Alcoholic", { exact: true })).toBeVisible();
  await expect(cuban.getByText("Iced", { exact: true })).toBeVisible();
  await expect(cuban.getByText("Iced espresso drink with rum, cream and mint")).toBeVisible();
  await expect(cuban.getByText("$", { exact: true })).toBeVisible();
  await expect(cuban.getByText("9.90", { exact: true })).toBeVisible();
});

test("the grid has four 256 by 310 columns, 32 px apart, 40 px between rows, two cards in the last row", async ({
  page,
}) => {
  await page.goto("/");
  const cards = page.getByRole("article");
  await expect(cards).toHaveCount(14);

  const boxes = await Promise.all((await cards.all()).map(boxOf));

  for (const box of boxes) {
    expect(Math.abs(box.width - 256)).toBeLessThanOrEqual(TOLERANCE);
    expect(Math.abs(box.height - 310)).toBeLessThanOrEqual(TOLERANCE);
  }

  // The cards come in DOM order, so a new row starts when the top edge moves down.
  const rowList: [Box, ...Box[]][] = [];
  for (const box of boxes) {
    const row = rowList.at(-1);
    if (row && Math.abs(row[0].y - box.y) <= TOLERANCE) row.push(box);
    else rowList.push([box]);
  }
  expect(rowList.map((row) => row.length)).toEqual([4, 4, 4, 2]);

  // Columns: x = 160, 448, 736, 1024 (256 + 32 each); the last row uses the first two.
  const columnX = [160, 448, 736, 1024];
  for (const row of rowList) {
    for (const [index, box] of row.entries()) {
      expect(Math.abs(box.x - (columnX[index] ?? Number.NaN))).toBeLessThanOrEqual(TOLERANCE);
    }
  }

  // Rows: 40 px between the bottom of one row and the top of the next.
  for (const [index, row] of rowList.entries()) {
    const above = rowList[index - 1]?.[0];
    if (!above) continue;
    expect(Math.abs(row[0].y - (above.y + above.height) - 40)).toBeLessThanOrEqual(TOLERANCE);
  }
});

test("the photo is 120 px round and lifts 20 px over the top edge of the card", async ({
  page,
}) => {
  await page.goto("/");
  const card = page.getByRole("article").first();

  const cardBox = await boxOf(card);
  const photoBox = await boxOf(card.getByRole("img"));

  expect(Math.abs(photoBox.width - 120)).toBeLessThanOrEqual(TOLERANCE);
  expect(Math.abs(photoBox.height - 120)).toBeLessThanOrEqual(TOLERANCE);
  expect(Math.abs(cardBox.y - photoBox.y - 20)).toBeLessThanOrEqual(TOLERANCE);
  expect(
    Math.abs(photoBox.x + photoBox.width / 2 - (cardBox.x + cardBox.width / 2)),
  ).toBeLessThanOrEqual(TOLERANCE);
});

test("the title, name, description, and price have the fonts, sizes, and colors of the design", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const card = page.getByRole("article").first();

  expect(await style(page.getByRole("heading", { level: 2, name: "Our coffees" }))).toMatchObject({
    family: expect.stringContaining("Baloo 2"),
    size: "32px",
    weight: "800",
    color: "rgb(64, 57, 55)",
  });
  expect(await style(card.getByRole("heading", { level: 3 }))).toMatchObject({
    family: expect.stringContaining("Baloo 2"),
    size: "20px",
    weight: "700",
    color: "rgb(64, 57, 55)",
  });
  expect(
    await style(card.getByText("The traditional coffee made with hot water and ground beans")),
  ).toMatchObject({
    family: expect.stringContaining("Roboto"),
    size: "14px",
    weight: "400",
    color: "rgb(141, 134, 134)",
  });
  expect(await style(card.getByText("9.90", { exact: true }))).toMatchObject({
    family: expect.stringContaining("Roboto"),
    size: "24px",
    weight: "700",
    color: "rgb(87, 79, 77)",
  });
  expect(await style(card.getByText("$", { exact: true }))).toMatchObject({
    size: "14px",
    weight: "400",
  });
});

test("no card has text that overflows it, and the page does not scroll sideways", async ({
  page,
}) => {
  await page.goto("/");
  const cards = page.getByRole("article");
  await expect(cards).toHaveCount(14);

  for (const card of await cards.all()) {
    const overflow = await card.evaluate((element) => ({
      vertical: element.scrollHeight - element.clientHeight,
      horizontal: element.scrollWidth - element.clientWidth,
    }));
    expect(overflow).toEqual({ vertical: 0, horizontal: 0 });
  }

  const overflowX = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflowX).toBe(0);
});
