import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  COFFEE_SLUGS,
  ICON_NAMES,
  coffeeImages,
  deliveryIllustration,
  heroImage,
  iconSvgs,
  logo,
} from "./index";

const assets = import.meta.dirname;
const read = (path: string) => readFileSync(join(assets, path));
const names = (directory: string) => readdirSync(join(assets, directory)).toSorted();

/** Width, height, and the alpha flag from the VP8X chunk of a WebP (the optimizer writes this form). */
function webpInfo(file: Buffer): { width: number; height: number; hasAlpha: boolean } {
  expect(file.toString("latin1", 0, 4), "RIFF signature").toBe("RIFF");
  expect(file.toString("latin1", 8, 12), "WEBP signature").toBe("WEBP");
  expect(file.toString("latin1", 12, 16), "extended format").toBe("VP8X");
  return {
    width: file.readUIntLE(24, 3) + 1,
    height: file.readUIntLE(27, 3) + 1,
    hasAlpha: (file[20]! & 0x10) !== 0,
  };
}

describe("coffee photos", () => {
  it("has the 14 slugs of the catalog seed, in grid order", () => {
    expect(COFFEE_SLUGS).toEqual([
      "traditional-espresso",
      "american-espresso",
      "creamy-espresso",
      "iced-espresso",
      "coffee-with-milk",
      "latte",
      "cappuccino",
      "macchiato",
      "mochaccino",
      "hot-chocolate",
      "cuban",
      "hawaiian",
      "arabic",
      "irish",
    ]);
  });

  it("gives every slug an image", () => {
    const empty = COFFEE_SLUGS.filter(
      (slug) => typeof coffeeImages[slug] !== "string" || coffeeImages[slug] === "",
    );

    expect(empty).toEqual([]);
    expect(Object.keys(coffeeImages).toSorted()).toEqual(COFFEE_SLUGS.toSorted());
  });

  it.each(COFFEE_SLUGS)(
    "%s.webp is a square of 240 px with a transparent background, at most 25 kB",
    (slug) => {
      const file = read(`coffees/${slug}.webp`);
      const { width, height, hasAlpha } = webpInfo(file);

      expect(width).toBe(240);
      expect(height).toBe(240);
      expect(hasAlpha).toBe(true);
      expect(file.length).toBeLessThanOrEqual(25 * 1024);
    },
  );

  it("has a file for each slug and nothing else", () => {
    expect(names("coffees")).toEqual(COFFEE_SLUGS.map((slug) => `${slug}.webp`).toSorted());
  });
});

describe("icons", () => {
  it("are the 13 of the design, no more", () => {
    expect(ICON_NAMES.toSorted()).toEqual(
      [
        "shopping-cart-fill",
        "timer-fill",
        "package-fill",
        "coffee-fill",
        "map-pin-fill",
        "map-pin-line",
        "currency-dollar",
        "trash",
        "plus-bold",
        "minus-bold",
        "credit-card",
        "money",
        "bank",
      ].toSorted(),
    );
    expect(names("icons")).toEqual(ICON_NAMES.map((name) => `${name}.svg`).toSorted());
  });

  it.each(ICON_NAMES)("%s is an SVG that takes its color from currentColor", (name) => {
    const svg = iconSvgs[name];

    expect(svg).toMatch(/^<svg [^>]*viewBox="0 0 32 32"/);
    expect(svg).toContain('fill="currentColor"');
    expect(svg).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgb\(/);
    expect(svg).toContain("<path ");
  });
});

describe("logo, hero image, and delivery illustration", () => {
  it("are non-empty files", () => {
    for (const url of [logo, heroImage, deliveryIllustration]) {
      expect(url).toEqual(expect.any(String));
      expect(url.length).toBeGreaterThan(0);
    }
  });

  it("have the sizes of the design", () => {
    // The logo frame is 84.95 by 40 in Figma.
    expect(read("logo/logo.svg").toString()).toMatch(/viewBox="0 0 84\.95\d* 40"/);
    expect(read("success/delivery-illustration.svg").toString()).toMatch(/viewBox="0 0 492 293"/);
    // The raster is twice the 476 by 360 of the frame, so a 2x screen stays sharp, and at most 120 kB.
    const file = read("hero/hero.webp");
    const { width, height, hasAlpha } = webpInfo(file);
    expect(width).toBe(476 * 2);
    expect(width / height).toBeCloseTo(1070 / 810, 2);
    expect(hasAlpha).toBe(true);
    expect(file.length).toBeLessThanOrEqual(120 * 1024);
  });

  it("keep their own colors, because only the icons follow the text color", () => {
    expect(read("logo/logo.svg").toString()).toMatch(/fill="#[0-9A-Fa-f]{6}"/);
    expect(read("success/delivery-illustration.svg").toString()).toMatch(/fill="#[0-9A-Fa-f]{6}"/);
  });
});
