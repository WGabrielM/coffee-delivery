// Guards the image optimizer of spec 033: the sizes, the transparency, and the idempotence.
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { createCanvas, loadImage } from "@napi-rs/canvas";

import {
  COFFEE_SLUGS,
  HERO_MAX_BYTES,
  HERO_WIDTH,
  PHOTO_MAX_BYTES,
  PHOTO_WIDTH,
  imageJobs,
  optimizeImages,
  toWebp,
} from "./optimize-images.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** A PNG with a colored circle on a transparent background, like the photos. */
function samplePng(width, height) {
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#c47f17");
  gradient.addColorStop(1, "#4b2995");
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(width / 2, height / 2, Math.min(width, height) / 2 - 2, 0, Math.PI * 2);
  context.fill();
  return canvas.toBuffer("image/png");
}

/** The width, height, and the alpha of the first pixel of an image file. */
async function inspect(bytes) {
  const image = await loadImage(bytes);
  const canvas = createCanvas(image.width, image.height);
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0);
  const corner = context.getImageData(0, 0, 1, 1).data[3];
  const center = context.getImageData(image.width >> 1, image.height >> 1, 1, 1).data[3];
  return { width: image.width, height: image.height, corner, center };
}

const isWebp = (bytes) =>
  bytes.toString("latin1", 0, 4) === "RIFF" && bytes.toString("latin1", 8, 12) === "WEBP";

test("the limits are the ones of the spec: 240 px and 25 kB for a photo, 952 px and 120 kB for the hero", () => {
  assert.equal(PHOTO_WIDTH, 240);
  assert.equal(PHOTO_MAX_BYTES, 25 * 1024);
  assert.equal(HERO_WIDTH, 952);
  assert.equal(HERO_MAX_BYTES, 120 * 1024);
  assert.equal(COFFEE_SLUGS.length, 14);
});

test("a photo becomes a square WebP of the given width, under its limit, with a transparent corner", async () => {
  const { bytes, width, height } = await toWebp(samplePng(568, 568), {
    width: PHOTO_WIDTH,
    maxBytes: PHOTO_MAX_BYTES,
  });

  assert.ok(isWebp(bytes));
  assert.ok(bytes.length <= PHOTO_MAX_BYTES);
  const seen = await inspect(bytes);
  assert.deepEqual([width, height, seen.width, seen.height], [240, 240, 240, 240]);
  assert.equal(seen.corner, 0);
  assert.equal(seen.center, 255);
});

test("the proportion of the hero is kept", async () => {
  const { bytes, width, height } = await toWebp(samplePng(1070, 810), {
    width: HERO_WIDTH,
    maxBytes: HERO_MAX_BYTES,
  });

  assert.equal(width, 952);
  assert.equal(height, Math.round((952 * 810) / 1070));
  assert.ok(Math.abs(width / height - 1070 / 810) < 0.01);
  const seen = await inspect(bytes);
  assert.deepEqual([seen.width, seen.height], [width, height]);
});

test("an image that cannot fit in the limit is an error, not a bigger file", async () => {
  await assert.rejects(
    () => toWebp(samplePng(568, 568), { width: 240, maxBytes: 10 }),
    /does not fit/,
  );
});

function sourcesIn(directory) {
  const sourceDir = join(directory, "source");
  for (const job of imageJobs({ sourceDir, assetsDir: join(directory, "assets") })) {
    mkdirSync(dirname(job.source), { recursive: true });
    const hero = job.name.startsWith("hero");
    writeFileSync(job.source, samplePng(hero ? 1070 : 400, hero ? 810 : 400));
  }
  return { sourceDir, assetsDir: join(directory, "assets") };
}

test("it makes the 14 photos and the hero, leaves an image alone that is already under its limit, and rebuilds with force", async () => {
  const directory = mkdtempSync(join(tmpdir(), "optimize-images-"));
  try {
    const dirs = sourcesIn(directory);

    const first = await optimizeImages(dirs);
    const target = join(dirs.assetsDir, "coffees", "latte.webp");
    const before = readFileSync(target);
    const modified = statSync(target).mtimeMs;
    const second = await optimizeImages(dirs);

    assert.equal(first.written.length, 15);
    assert.equal(first.skipped.length, 0);
    assert.equal(second.written.length, 0);
    assert.equal(second.skipped.length, 15);
    assert.deepEqual(readFileSync(target), before);
    assert.equal(statSync(target).mtimeMs, modified);

    const forced = await optimizeImages({ ...dirs, force: true });
    assert.equal(forced.written.length, 15);
    assert.deepEqual(readFileSync(target), before);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("a file over its limit is made again, and a missing source is an error", async () => {
  const directory = mkdtempSync(join(tmpdir(), "optimize-images-"));
  try {
    const dirs = sourcesIn(directory);
    await optimizeImages(dirs);
    const heavy = join(dirs.assetsDir, "coffees", "cuban.webp");
    writeFileSync(heavy, Buffer.alloc(PHOTO_MAX_BYTES + 1));

    const again = await optimizeImages(dirs);

    assert.deepEqual(again.written, ["coffees/cuban.webp"]);
    assert.ok(statSync(heavy).size <= PHOTO_MAX_BYTES);

    rmSync(join(dirs.sourceDir, "hero", "hero.png"));
    rmSync(join(dirs.assetsDir, "hero", "hero.webp"));
    await assert.rejects(() => optimizeImages(dirs), /hero\.png is missing/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("the committed images of the app follow the rules of the spec", async () => {
  for (const job of imageJobs({
    sourceDir: join(root, "apps/app/assets-source"),
    assetsDir: join(root, "apps/app/src/assets"),
  })) {
    const bytes = readFileSync(job.target);
    const seen = await inspect(bytes);
    const source = await loadImage(readFileSync(job.source));

    assert.ok(isWebp(bytes), `${job.name} is WebP`);
    assert.ok(bytes.length <= job.maxBytes, `${job.name} is ${bytes.length} bytes`);
    assert.equal(seen.width, job.width, `${job.name} width`);
    assert.equal(seen.height, Math.round((job.width * source.height) / source.width));
    assert.equal(seen.corner, 0, `${job.name} keeps its transparent background`);
  }
});
