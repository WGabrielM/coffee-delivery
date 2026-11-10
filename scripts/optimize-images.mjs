// Makes the WebP images of the app from the PNG sources (spec 033):
//   node scripts/optimize-images.mjs [--force]
// The PNG sources are in apps/app/assets-source (the Figma extraction writes them there; they are not
// part of the build). The WebP files go to apps/app/src/assets, which is what the app imports:
//   - each coffee photo at 240 px wide (twice the 120 px of the card), at most 25 kB;
//   - the hero at 952 px wide (twice the 476 px of the design), at most 120 kB.
// A file that is already there and under its limit is left alone, so running it again changes
// nothing; `--force` makes every file again. The background stays transparent and the proportion
// does not change. No dependency is added: `@napi-rs/canvas` decodes, resizes, and encodes.
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { createCanvas, loadImage } from "@napi-rs/canvas";

export const PHOTO_WIDTH = 240;
export const PHOTO_MAX_BYTES = 25 * 1024;
export const HERO_WIDTH = 952;
export const HERO_MAX_BYTES = 120 * 1024;

/** The slugs of the catalog, in the order of the grid (the same as the app manifest). */
export const COFFEE_SLUGS = [
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
];

/** The qualities tried in turn, from the best one down, until the file fits its limit. */
const QUALITIES = [90, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40];

/**
 * Resizes a PNG to `width` (keeping its proportion, on a transparent background) and encodes it as
 * WebP with the best quality that fits in `maxBytes`. Throws when even the lowest quality does not.
 */
export async function toWebp(pngBytes, { width, maxBytes }) {
  const image = await loadImage(pngBytes);
  const height = Math.round((width * image.height) / image.width);
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, width, height);
  for (const quality of QUALITIES) {
    const bytes = canvas.toBuffer("image/webp", quality);
    if (bytes.length <= maxBytes) return { bytes, width, height, quality };
  }
  throw new Error(`The image does not fit in ${maxBytes} bytes at ${QUALITIES.at(-1)} quality.`);
}

/** The images to make: where each PNG source is, where its WebP goes, and its rules. */
export function imageJobs({ sourceDir, assetsDir }) {
  const photos = COFFEE_SLUGS.map((slug) => ({
    name: `coffees/${slug}.webp`,
    source: join(sourceDir, "coffees", `${slug}.png`),
    target: join(assetsDir, "coffees", `${slug}.webp`),
    width: PHOTO_WIDTH,
    maxBytes: PHOTO_MAX_BYTES,
  }));
  const hero = {
    name: "hero/hero.webp",
    source: join(sourceDir, "hero", "hero.png"),
    target: join(assetsDir, "hero", "hero.webp"),
    width: HERO_WIDTH,
    maxBytes: HERO_MAX_BYTES,
  };
  return [...photos, hero];
}

/**
 * Makes the WebP files. A target that exists and is at most its limit is skipped, unless `force`.
 * Returns the names written and the names skipped.
 */
export async function optimizeImages({ sourceDir, assetsDir, force = false }) {
  const written = [];
  const skipped = [];
  for (const job of imageJobs({ sourceDir, assetsDir })) {
    if (!force && existsSync(job.target) && statSync(job.target).size <= job.maxBytes) {
      skipped.push(job.name);
      continue;
    }
    if (!existsSync(job.source)) throw new Error(`The source ${job.source} is missing.`);
    const { bytes } = await toWebp(readFileSync(job.source), job);
    mkdirSync(dirname(job.target), { recursive: true });
    writeFileSync(job.target, bytes);
    written.push(job.name);
  }
  return { written, skipped };
}

async function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const { written, skipped } = await optimizeImages({
    sourceDir: join(root, "apps/app/assets-source"),
    assetsDir: join(root, "apps/app/src/assets"),
    force: process.argv.includes("--force"),
  });
  console.log(`Wrote ${written.length} WebP files, left ${skipped.length} alone.`);
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
