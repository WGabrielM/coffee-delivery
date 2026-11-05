// Writes the brand and product assets of the app from the local Figma file (spec 014):
//   node scripts/extract-figma-assets.mjs [path-to-file.fig]
// The `.fig` stays on the developer's machine (docs/design, ignored by Git); the outputs are committed,
// so the app builds without it. Running the script again on the same file gives the same files.
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { createCanvas, loadImage } from "@napi-rs/canvas";

import {
  COFFEE_SLUGS,
  FIGMA_COFFEE_NAMES,
  ICON_NAMES,
  colorSvg,
  descendants,
  findCoffeeCards,
  iconSvg,
  indexDocument,
  inGridOrder,
  normalizeIconName,
} from "./lib/fig-assets.mjs";
import { openFig } from "./lib/fig-file.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const FIG_FILE = "docs/design/Coffee Delivery • Desafio React (Copy).fig";
const MIN_PHOTO_SIZE = 240;

/** The message printed when the Figma file is not on this machine. */
export function missingFigMessage(figPath) {
  return (
    `The Figma file was not found at ${figPath}.\n` +
    `Put the .fig export at ${FIG_FILE} (it is not tracked by Git), or pass its path:\n` +
    "  node scripts/extract-figma-assets.mjs <path-to-file.fig>\n" +
    "The committed assets in apps/app/src/assets are enough to build the app without it."
  );
}

/** Width and height of a PNG, from its IHDR chunk. */
export function pngSize(bytes) {
  if (bytes.toString("latin1", 1, 4) !== "PNG") throw new Error("The image is not a PNG.");
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

function find(index, predicate, what) {
  const node = index.nodes.find(predicate);
  if (node === undefined) throw new Error(`${what} is not in the Figma file.`);
  return node;
}

const describe = (node) => `${node.name} (${node.guid.sessionID}:${node.guid.localID})`;
const kb = (bytes) => `${(bytes.length / 1024).toFixed(0)} kB`;

/** Reads the Figma file and returns every asset, checked, without writing anything. */
export function collectAssets(figBuffer) {
  const { message, images } = openFig(figBuffer);
  const index = indexDocument(message);

  // Icons: the symbols of the "Ícones" frame of the Style Guide.
  const iconFrame = find(
    index,
    (node) => node.type === "FRAME" && node.name === "Ícones",
    'The "Ícones" frame',
  );
  const icons = new Map();
  for (const node of descendants(index, iconFrame)) {
    if (node.type !== "SYMBOL" || !node.name.startsWith("Type=")) continue;
    icons.set(normalizeIconName(node.name), { source: describe(node), svg: iconSvg(index, node) });
  }
  const missingIcons = ICON_NAMES.filter((name) => !icons.has(name));
  const extraIcons = [...icons.keys()].filter((name) => !ICON_NAMES.includes(name));
  if (missingIcons.length > 0 || extraIcons.length > 0) {
    throw new Error(
      `The icons do not match the spec. Missing: ${missingIcons}. Unexpected: ${extraIcons}.`,
    );
  }

  // Coffee photos: matched by the image hash of each card, never by position.
  const cards = findCoffeeCards(index);
  const photos = new Map();
  for (const card of cards) {
    const slug = FIGMA_COFFEE_NAMES[card.title];
    if (slug === undefined)
      throw new Error(`The card "${card.title}" has no slug. Add it to FIGMA_COFFEE_NAMES.`);
    if (photos.has(slug)) throw new Error(`Two cards map to the slug ${slug}.`);
    const bytes = images.get(card.hash);
    if (bytes === undefined)
      throw new Error(`The image ${card.hash} of "${card.title}" is not in the file.`);
    const { width, height } = pngSize(bytes);
    if (width !== height || width < MIN_PHOTO_SIZE) {
      throw new Error(
        `The photo of "${card.title}" is ${width}x${height}; it must be square and at least ${MIN_PHOTO_SIZE} px.`,
      );
    }
    photos.set(slug, { card, bytes, width, height, hash: card.hash });
  }
  const unmatched = COFFEE_SLUGS.filter((slug) => !photos.has(slug));
  if (unmatched.length > 0) throw new Error(`No card for the slugs: ${unmatched}.`);
  const gridOrder = inGridOrder(cards).map((card) => FIGMA_COFFEE_NAMES[card.title]);
  if (gridOrder.join() !== COFFEE_SLUGS.join()) {
    throw new Error(
      `The grid order of the cards (${gridOrder}) differs from the seed order (${COFFEE_SLUGS}).`,
    );
  }
  // Cross-check: the Style Guide holds one photo symbol per coffee; the hashes must be the same set.
  const guide = find(
    index,
    (node) =>
      node.type === "FRAME" &&
      node.name === "Coffee" &&
      index.children(node).some((child) => child.name.startsWith("Type=")),
    'The Style Guide "Coffee" frame',
  );
  const guideHashes = new Set(
    index
      .children(guide)
      .map((symbol) => cards.find((card) => card.symbolName === symbol.name)?.hash),
  );
  if (guideHashes.has(undefined) || guideHashes.size !== COFFEE_SLUGS.length) {
    throw new Error("The photo symbols of the Style Guide do not match the photos of the cards.");
  }

  // Hero image, logo, and delivery illustration.
  const home = find(
    index,
    (node) => node.type === "FRAME" && node.name === "Coffee Delivery - Home",
    "The Home screen",
  );
  const homeParts = [...descendants(index, home)];
  const heroNode = homeParts.find(
    (node) =>
      node.name === "Imagem" && (node.fillPaints ?? []).some((paint) => paint.type === "IMAGE"),
  );
  if (heroNode === undefined) throw new Error("The hero image is not on the Home screen.");
  const heroHash = Buffer.from(
    heroNode.fillPaints.find((paint) => paint.type === "IMAGE").image.hash,
  ).toString("hex");
  const logoNode = homeParts.find((node) => node.type === "VECTOR" && node.name === "Logo");
  if (logoNode === undefined) throw new Error("The logo is not on the Home screen.");
  const success = find(
    index,
    (node) => node.type === "FRAME" && node.name === "Coffee Delivery - Success",
    "The Success screen",
  );
  const illustrationNode = [...descendants(index, success)].find(
    (node) => node.name === "Illustration",
  );
  if (illustrationNode === undefined)
    throw new Error("The delivery illustration is not on the Success screen.");

  return {
    icons,
    photos,
    hero: {
      source: describe(heroNode),
      hash: heroHash,
      bytes: images.get(heroHash),
      ...pngSize(images.get(heroHash)),
    },
    logo: { source: describe(logoNode), svg: colorSvg(index, logoNode) },
    illustration: { source: describe(illustrationNode), svg: colorSvg(index, illustrationNode) },
  };
}

function write(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

/** Draws every photo with its slug, so the matching can be checked by eye. */
async function contactSheet(photos) {
  const columns = 4;
  const tile = 260;
  const label = 64;
  const rows = Math.ceil(COFFEE_SLUGS.length / columns);
  const canvas = createCanvas(columns * tile + 20, rows * (tile + label) + 20);
  const context = canvas.getContext("2d");
  context.fillStyle = "#FFFFFF";
  context.fillRect(0, 0, canvas.width, canvas.height);
  for (const [position, slug] of COFFEE_SLUGS.entries()) {
    const photo = photos.get(slug);
    const x = 20 + (position % columns) * tile - 10;
    const y = 20 + Math.floor(position / columns) * (tile + label) - 10;
    context.drawImage(await loadImage(photo.bytes), x, y, 240, 240);
    context.fillStyle = "#272221";
    context.font = "bold 16px sans-serif";
    context.fillText(`${position + 1}. ${slug}`, x, y + 262);
    context.fillStyle = "#574F4D";
    context.font = "13px sans-serif";
    context.fillText(`Figma: ${photo.card.title}`, x, y + 280);
    context.fillText(`${photo.width}px  ${photo.hash.slice(0, 10)}`, x, y + 297);
  }
  return canvas.toBuffer("image/png");
}

function mappingDocument(assets, figPath) {
  const rows = COFFEE_SLUGS.map((slug, position) => {
    const photo = assets.photos.get(slug);
    return `| ${position + 1} | \`${slug}\` | ${photo.card.title} | ${photo.card.symbolName} | \`${photo.hash}\` | ${photo.width}×${photo.height} | ${kb(photo.bytes)} |`;
  });
  const icons = ICON_NAMES.map((name) => `| \`${name}\` | ${assets.icons.get(name).source} |`);
  return [
    "# Asset mapping",
    "",
    "Generated by `node scripts/extract-figma-assets.mjs` from the local Figma file. Do not edit by hand: run the script again.",
    "",
    `Source: \`${relative(root, figPath).replaceAll("\\", "/")}\` (not tracked by Git).`,
    "",
    "## Coffee photos",
    "",
    "Each photo is matched by the image hash of the card on the Home screen: the card is an instance of `Type=Catalog`; its title is its text override, and its photo is the symbol chosen for its `Coffee` instance. The grid order of the cards and the photo symbols of the Style Guide are cross-checks. Look at `coffee-images-contact-sheet.png` to check the result by eye.",
    "",
    "| # | Slug | Figma card | Figma photo symbol | Image hash | Size | Weight |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...rows,
    "",
    "## Icons",
    "",
    "Outlines of the symbols of the Style Guide, drawn in `currentColor`. The Figma names are normalized: `-regular` is dropped and `currenc-dollar` becomes `currency-dollar`.",
    "",
    "| Icon | Figma symbol |",
    "| --- | --- |",
    ...icons,
    "",
    "## Other assets",
    "",
    "| File | Figma source |",
    "| --- | --- |",
    `| \`logo/logo.svg\` | ${assets.logo.source} |`,
    `| \`hero/hero.png\` | ${assets.hero.source}, image \`${assets.hero.hash}\`, ${assets.hero.width}×${assets.hero.height} |`,
    `| \`success/delivery-illustration.svg\` | ${assets.illustration.source} |`,
    "",
  ].join("\n");
}

/** Extracts the assets of `figPath` into the app and the design docs. */
export async function extract(figPath, { assetsDir, designDir }) {
  const assets = collectAssets(readFileSync(figPath));

  for (const directory of ["logo", "icons", "coffees", "hero", "success"]) {
    rmSync(join(assetsDir, directory), { recursive: true, force: true });
  }
  write(join(assetsDir, "logo", "logo.svg"), assets.logo.svg);
  write(join(assetsDir, "success", "delivery-illustration.svg"), assets.illustration.svg);
  write(join(assetsDir, "hero", "hero.png"), assets.hero.bytes);
  for (const name of ICON_NAMES)
    write(join(assetsDir, "icons", `${name}.svg`), assets.icons.get(name).svg);
  for (const slug of COFFEE_SLUGS)
    write(join(assetsDir, "coffees", `${slug}.png`), assets.photos.get(slug).bytes);

  write(join(designDir, "assets-mapping.md"), mappingDocument(assets, figPath));
  write(join(designDir, "coffee-images-contact-sheet.png"), await contactSheet(assets.photos));

  const photoBytes = [...assets.photos.values()].reduce(
    (sum, photo) => sum + photo.bytes.length,
    0,
  );
  return {
    icons: ICON_NAMES.length,
    photos: COFFEE_SLUGS.length,
    photoBytes,
    heroBytes: assets.hero.bytes.length,
    files: readdirSync(join(assetsDir, "coffees")).length,
  };
}

async function main() {
  const figPath = resolve(process.argv[2] ?? join(root, FIG_FILE));
  if (!existsSync(figPath)) {
    console.error(missingFigMessage(figPath));
    process.exit(1);
  }
  const result = await extract(figPath, {
    assetsDir: join(root, "apps/app/src/assets"),
    designDir: join(root, "docs/design"),
  });
  console.log(
    `Wrote ${result.icons} icons, ${result.photos} coffee photos (${(result.photoBytes / 1024).toFixed(0)} kB), ` +
      `the hero image (${(result.heroBytes / 1024).toFixed(0)} kB), the logo, and the illustration.`,
  );
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
