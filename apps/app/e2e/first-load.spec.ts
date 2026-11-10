import { expect, test, type Page } from "@playwright/test";

import { createOrder } from "./checkout-helpers";

test.use({ viewport: { width: 1440, height: 900 } });

// These tests need the API (`yarn infra:up`, `yarn api:dev`) and the production build, because the
// chunks and the transferred size exist only there: `playwright.config.ts` builds the app and serves
// it on port 4173 (`vite preview`, which proxies /api like the dev server).
const BUILD = "http://localhost:4173";
test.use({ baseURL: BUILD });

const ENTRY_CHUNK_LIMIT = 250_000;
const HOME_TRANSFER_LIMIT = 600_000;

/** The JavaScript files a page asks for, as they are requested. */
function watchScripts(page: Page) {
  const urls: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "script") urls.push(new URL(request.url()).pathname);
  });
  return urls;
}

test("the entry chunk is under 250 kB", async ({ page }) => {
  const html = await (await page.request.get("/")).text();
  const entry = /<script type="module"[^>]* src="([^"]+)"/.exec(html)?.[1];
  expect(entry, "the module script of index.html").toBeTruthy();

  const body = await (await page.request.get(entry!)).body();

  expect(body.length).toBeLessThan(ENTRY_CHUNK_LIMIT);
});

test("Home asks for no JavaScript of the checkout or the order page", async ({ page }) => {
  const scripts = watchScripts(page);

  await page.goto("/");
  await expect(page.getByRole("article")).toHaveCount(14);

  expect(scripts.length).toBeGreaterThan(0);
  expect(scripts.filter((path) => /CheckoutPage|OrderPage/.test(path))).toEqual([]);
});

test("the checkout chunk is asked for when the person goes to the checkout", async ({ page }) => {
  const scripts = watchScripts(page);
  await page.goto("/");
  await expect(page.getByRole("article")).toHaveCount(14);

  await page.getByRole("link", { name: /^Cart/ }).click();

  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByRole("heading", { level: 1, name: "Checkout" })).toBeAttached();
  expect(scripts.filter((path) => /CheckoutPage/.test(path))).toHaveLength(1);
  expect(scripts.filter((path) => /OrderPage/.test(path))).toEqual([]);
});

test("a first visit to /checkout shows the page after a short wait", async ({ page }) => {
  await page.goto("/checkout");

  await expect(page.getByRole("heading", { level: 1, name: "Checkout" })).toBeAttached();
  await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
});

test("a first visit to /orders/<id> shows the confirmation of that order", async ({ page }) => {
  const id = await createOrder(page.request, { paymentMethod: "cash" });
  const scripts = watchScripts(page);

  await page.goto(`/orders/${id}`);

  await expect(page.getByRole("heading", { level: 1, name: "Uhu! Order confirmed" })).toBeVisible();
  expect(scripts.filter((path) => /OrderPage/.test(path))).toHaveLength(1);
  expect(scripts.filter((path) => /CheckoutPage/.test(path))).toEqual([]);
});

test("a chunk that cannot be loaded shows the error page of the router, not a blank page", async ({
  page,
}) => {
  await page.route(/CheckoutPage-.*[.]js/, (route) => route.abort());
  await page.goto("/");
  await expect(page.getByRole("article")).toHaveCount(14);

  await page.getByRole("link", { name: /^Cart/ }).click();

  await expect(page.getByRole("heading", { name: "Unexpected Application Error!" })).toBeVisible();
});

test("a first visit with a chunk that cannot be loaded shows the error page too", async ({
  page,
}) => {
  await page.route(/OrderPage-.*[.]js/, (route) => route.abort());

  await page.goto("/orders/00000000-0000-4000-8000-000000000000");

  await expect(page.getByRole("heading", { name: "Unexpected Application Error!" })).toBeVisible();
});

test("every coffee photo is lazy and decoded asynchronously, and the hero is loaded first", async ({
  page,
}) => {
  await page.goto("/");
  const photos = page.getByRole("article").getByRole("img");
  await expect(photos).toHaveCount(14);

  const attributes = await photos.evaluateAll((images) =>
    images.map((image) => ({
      loading: image.getAttribute("loading"),
      decoding: image.getAttribute("decoding"),
      source: image.getAttribute("src"),
    })),
  );
  const hero = page.locator("section img[alt='']").first();

  expect(attributes).toHaveLength(14);
  for (const photo of attributes) {
    expect(photo.loading).toBe("lazy");
    expect(photo.decoding).toBe("async");
    expect(photo.source).toMatch(/[.]webp$/);
  }
  await expect(hero).toHaveAttribute("fetchpriority", "high");
  await expect(hero).not.toHaveAttribute("loading", /.*/);
  await expect(hero).toHaveAttribute("src", /[.]webp$/);
});

test("the whole home page, until the 14 cards show, transfers under 600 kB", async ({ page }) => {
  const client = await page.context().newCDPSession(page);
  await client.send("Network.enable");
  await client.send("Network.setCacheDisabled", { cacheDisabled: true });
  let transferred = 0;
  client.on("Network.loadingFinished", (event) => {
    transferred += event.encodedDataLength;
  });

  await page.goto("/");
  await expect(page.getByRole("article")).toHaveCount(14);
  await page.waitForLoadState("networkidle");

  console.log(`Home transferred ${(transferred / 1000).toFixed(0)} kB`);
  expect(transferred).toBeGreaterThan(0);
  expect(transferred).toBeLessThan(HOME_TRANSFER_LIMIT);
});
