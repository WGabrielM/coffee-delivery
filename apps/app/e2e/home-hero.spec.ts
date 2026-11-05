import { createRequire } from "node:module";

import { expect, test } from "@playwright/test";

const require = createRequire(import.meta.url);

test.use({ viewport: { width: 1440, height: 900 } });

// These tests run without the API: the hero needs no data.
test("the title and the subtitle have the fonts, sizes, and colors of the design", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);

  const title = page.getByRole("heading", {
    level: 1,
    name: "Find the perfect coffee for any time of day",
  });
  const subtitle = page.getByText(
    "With Coffee Delivery you get your coffee wherever you are, at any time",
  );
  const style = (locator: typeof title) =>
    locator.evaluate((element) => {
      const computed = getComputedStyle(element);
      return {
        family: computed.fontFamily,
        size: computed.fontSize,
        weight: computed.fontWeight,
        color: computed.color,
      };
    });

  expect(await style(title)).toMatchObject({
    family: expect.stringContaining("Baloo 2"),
    size: "48px",
    weight: "800",
    color: "rgb(39, 34, 33)",
  });
  expect(await style(subtitle)).toMatchObject({
    family: expect.stringContaining("Roboto"),
    size: "20px",
    weight: "400",
    color: "rgb(64, 57, 55)",
  });
});

test("the hero starts at the 160 px margin: 544 px intro, then the 476 by 360 cup on the right", async ({
  page,
}) => {
  await page.goto("/");

  const intro = await page.getByRole("heading", { level: 1 }).locator("xpath=..").boundingBox();
  const image = await page.locator("main img").boundingBox();

  expect(intro?.x).toBeCloseTo(160, 0);
  expect(intro?.width).toBeCloseTo(544, 0);
  expect(image?.width).toBeCloseTo(476, 0);
  expect(image?.height).toBeCloseTo(360, 0);
  expect((image?.x ?? 0) + (image?.width ?? 0)).toBeCloseTo(1280, 0);
  expect(image?.x ?? 0).toBeGreaterThan((intro?.x ?? 0) + (intro?.width ?? 0));
});

test("the four benefits make a 2 by 2 grid of 32 px circles", async ({ page }) => {
  await page.goto("/");

  const items = page.getByRole("listitem");
  await expect(items).toHaveCount(4);
  const boxes = await items.evaluateAll((elements) =>
    elements.map((element) => {
      const { x, y } = element.getBoundingClientRect();
      const circle = element.querySelector("[aria-hidden='true']")?.getBoundingClientRect();
      return { x: Math.round(x), y: Math.round(y), circle: [circle?.width, circle?.height] };
    }),
  );

  expect(boxes.map((box) => box.circle)).toEqual(Array.from({ length: 4 }, () => [32, 32]));
  expect(boxes[0]?.y).toBe(boxes[1]?.y);
  expect(boxes[2]?.y).toBe(boxes[3]?.y);
  expect(boxes[2]?.y).toBeGreaterThan(boxes[0]?.y ?? 0);
  expect(boxes[0]?.x).toBe(boxes[2]?.x);
  expect(boxes[1]?.x).toBe(boxes[3]?.x);
  expect(boxes[1]?.x).toBeGreaterThan(boxes[0]?.x ?? 0);
});

test("the blurred shapes do not reduce the contrast of any text (axe color-contrast)", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await page.addScriptTag({ path: require.resolve("axe-core") });

  const result = await page.evaluate(async () => {
    const axe = (
      window as unknown as {
        axe: {
          run: (
            context: Element | null,
            options: { runOnly: string[] },
          ) => Promise<{ violations: { nodes: { html: string }[] }[] }>;
        };
      }
    ).axe;
    const { violations } = await axe.run(document.querySelector("main"), {
      runOnly: ["color-contrast"],
    });
    return violations.flatMap((violation) => violation.nodes.map((node) => node.html));
  });

  expect(result).toEqual([]);
});

test("the home page has no horizontal scroll at 1440 px", async ({ page }) => {
  await page.goto("/");

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );

  expect(overflow).toBe(0);
});
