import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 1440, height: 900 } });

// These tests run without the API: the navbar needs no data.
test("the navbar is 104 px high on white, with the logo and the cart on the 160 px margins", async ({
  page,
}) => {
  await page.goto("/");

  const header = await page.getByRole("banner").boundingBox();
  const logo = await page.getByRole("link", { name: "Coffee Delivery, home" }).boundingBox();
  const cart = await page.getByRole("link", { name: "Cart, empty" }).boundingBox();
  const background = await page
    .getByRole("banner")
    .evaluate((element) => getComputedStyle(element).backgroundColor);

  expect(header?.height).toBeCloseTo(104, 0);
  expect(background).toBe("rgb(255, 255, 255)");
  expect(logo?.x).toBeCloseTo(160, 0);
  expect((cart?.x ?? 0) + (cart?.width ?? 0)).toBeCloseTo(1440 - 160, 0);
  expect(cart?.width).toBeCloseTo(38, 0);
  expect(cart?.height).toBeCloseTo(38, 0);
});

test("the location pill is 38 px high and is text, not a control", async ({ page }) => {
  await page.goto("/");

  const pill = page.getByText("Porto Alegre, RS");
  const box = await pill.locator("..").boundingBox();

  await expect(pill).toBeVisible();
  expect(box?.height).toBeCloseTo(38, 0);
  await expect(page.getByRole("link", { name: /Porto Alegre/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Porto Alegre/ })).toHaveCount(0);
});

test("the logo goes home and the cart goes to the checkout, both without a page reload", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => {
    (window as unknown as { marker: string }).marker = "same page";
  });

  await page.getByRole("link", { name: "Cart, empty" }).click();
  await expect(page).toHaveURL("/checkout");
  await expect(page.getByRole("heading", { level: 1, name: "Checkout" })).toBeVisible();
  await page.getByRole("link", { name: "Coffee Delivery, home" }).click();
  await expect(page).toHaveURL("/");

  expect(await page.evaluate(() => (window as unknown as { marker?: string }).marker)).toBe(
    "same page",
  );
});

test("the first Tab shows the skip link, and using it moves the focus to main", async ({
  page,
}) => {
  await page.goto("/checkout");
  const skip = page.getByRole("link", { name: "Skip to content" });

  await expect(skip).not.toBeInViewport();
  await page.keyboard.press("Tab");

  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();

  await page.keyboard.press("Enter");

  await expect(page.locator("main#main-content")).toBeFocused();
});

test("every page has one header, one Main navigation, and one main", async ({ page }) => {
  for (const path of ["/", "/checkout", "/orders/abc", "/does-not-exist"]) {
    await page.goto(path);

    await expect(page.getByRole("banner")).toHaveCount(1);
    await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(1);
    await expect(page.getByRole("main")).toHaveCount(1);
  }
});

test("the keyboard focus ring shows on the cart link", async ({ page }) => {
  await page.goto("/");

  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");

  const cart = page.getByRole("link", { name: "Cart, empty" });
  await expect(cart).toBeFocused();
  const outline = await cart.evaluate((element) => {
    const style = getComputedStyle(element);
    return { width: style.outlineWidth, color: style.outlineColor };
  });
  expect(outline).toEqual({ width: "2px", color: "rgb(128, 71, 248)" });
});
