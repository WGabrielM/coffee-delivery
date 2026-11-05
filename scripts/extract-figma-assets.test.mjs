// Guards the extraction of the Figma assets (spec 014). None of these tests needs the `.fig` file,
// which is not tracked by Git; the last one runs on the real file when it is on the machine.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import * as zlib from "node:zlib";

import { FIG_FILE, collectAssets, missingFigMessage, pngSize } from "./extract-figma-assets.mjs";
import {
  COFFEE_SLUGS,
  FIGMA_COFFEE_NAMES,
  ICON_NAMES,
  hexColor,
  multiply,
  normalizeIconName,
  pathData,
  svgTransform,
} from "./lib/fig-assets.mjs";
import {
  KiwiReader,
  decodeMessage,
  decodeSchema,
  readCanvasChunks,
  readZip,
} from "./lib/fig-file.mjs";

const { crc32, deflateRawSync } = zlib;
// zstd is in Node 22.15 and newer; older versions still run every test but the zstd one.
const HAS_ZSTD = typeof zlib.zstdCompressSync === "function";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(root, path), "utf8");

// --- Helpers that build the formats, so the readers are tested against bytes written here. ---

const varUint = (value) => {
  const bytes = [];
  let rest = value;
  while (rest >= 0x80) {
    bytes.push((rest % 0x80) | 0x80);
    rest = Math.floor(rest / 0x80);
  }
  bytes.push(rest);
  return bytes;
};
const varInt = (value) => varUint(value < 0 ? -value * 2 - 1 : value * 2);
const cString = (text) => [...Buffer.from(text, "utf8"), 0];
const varFloat = (value) => {
  if (value === 0) return [0];
  const view = new DataView(new ArrayBuffer(4));
  view.setFloat32(0, value);
  const bits = view.getInt32(0);
  const rotated = (bits >>> 23) | (bits << 9);
  return [rotated & 255, (rotated >>> 8) & 255, (rotated >>> 16) & 255, (rotated >>> 24) & 255];
};

// A schema with an enum, a struct, and a message, in the binary form Figma uses.
// ENUM Kind { LOW = 1, HIGH = 2 }; STRUCT Point { float x; float y; };
// MESSAGE Message { string name = 1; Point[] points = 2; uint count = 3; bool flag = 4; int delta = 5; Kind kind = 6; byte[] raw = 7; }
const BOOL = -1;
const BYTE = -2;
const INT = -3;
const UINT = -4;
const FLOAT = -5;
const STRING = -6;
const field = (name, type, isArray, value) => [
  ...cString(name),
  ...varInt(type),
  isArray ? 1 : 0,
  ...varUint(value),
];
const schema = Buffer.from([
  ...varUint(3),
  ...cString("Kind"),
  0,
  ...varUint(2),
  ...field("LOW", 0, false, 1),
  ...field("HIGH", 0, false, 2),
  ...cString("Point"),
  1,
  ...varUint(2),
  ...field("x", FLOAT, false, 1),
  ...field("y", FLOAT, false, 2),
  ...cString("Message"),
  2,
  ...varUint(7),
  ...field("name", STRING, false, 1),
  ...field("points", 1, true, 2),
  ...field("count", UINT, false, 3),
  ...field("flag", BOOL, false, 4),
  ...field("delta", INT, false, 5),
  ...field("kind", 0, false, 6),
  ...field("raw", BYTE, true, 7),
]);

const message = Buffer.from([
  1,
  ...cString("café"),
  2,
  ...varUint(2),
  ...varFloat(1.5),
  ...varFloat(-0.25),
  ...varFloat(0),
  ...varFloat(300),
  3,
  ...varUint(300),
  4,
  1,
  5,
  ...varInt(-7),
  6,
  ...varUint(2),
  7,
  ...varUint(3),
  9,
  8,
  7,
  0,
]);

test("the Kiwi reader decodes varints, floats, and strings", () => {
  const reader = new KiwiReader(
    Buffer.from([...varUint(300), ...varInt(-7), ...varInt(7), ...varFloat(0.1), ...cString("ok")]),
  );

  assert.equal(reader.varUint(), 300);
  assert.equal(reader.varInt(), -7);
  assert.equal(reader.varInt(), 7);
  assert.ok(Math.abs(reader.varFloat() - 0.1) < 1e-7);
  assert.equal(reader.string(), "ok");
  assert.throws(() => reader.byte(), /ended unexpectedly/);
});

test("the schema and a message are decoded: enums, structs, arrays, and unknown ids", () => {
  const definitions = decodeSchema(schema);

  assert.deepEqual(
    definitions.map((definition) => [definition.name, definition.kind]),
    [
      ["Kind", "ENUM"],
      ["Point", "STRUCT"],
      ["Message", "MESSAGE"],
    ],
  );
  const decoded = decodeMessage(definitions, "Message", message);
  assert.equal(decoded.name, "café");
  assert.deepEqual(decoded.points, [
    { x: 1.5, y: -0.25 },
    { x: 0, y: 300 },
  ]);
  assert.equal(decoded.count, 300);
  assert.equal(decoded.flag, true);
  assert.equal(decoded.delta, -7);
  assert.equal(decoded.kind, "HIGH");
  assert.deepEqual([...decoded.raw], [9, 8, 7]);
  assert.throws(
    () => decodeMessage(definitions, "Message", Buffer.from([99, 0])),
    /no field with id 99/,
  );
});

/** A ZIP with one stored entry, one deflated entry, and a folder, as `.fig` files have. */
function zip(entries) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const [name, data, method] of entries) {
    const stored = method === 8 ? deflateRawSync(data) : data;
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(method, 8);
    header.writeUInt32LE(crc32(data), 14);
    header.writeUInt32LE(stored.length, 18);
    header.writeUInt32LE(data.length, 22);
    header.writeUInt16LE(Buffer.byteLength(name), 26);
    const local = Buffer.concat([header, Buffer.from(name), stored]);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(method, 10);
    central.writeUInt32LE(stored.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(Buffer.byteLength(name), 28);
    central.writeUInt32LE(offset, 42);
    centrals.push(Buffer.concat([central, Buffer.from(name)]));
    locals.push(local);
    offset += local.length;
  }
  const directory = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, directory, end]);
}

test("the ZIP reader returns stored and deflated entries and skips folders", () => {
  const files = readZip(
    zip([
      ["images/", Buffer.alloc(0), 0],
      ["images/abc", Buffer.from("png bytes"), 0],
      ["meta.json", Buffer.from('{"a":1}'), 8],
    ]),
  );

  assert.deepEqual([...files.keys()], ["images/abc", "meta.json"]);
  assert.equal(files.get("images/abc").toString(), "png bytes");
  assert.equal(files.get("meta.json").toString(), '{"a":1}');
  assert.throws(() => readZip(Buffer.from("not a zip at all, nothing here")), /Not a ZIP/);
});

function canvas(chunks) {
  const parts = [Buffer.from("fig-kiwi"), Buffer.from([15, 0, 0, 0])];
  for (const chunk of chunks) {
    const length = Buffer.alloc(4);
    length.writeUInt32LE(chunk.length);
    parts.push(length, chunk);
  }
  return Buffer.concat(parts);
}

test("the canvas chunks are inflated, deflate or zstd, detected by the magic bytes", () => {
  const compressSecond = HAS_ZSTD ? zlib.zstdCompressSync : deflateRawSync;
  const [first, second] = readCanvasChunks(
    canvas([deflateRawSync(schema), compressSecond(message)]),
  );

  assert.deepEqual(first, schema);
  assert.deepEqual(second, message);
  assert.throws(() => readCanvasChunks(Buffer.from("fig-nope0000")), /Not a Figma canvas/);
});

const floats = (...values) =>
  values.flatMap((value) => [...Buffer.from(new Float32Array([value]).buffer)]);

test("a path blob becomes SVG path data", () => {
  const blob = Buffer.from([
    1,
    ...floats(1, 2),
    2,
    ...floats(3.5, 4),
    3,
    ...floats(5, 6, 7, 8),
    4,
    ...floats(1, 2, 3, 4, 5, 6.123456),
    0,
  ]);

  assert.equal(pathData(blob), "M1 2L3.5 4Q5 6 7 8C1 2 3 4 5 6.123Z");
  assert.throws(() => pathData(Buffer.from([9])), /Unknown path command 9/);
});

test("transforms: the identity is dropped and a parent applies after its child", () => {
  const identity = { m00: 1, m01: 0, m02: 0, m10: 0, m11: 1, m12: 0 };

  assert.equal(svgTransform(identity), undefined);
  assert.equal(svgTransform({ ...identity, m02: 8, m12: 3 }), "matrix(1 0 0 1 8 3)");
  const moved = multiply({ ...identity, m02: 10, m12: 20 }, { ...identity, m02: 1, m12: 2 });
  assert.deepEqual(moved, { ...identity, m02: 11, m12: 22 });
  const turned = multiply(
    { m00: 0, m01: -1, m02: 0, m10: 1, m11: 0, m12: 0 },
    { ...identity, m02: 5 },
  );
  assert.deepEqual(turned, { m00: 0, m01: -1, m02: 0, m10: 1, m11: 0, m12: 5 });
});

test("colors are written as upper-case hex", () => {
  assert.equal(hexColor({ r: 0.5019608, g: 0.2784314, b: 0.972549 }), "#8047F8");
  assert.equal(hexColor({ r: 0, g: 0, b: 0 }), "#000000");
});

test("Figma icon names are normalized, including the typo of the Style Guide", () => {
  assert.equal(normalizeIconName("Type=currenc-dollar-regular"), "currency-dollar");
  assert.equal(normalizeIconName("Type=map-pin-line-regular"), "map-pin-line");
  assert.equal(normalizeIconName("Type=shopping-cart-fill"), "shopping-cart-fill");
  assert.equal(normalizeIconName("Type=plus-bold"), "plus-bold");
});

test("without the Figma file the script fails and names the expected path", () => {
  const missing = join(root, "docs", "design", "does-not-exist.fig");
  const run = spawnSync(process.execPath, ["scripts/extract-figma-assets.mjs", missing], {
    cwd: root,
    encoding: "utf8",
  });

  assert.notEqual(run.status, 0);
  assert.ok(run.stderr.includes(missing), run.stderr);
  assert.ok(run.stderr.includes(FIG_FILE), run.stderr);
  assert.equal(missingFigMessage("x.fig").includes("x.fig"), true);
});

test("the slugs are the ones of the catalog seed, in order, in the script and in the app manifest", () => {
  const seed = read("apps/api/src/main/resources/db/migration/V2__seed_catalog.sql");
  const coffees = seed.slice(
    seed.indexOf("INSERT INTO coffees"),
    seed.indexOf("INSERT INTO coffee_tags"),
  );
  const seedSlugs = [...coffees.matchAll(/^\s*\('([a-z-]+)',/gm)].map((match) => match[1]);
  const manifest = read("apps/app/src/assets/index.ts");
  const manifestSlugs = [
    ...manifest
      .slice(manifest.indexOf("COFFEE_SLUGS = ["))
      .split("] as const")[0]
      .matchAll(/"([a-z-]+)"/g),
  ].map((match) => match[1]);

  assert.equal(seedSlugs.length, 14);
  assert.deepEqual(COFFEE_SLUGS, seedSlugs);
  assert.deepEqual(manifestSlugs, seedSlugs);
  assert.deepEqual(Object.values(FIGMA_COFFEE_NAMES).toSorted(), seedSlugs.toSorted());
});

test("the manifest lists the same 13 icons as the script", () => {
  const manifest = read("apps/app/src/assets/index.ts");
  const names = [
    ...manifest
      .slice(manifest.indexOf("ICON_NAMES = ["))
      .split("] as const")[0]
      .matchAll(/"([a-z-]+)"/g),
  ].map((match) => match[1]);

  assert.deepEqual(names, ICON_NAMES);
  assert.equal(ICON_NAMES.length, 13);
});

test("the .fig file is never committed and the assets do not need it", () => {
  const ignore = read(".gitignore");
  assert.match(ignore, /docs\/design\/\*\.fig/);
  // The app imports only files under src/assets; no import reaches docs/design or a .fig.
  for (const file of ["apps/app/src/assets/index.ts", "apps/app/vite.config.ts"]) {
    assert.doesNotMatch(
      read(file),
      /(?:from|import)\s*\(?\s*["'][^"']*(?:docs\/design|\.fig)["']/,
      file,
    );
  }
});

test("on the real .fig: 13 icons, 14 matched photos, and the hero, logo, and illustration", (context) => {
  const path = join(root, FIG_FILE);
  if (!existsSync(path)) return context.skip("the .fig file is not on this machine");

  const assets = collectAssets(readFileSync(path));

  assert.equal(assets.icons.size, 13);
  for (const [name, icon] of assets.icons) {
    assert.match(icon.svg, /fill="currentColor"/, name);
    assert.doesNotMatch(icon.svg, /#[0-9A-Fa-f]{6}/, name);
  }
  assert.equal(assets.photos.size, 14);
  assert.equal(new Set([...assets.photos.values()].map((photo) => photo.hash)).size, 14);
  for (const [slug, photo] of assets.photos) {
    const { width, height } = pngSize(photo.bytes);
    assert.ok(width === height && width >= 240, `${slug} is ${width}x${height}`);
  }
  assert.match(assets.logo.svg, /#8047F8/);
  assert.match(assets.logo.svg, /#403937/);
  assert.match(assets.illustration.svg, /viewBox="0 0 492 293"/);
  assert.ok(assets.hero.width >= 476 * 2);
});
